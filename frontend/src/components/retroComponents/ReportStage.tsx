import { useState, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Share2, 
  Copy, 
  CheckCircle2, 
  ThumbsUp, 
  MessageCircle, 
  Target, 
  Users, 
  Calendar,
  Clock,
  Flag,
  User,
  TrendingUp,
  BarChart3,
  AlertCircle,
  Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Template {
  id: string;
  name: string;
  columns: Array<{
    id: string;
    name: string;
    color: string;
    placeholder: string;
  }>;
}

interface Card {
  id: string;
  columnId: string;
  content: string;
  authorId: string;
  groupId: string | null;
  createdAt: Date;
}

interface CardGroup {
  id: string;
  cardIds: string[];
  columnId: string;
}

interface VoteData {
  [itemId: string]: string[];
}

interface Participant {
  id: string;
  name: string;
  joinedAt: Date;
  isCreator?: boolean;
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface ReportStageProps {
  template: Template | undefined;
  retroId: string;
  retroName: string;
  retroContext: string;
  cards: Card[];
  cardGroups: CardGroup[];
  votes: VoteData;
  participants: Participant[];
  actionItems: ActionItem[];
}

export default function ReportStage({ 
  template, 
  retroId,
  retroName,
  retroContext,
  cards, 
  cardGroups,
  votes,
  participants,
  actionItems
}: ReportStageProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copied, setCopied] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Calculate statistics
  const totalCards = cards.length;
  const totalVotes = Object.values(votes).reduce((sum, voters) => sum + voters.length, 0);
  const totalActions = actionItems.length;
  const completedActions = actionItems.filter(a => a.status === 'completed').length;
  const highPriorityActions = actionItems.filter(a => a.priority === 'high').length;

  // Get vote count for an item
  const getVoteCount = (itemId: string): number => {
    return votes[itemId]?.length || 0;
  };

  // Get cards by column
  const getCardsByColumn = () => {
    const columnData: { [columnId: string]: { cards: Card[]; groups: { id: string; cards: Card[]; voteCount: number }[] } } = {};
    
    template?.columns.forEach(col => {
      columnData[col.id] = { cards: [], groups: [] };
    });

    const processedCardIds = new Set<string>();

    cards.forEach(card => {
      if (processedCardIds.has(card.id)) return;

      const group = cardGroups.find(g => g.cardIds.includes(card.id));
      
      if (group) {
        const groupCards = group.cardIds
          .map(id => cards.find(c => c.id === id))
          .filter(Boolean) as Card[];
        
        if (columnData[group.columnId]) {
          columnData[group.columnId].groups.push({
            id: group.id,
            cards: groupCards,
            voteCount: getVoteCount(group.id)
          });
        }
        
        group.cardIds.forEach(id => processedCardIds.add(id));
      } else {
        if (columnData[card.columnId]) {
          columnData[card.columnId].cards.push(card);
        }
        processedCardIds.add(card.id);
      }
    });

    return columnData;
  };

  // Get top voted items
  const getTopVotedItems = (limit: number = 10) => {
    const items: { id: string; content: string; columnId: string; voteCount: number; type: 'card' | 'group' }[] = [];
    const processedCardIds = new Set<string>();

    cards.forEach(card => {
      if (processedCardIds.has(card.id)) return;

      const group = cardGroups.find(g => g.cardIds.includes(card.id));
      
      if (group) {
        const groupCards = group.cardIds
          .map(id => cards.find(c => c.id === id))
          .filter(Boolean) as Card[];
        
        items.push({
          id: group.id,
          content: groupCards.map(c => c.content).join(' • '),
          columnId: group.columnId,
          voteCount: getVoteCount(group.id),
          type: 'group'
        });
        
        group.cardIds.forEach(id => processedCardIds.add(id));
      } else {
        items.push({
          id: card.id,
          content: card.content,
          columnId: card.columnId,
          voteCount: getVoteCount(card.id),
          type: 'card'
        });
        processedCardIds.add(card.id);
      }
    });

    return items.sort((a, b) => b.voteCount - a.voteCount).slice(0, limit);
  };

  const columnData = getCardsByColumn();
  const topVotedItems = getTopVotedItems(10);

  const getColumnInfo = (columnId: string) => {
    return template?.columns.find(c => c.id === columnId);
  };

  const getAssigneeName = (assigneeId: string) => {
    const participant = participants.find(p => p.id === assigneeId);
    return participant?.name || 'Unassigned';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Generate PDF using browser print
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    
    try {
      // Dynamic import of jspdf and html2canvas
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);

      const reportElement = reportRef.current;
      if (!reportElement) {
        throw new Error('Report element not found');
      }

      // Create canvas from the report element
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `${retroName.replace(/[^a-z0-9]/gi, '_')}_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);
      
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Copy report as text
  const handleCopyReport = () => {
    let reportText = `
RETROSPECTIVE REPORT
====================

Session: ${retroName}
Date: ${format(new Date(), 'MMMM d, yyyy')}
Template: ${template?.name || 'Unknown'}
Participants: ${participants.length}

SUMMARY STATISTICS
------------------
• Total Cards: ${totalCards}
• Total Votes: ${totalVotes}
• Action Items: ${totalActions}
• Completed Actions: ${completedActions}

TOP VOTED ITEMS
---------------
${topVotedItems.map((item, i) => `${i + 1}. [${getColumnInfo(item.columnId)?.name}] ${item.content} (${item.voteCount} votes)`).join('\n')}

ACTION ITEMS
------------
${actionItems.length > 0 ? actionItems.map(action => 
`• ${action.title}
  Assignee: ${getAssigneeName(action.assigneeId)}
  Priority: ${action.priority}
  Due: ${action.dueDate ? format(new Date(action.dueDate), 'MMM d, yyyy') : 'Not set'}
  Status: ${action.status.replace('_', ' ')}`
).join('\n\n') : 'No action items'}

FEEDBACK BY CATEGORY
--------------------
${template?.columns.map(col => {
  const colCards = columnData[col.id]?.cards || [];
  const colGroups = columnData[col.id]?.groups || [];
  const allItems = [
    ...colCards.map(c => `  - ${c.content} (${getVoteCount(c.id)} votes)`),
    ...colGroups.map(g => `  - [Group] ${g.cards.map(c => c.content).join(' | ')} (${g.voteCount} votes)`)
  ];
  return `${col.name}:\n${allItems.length > 0 ? allItems.join('\n') : '  No items'}`;
}).join('\n\n')}

PARTICIPANTS
------------
${participants.map(p => `• ${p.name}${p.isCreator ? ' (Facilitator)' : ''}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      toast.success('Report copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error('Failed to copy report');
    });
  };

  // Print report
  const handlePrint = () => {
    window.print();
  };

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No template found for this retrospective.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 dark:bg-indigo-500 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Session Report</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Review summary and export your retrospective
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Printable Report Content */}
      <div ref={reportRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 print:shadow-none print:border-none">
        {/* Report Header */}
        <div className="text-center mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {retroName || 'Retrospective Report'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-1">
            {format(new Date(), 'MMMM d, yyyy')} • {template.name} Template
          </p>
          {retroContext && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 max-w-2xl mx-auto">
              {retroContext}
            </p>
          )}
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{participants.length}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Participants</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
            <MessageCircle className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalCards}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Cards</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-center">
            <ThumbsUp className="w-6 h-6 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalVotes}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Votes</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 text-center">
            <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalActions}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Actions</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{highPriorityActions}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">High Priority</div>
          </div>
        </div>

        {/* Top Voted Items */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-kone-blue dark:text-kone-lightBlue" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Voted Items</h2>
          </div>
          {topVotedItems.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No voted items</p>
          ) : (
            <div className="space-y-2">
              {topVotedItems.map((item, index) => {
                const column = getColumnInfo(item.columnId);
                return (
                  <div 
                    key={item.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-kone-blue dark:bg-kone-lightBlue text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {item.content}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span 
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${column?.color}20`, color: column?.color }}
                        >
                          {column?.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {item.voteCount} votes
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Items */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Action Items</h2>
          </div>
          {actionItems.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No action items created</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-300">Action</th>
                    <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-300">Assignee</th>
                    <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-300">Priority</th>
                    <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-300">Due Date</th>
                    <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {actionItems.map(action => (
                    <tr key={action.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{action.title}</p>
                          {action.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{action.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                          <User className="w-3 h-3" />
                          {getAssigneeName(action.assigneeId)}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(action.priority)}`}>
                          {action.priority}
                        </span>
                      </td>
                      <td className="p-3 text-gray-700 dark:text-gray-300">
                        {action.dueDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(action.dueDate), 'MMM d, yyyy')}
                          </div>
                        ) : (
                          <span className="text-gray-400">Not set</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(action.status)}`}>
                          {action.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Feedback by Category */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Feedback by Category</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {template.columns.map(column => {
              const colCards = columnData[column.id]?.cards || [];
              const colGroups = columnData[column.id]?.groups || [];
              const totalItems = colCards.length + colGroups.length;
              
              return (
                <div 
                  key={column.id}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: column.color }}
                    />
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{column.name}</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                      {totalItems} items
                    </span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {colCards.map(card => (
                      <div 
                        key={card.id}
                        className="p-2 bg-white dark:bg-gray-800 rounded border-l-2 text-sm"
                        style={{ borderColor: column.color }}
                      >
                        <p className="text-gray-700 dark:text-gray-300">{card.content}</p>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                          <ThumbsUp className="w-3 h-3" />
                          {getVoteCount(card.id)}
                        </span>
                      </div>
                    ))}
                    {colGroups.map(group => (
                      <div 
                        key={group.id}
                        className="p-2 bg-white dark:bg-gray-800 rounded border-l-2 text-sm"
                        style={{ borderColor: column.color }}
                      >
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">Group</span>
                        </div>
                        {group.cards.map((card, i) => (
                          <p key={card.id} className="text-gray-700 dark:text-gray-300">
                            {i > 0 && <span className="text-gray-400 mx-1">•</span>}
                            {card.content}
                          </p>
                        ))}
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                          <ThumbsUp className="w-3 h-3" />
                          {group.voteCount}
                        </span>
                      </div>
                    ))}
                    {totalItems === 0 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">No items</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Participants */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Participants</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {participants.map(participant => (
              <div 
                key={participant.id}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="w-8 h-8 bg-kone-blue dark:bg-kone-lightBlue text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {participant.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {participant.name}
                  </span>
                  {participant.isCreator && (
                    <span className="ml-2 text-xs px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
                      Facilitator
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Generated by KONE Retrospective Tool • {format(new Date(), 'MMMM d, yyyy h:mm a')}
          </p>
        </div>
      </div>
    </div>
  );
}
