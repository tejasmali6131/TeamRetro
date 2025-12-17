import { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Trash2, 
  User, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Edit2, 
  Save, 
  Flag,
  ThumbsUp,
  MessageCircle,
  Target,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

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
  sourceItemId?: string; // Reference to the card/group this action came from
}

interface ReviewStageProps {
  template: Template | undefined;
  currentUserId: string;
  ws: WebSocket | null;
  retroId: string;
  cards: Card[];
  cardGroups: CardGroup[];
  votes: VoteData;
  participants: Participant[];
  isRoomCreator: boolean;
  actionItems: ActionItem[];
  setActionItems: React.Dispatch<React.SetStateAction<ActionItem[]>>;
}

export default function ReviewStage({ 
  template, 
  ws, 
  retroId,
  cards, 
  cardGroups,
  votes,
  participants,
  isRoomCreator,
  actionItems,
  setActionItems
}: ReviewStageProps) {
  const [isAddingAction, setIsAddingAction] = useState(false);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [newAction, setNewAction] = useState<Partial<ActionItem>>({
    title: '',
    description: '',
    assigneeId: '',
    priority: 'medium',
    dueDate: '',
    status: 'pending'
  });

  // Get vote count for an item
  const getVoteCount = (itemId: string): number => {
    return votes[itemId]?.length || 0;
  };

  // Get top voted items for summary
  const getTopVotedItems = () => {
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

    return items.sort((a, b) => b.voteCount - a.voteCount).slice(0, 5);
  };

  const topVotedItems = getTopVotedItems();
  const totalCards = cards.length;
  const totalVotes = Object.values(votes).reduce((sum, voters) => sum + voters.length, 0);

  // Note: WebSocket handling for action items is done in RetroBoard.tsx
  // This component only sends messages, receiving is handled at the parent level

  const handleAddAction = () => {
    if (!newAction.title?.trim()) {
      toast.error('Please enter an action title');
      return;
    }

    const actionItem: ActionItem = {
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: newAction.title.trim(),
      description: newAction.description?.trim() || '',
      assigneeId: newAction.assigneeId || '',
      priority: newAction.priority || 'medium',
      dueDate: newAction.dueDate || '',
      status: 'pending'
    };

    setActionItems(prev => [...prev, actionItem]);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'action-item-update',
        action: 'action-added',
        retroId,
        actionItem
      }));
    }

    setNewAction({
      title: '',
      description: '',
      assigneeId: '',
      priority: 'medium',
      dueDate: '',
      status: 'pending'
    });
    setIsAddingAction(false);
    toast.success('Action item added');
  };

  const handleUpdateAction = (actionItem: ActionItem) => {
    setActionItems(prev => prev.map(item => 
      item.id === actionItem.id ? actionItem : item
    ));
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'action-item-update',
        action: 'action-updated',
        retroId,
        actionItem
      }));
    }

    setEditingActionId(null);
    toast.success('Action item updated');
  };

  const handleDeleteAction = (actionId: string) => {
    setActionItems(prev => prev.filter(item => item.id !== actionId));
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'action-item-update',
        action: 'action-deleted',
        retroId,
        actionItemId: actionId
      }));
    }

    toast.success('Action item deleted');
  };

  const handleQuickAddFromTopVoted = (item: typeof topVotedItems[0]) => {
    const columnName = template?.columns.find(c => c.id === item.columnId)?.name || 'Item';
    setNewAction({
      title: `Action for: ${item.content.substring(0, 50)}${item.content.length > 50 ? '...' : ''}`,
      description: `From ${columnName}: ${item.content}`,
      assigneeId: '',
      priority: 'medium',
      dueDate: '',
      status: 'pending'
    });
    setIsAddingAction(true);
  };

  const getColumnInfo = (columnId: string) => {
    return template?.columns.find(c => c.id === columnId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'low': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getAssigneeName = (assigneeId: string) => {
    const participant = participants.find(p => p.id === assigneeId);
    return participant?.name || 'Unassigned';
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
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-600 dark:bg-emerald-500 rounded-full flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Review & Actions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create action items based on discussion outcomes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full shadow-sm">
              <MessageCircle className="w-4 h-4 text-kone-blue dark:text-kone-lightBlue" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{totalCards} Cards</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full shadow-sm">
              <ThumbsUp className="w-4 h-4 text-kone-blue dark:text-kone-lightBlue" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{totalVotes} Votes</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full shadow-sm">
              <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{actionItems.length} Actions</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Voted Items Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-4">
            <ThumbsUp className="w-5 h-5 text-kone-blue dark:text-kone-lightBlue" />
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">Top Voted Items</h4>
          </div>
          
          {topVotedItems.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
              No voted items yet
            </p>
          ) : (
            <div className="space-y-3">
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
                      <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2 break-all">
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
                          {item.voteCount}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleQuickAddFromTopVoted(item)}
                      className="flex-shrink-0 p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                      title="Create action from this item"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Items List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Action Items</h4>
            </div>
            <button
              onClick={() => setIsAddingAction(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 dark:bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Action
            </button>
          </div>

          {/* Add Action Form */}
          {isAddingAction && (
            <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Action title..."
                  value={newAction.title || ''}
                  onChange={(e) => setNewAction(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <textarea
                  placeholder="Description (optional)..."
                  value={newAction.description || ''}
                  onChange={(e) => setNewAction(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                />
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Assignee</label>
                    <select
                      value={newAction.assigneeId || ''}
                      onChange={(e) => setNewAction(prev => ({ ...prev, assigneeId: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">Unassigned</option>
                      {participants.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Priority</label>
                    <select
                      value={newAction.priority || 'medium'}
                      onChange={(e) => setNewAction(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                      className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={newAction.dueDate || ''}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setNewAction(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setIsAddingAction(false);
                      setNewAction({
                        title: '',
                        description: '',
                        assigneeId: '',
                        priority: 'medium',
                        dueDate: '',
                        status: 'pending'
                      });
                    }}
                    className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddAction}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors flex items-center gap-1"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Items */}
          {actionItems.length === 0 && !isAddingAction ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">No action items yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                Click "Add Action" or use the + button on top voted items
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {actionItems.map(action => (
                <ActionItemCard
                  key={action.id}
                  action={action}
                  isEditing={editingActionId === action.id}
                  canModify={isRoomCreator}
                  onEdit={() => setEditingActionId(action.id)}
                  onSave={handleUpdateAction}
                  onCancel={() => setEditingActionId(null)}
                  onDelete={() => handleDeleteAction(action.id)}
                  participants={participants}
                  getAssigneeName={getAssigneeName}
                  getPriorityColor={getPriorityColor}
                  getStatusIcon={getStatusIcon}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-kone-blue dark:text-kone-lightBlue" />
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">Team Participation</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {participants.map(participant => {
            const participantCards = cards.filter(c => c.authorId === participant.id).length;
            const participantVotes = Object.values(votes).filter(voters => voters.includes(participant.id)).length;
            const assignedActions = actionItems.filter(a => a.assigneeId === participant.id).length;
            
            return (
              <div 
                key={participant.id}
                className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-kone-blue dark:bg-kone-lightBlue text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {participant.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    {participantCards}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    {participantVotes}
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {assignedActions}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Action Item Card Component
interface ActionItemCardProps {
  action: ActionItem;
  isEditing: boolean;
  canModify: boolean;
  onEdit: () => void;
  onSave: (action: ActionItem) => void;
  onCancel: () => void;
  onDelete: () => void;
  participants: Participant[];
  getAssigneeName: (id: string) => string;
  getPriorityColor: (priority: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
}

function ActionItemCard({ 
  action, 
  isEditing, 
  canModify,
  onEdit, 
  onSave, 
  onCancel, 
  onDelete,
  participants,
  getAssigneeName,
  getPriorityColor,
  getStatusIcon
}: ActionItemCardProps) {
  const [editedAction, setEditedAction] = useState(action);

  useEffect(() => {
    setEditedAction(action);
  }, [action]);

  if (isEditing) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-emerald-300 dark:border-emerald-700">
        <div className="space-y-3">
          <input
            type="text"
            value={editedAction.title}
            onChange={(e) => setEditedAction(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <textarea
            value={editedAction.description}
            onChange={(e) => setEditedAction(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
          />
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Assignee</label>
              <select
                value={editedAction.assigneeId}
                onChange={(e) => setEditedAction(prev => ({ ...prev, assigneeId: e.target.value }))}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="">Unassigned</option>
                {participants.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Priority</label>
              <select
                value={editedAction.priority}
                onChange={(e) => setEditedAction(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Status</label>
              <select
                value={editedAction.status}
                onChange={(e) => setEditedAction(prev => ({ ...prev, status: e.target.value as 'pending' | 'in_progress' | 'completed' }))}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Due Date</label>
              <input
                type="date"
                value={editedAction.dueDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setEditedAction(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(editedAction)}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors flex items-center gap-1"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getStatusIcon(action.status)}
            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
              {action.title}
            </span>
          </div>
          {action.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
              {action.description}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${getPriorityColor(action.priority)}`}>
              <Flag className="w-3 h-3" />
              {action.priority}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <User className="w-3 h-3" />
              {getAssigneeName(action.assigneeId)}
            </span>
            {action.dueDate && action.dueDate !== '' && (
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(action.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        {canModify && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="p-1.5 text-gray-500 hover:text-kone-blue dark:hover:text-kone-lightBlue hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
