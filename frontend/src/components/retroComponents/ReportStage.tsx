import { useState } from 'react';
import { 
  FileText, 
  Download, 
  ThumbsUp, 
  MessageCircle, 
  Target, 
  Users, 
  Calendar,
  User,
  TrendingUp,
  BarChart3,
  AlertCircle
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
  retroName,
  retroContext,
  cards, 
  cardGroups,
  votes,
  participants,
  actionItems
}: ReportStageProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Calculate statistics
  const totalCards = cards.length;
  const totalVotes = Object.values(votes).reduce((sum, voters) => sum + voters.length, 0);
  const totalActions = actionItems.length;
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

  // Generate text-based PDF
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    
    try {
      const { default: jsPDF } = await import('jspdf');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;

      // Helper function to check if we need a new page
      const checkNewPage = (requiredSpace: number) => {
        if (yPos + requiredSpace > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      // Helper function to add wrapped text
      const addWrappedText = (text: string, x: number, fontSize: number, maxWidth: number, lineHeight: number = 1.2) => {
        pdf.setFontSize(fontSize);
        const lines = pdf.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
          checkNewPage(fontSize * 0.35 * lineHeight);
          pdf.text(line, x, yPos);
          yPos += fontSize * 0.35 * lineHeight;
        });
      };

      // ===== HEADER =====
      pdf.setFillColor(0, 82, 147); // KONE blue
      pdf.rect(0, 0, pageWidth, 35, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RETROSPECTIVE REPORT', pageWidth / 2, 15, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(retroName || 'Untitled Session', pageWidth / 2, 23, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.text(`${format(new Date(), 'MMMM d, yyyy')} • ${template?.name || 'Unknown'} Template`, pageWidth / 2, 30, { align: 'center' });
      
      yPos = 45;
      pdf.setTextColor(0, 0, 0);

      // ===== CONTEXT (if available) =====
      if (retroContext) {
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        addWrappedText(retroContext, margin, 10, contentWidth);
        yPos += 5;
        pdf.setTextColor(0, 0, 0);
      }

      // ===== STATISTICS =====
      checkNewPage(25);
      pdf.setFillColor(245, 247, 250);
      pdf.rect(margin, yPos, contentWidth, 20, 'F');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      const statsY = yPos + 8;
      const statWidth = contentWidth / 5;
      
      const stats = [
        { label: 'Participants', value: participants.length.toString() },
        { label: 'Cards', value: totalCards.toString() },
        { label: 'Votes', value: totalVotes.toString() },
        { label: 'Actions', value: totalActions.toString() },
        { label: 'High Priority', value: highPriorityActions.toString() }
      ];
      
      stats.forEach((stat, i) => {
        const x = margin + (statWidth * i) + (statWidth / 2);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 82, 147);
        pdf.text(stat.value, x, statsY, { align: 'center' });
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text(stat.label, x, statsY + 6, { align: 'center' });
      });
      
      yPos += 28;
      pdf.setTextColor(0, 0, 0);

      // ===== TOP VOTED ITEMS =====
      checkNewPage(15);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 82, 147);
      pdf.text('Top Voted Items', margin, yPos);
      yPos += 8;
      pdf.setTextColor(0, 0, 0);

      if (topVotedItems.length === 0) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(128, 128, 128);
        pdf.text('No voted items', margin, yPos);
        yPos += 6;
      } else {
        topVotedItems.forEach((item, index) => {
          checkNewPage(12);
          const column = getColumnInfo(item.columnId);
          
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}.`, margin, yPos);
          
          // Category tag
          pdf.setFillColor(230, 230, 230);
          const tagText = column?.name || 'Unknown';
          const tagWidth = pdf.getTextWidth(tagText) + 4;
          pdf.roundedRect(margin + 8, yPos - 3.5, tagWidth, 5, 1, 1, 'F');
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.text(tagText, margin + 10, yPos);
          
          // Vote count
          pdf.setFontSize(9);
          pdf.setTextColor(0, 82, 147);
          pdf.text(`(${item.voteCount} votes)`, pageWidth - margin, yPos, { align: 'right' });
          pdf.setTextColor(0, 0, 0);
          
          yPos += 5;
          
          // Content
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const truncatedContent = item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content;
          addWrappedText(truncatedContent, margin + 8, 10, contentWidth - 15);
          yPos += 3;
        });
      }
      yPos += 5;

      // ===== ACTION ITEMS =====
      checkNewPage(20);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 82, 147);
      pdf.text('Action Items', margin, yPos);
      yPos += 8;
      pdf.setTextColor(0, 0, 0);

      if (actionItems.length === 0) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(128, 128, 128);
        pdf.text('No action items created', margin, yPos);
        yPos += 6;
      } else {
        // Table header
        checkNewPage(10);
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, yPos - 4, contentWidth, 7, 'F');
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Action', margin + 2, yPos);
        pdf.text('Assignee', margin + 75, yPos);
        pdf.text('Priority', margin + 115, yPos);
        pdf.text('Due Date', margin + 145, yPos);
        yPos += 6;

        // Table rows
        actionItems.forEach((action) => {
          checkNewPage(12);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          
          // Action title (truncated)
          const title = action.title.length > 35 ? action.title.substring(0, 35) + '...' : action.title;
          pdf.text(title, margin + 2, yPos);
          
          // Assignee
          const assignee = getAssigneeName(action.assigneeId);
          const assigneeText = assignee.length > 15 ? assignee.substring(0, 15) + '...' : assignee;
          pdf.text(assigneeText, margin + 75, yPos);
          
          // Priority with color
          if (action.priority === 'high') {
            pdf.setTextColor(220, 38, 38);
          } else if (action.priority === 'medium') {
            pdf.setTextColor(202, 138, 4);
          } else {
            pdf.setTextColor(22, 163, 74);
          }
          pdf.text(action.priority.charAt(0).toUpperCase() + action.priority.slice(1), margin + 115, yPos);
          pdf.setTextColor(0, 0, 0);
          
          // Due date
          const dueDate = action.dueDate ? format(new Date(action.dueDate), 'MMM d, yyyy') : 'Not set';
          pdf.text(dueDate, margin + 145, yPos);
          
          yPos += 6;
        });
      }
      yPos += 5;

      // ===== FEEDBACK BY CATEGORY =====
      checkNewPage(20);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 82, 147);
      pdf.text('Feedback by Category', margin, yPos);
      yPos += 8;
      pdf.setTextColor(0, 0, 0);

      template?.columns.forEach((column) => {
        const colCards = columnData[column.id]?.cards || [];
        const colGroups = columnData[column.id]?.groups || [];
        const totalItems = colCards.length + colGroups.length;

        checkNewPage(15);
        
        // Column header
        pdf.setFillColor(245, 247, 250);
        pdf.rect(margin, yPos - 4, contentWidth, 7, 'F');
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${column.name} (${totalItems} items)`, margin + 2, yPos);
        yPos += 6;

        if (totalItems === 0) {
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(128, 128, 128);
          pdf.text('No items', margin + 5, yPos);
          yPos += 5;
          pdf.setTextColor(0, 0, 0);
        } else {
          // Individual cards
          colCards.forEach((card) => {
            checkNewPage(10);
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            const voteText = `(${getVoteCount(card.id)} votes)`;
            pdf.setTextColor(100, 100, 100);
            pdf.text(voteText, pageWidth - margin, yPos, { align: 'right' });
            pdf.setTextColor(0, 0, 0);
            
            pdf.text('•', margin + 3, yPos);
            const cardContent = card.content.length > 80 ? card.content.substring(0, 80) + '...' : card.content;
            addWrappedText(cardContent, margin + 8, 9, contentWidth - 30);
          });

          // Groups
          colGroups.forEach((group) => {
            checkNewPage(10);
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            
            pdf.setTextColor(100, 100, 100);
            pdf.text(`(${group.voteCount} votes)`, pageWidth - margin, yPos, { align: 'right' });
            pdf.setTextColor(0, 0, 0);
            
            pdf.text('•', margin + 3, yPos);
            pdf.setFont('helvetica', 'italic');
            pdf.text('[Group]', margin + 8, yPos);
            pdf.setFont('helvetica', 'normal');
            yPos += 4;
            
            group.cards.forEach((card) => {
              checkNewPage(6);
              const cardContent = card.content.length > 70 ? card.content.substring(0, 70) + '...' : card.content;
              pdf.text(`  - ${cardContent}`, margin + 10, yPos);
              yPos += 4;
            });
            yPos += 2;
          });
        }
        yPos += 5;
      });

      // ===== PARTICIPANTS =====
      checkNewPage(20);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 82, 147);
      pdf.text('Participants', margin, yPos);
      yPos += 8;
      pdf.setTextColor(0, 0, 0);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const participantList = participants.map(p => p.name + (p.isCreator ? ' (Facilitator)' : '')).join(', ');
      addWrappedText(participantList, margin, 10, contentWidth);

      // ===== FOOTER =====
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Generated by KONE Retrospective Tool • ${format(new Date(), 'MMMM d, yyyy h:mm a')} • Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: 'center' }
        );
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 print:shadow-none print:border-none">
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
