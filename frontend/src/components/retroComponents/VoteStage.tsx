import { useState, useEffect } from 'react';
import { Plus, Minus, Award, AlertCircle, ThumbsUp, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Template, Card, CardGroup, VoteData } from '@/types/retroBoard';

interface VoteStageProps {
  template: Template | undefined;
  currentUserId: string;
  ws: WebSocket | null;
  retroId: string;
  cards: Card[];
  cardGroups: CardGroup[];
  votingLimit: number;
  votes: VoteData;
  setVotes: React.Dispatch<React.SetStateAction<VoteData>>;
  stageId: string;
  isDone: boolean;
}

export default function VoteStage({ 
  template, 
  currentUserId, 
  ws, 
  retroId,
  cards, 
  cardGroups,
  votingLimit,
  votes,
  setVotes,
  stageId,
  isDone
}: VoteStageProps) {
  const [localIsDone, setLocalIsDone] = useState(isDone);

  // Sync local state with prop
  useEffect(() => {
    setLocalIsDone(isDone);
  }, [isDone]);

  const handleToggleDone = () => {
    if (!ws) return;
    const newDoneState = !localIsDone;
    setLocalIsDone(newDoneState);
    ws.send(JSON.stringify({
      type: 'mark-stage-done',
      retroId,
      stageId,
      isDone: newDoneState
    }));
  };
  
  // Calculate user's total votes used
  const getUserVotesUsed = (): number => {
    let count = 0;
    Object.values(votes).forEach(voters => {
      count += voters.filter(voterId => voterId === currentUserId).length;
    });
    return count;
  };

  const votesUsed = getUserVotesUsed();
  const votesRemaining = votingLimit - votesUsed;

  // Get vote count for a card/group
  const getVoteCount = (itemId: string): number => {
    return votes[itemId]?.length || 0;
  };

  // Get number of times current user voted on this item
  const getUserVoteCountForItem = (itemId: string): number => {
    return votes[itemId]?.filter(id => id === currentUserId).length || 0;
  };

  // Handle voting on a card or group
  const handleVote = (itemId: string, columnId: string) => {
    if (votesRemaining <= 0) {
      toast.error(`You've used all ${votingLimit} votes!`);
      return;
    }

    // Update local state
    setVotes(prev => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), currentUserId]
    }));

    // Broadcast to others via WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'vote-add',
        retroId,
        itemId,
        columnId,
        userId: currentUserId
      }));
    }
  };

  // Handle removing a vote
  const handleUnvote = (itemId: string) => {
    const userVotes = votes[itemId]?.filter(id => id === currentUserId) || [];
    if (userVotes.length === 0) {
      return;
    }

    // Remove one vote from current user
    setVotes(prev => {
      const currentVotes = prev[itemId] || [];
      const userVoteIndex = currentVotes.findIndex(id => id === currentUserId);
      if (userVoteIndex === -1) return prev;
      
      const newVotes = [...currentVotes];
      newVotes.splice(userVoteIndex, 1);
      
      return {
        ...prev,
        [itemId]: newVotes
      };
    });

    // Broadcast to others
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'vote-remove',
        retroId,
        itemId,
        userId: currentUserId
      }));
    }
  };

  // Get cards that should be displayed (either ungrouped or represented by their group)
  const getDisplayableItems = (columnId: string): { type: 'card' | 'group'; id: string; cards: Card[] }[] => {
    const columnCards = cards.filter(card => card.columnId === columnId);
    const items: { type: 'card' | 'group'; id: string; cards: Card[] }[] = [];
    const processedCardIds = new Set<string>();

    for (const card of columnCards) {
      if (processedCardIds.has(card.id)) continue;

      const group = cardGroups.find(g => g.cardIds.includes(card.id));
      
      if (group) {
        // Add all cards in the group
        const groupCards = group.cardIds
          .map(id => cards.find(c => c.id === id))
          .filter(Boolean) as Card[];
        
        items.push({
          type: 'group',
          id: group.id,
          cards: groupCards
        });
        
        // Mark all cards in group as processed
        group.cardIds.forEach(id => processedCardIds.add(id));
      } else {
        // Single card
        items.push({
          type: 'card',
          id: card.id,
          cards: [card]
        });
        processedCardIds.add(card.id);
      }
    }

    // Sort by vote count (descending)
    return items.sort((a, b) => getVoteCount(b.id) - getVoteCount(a.id));
  };

  // Get top voted items across all columns
  const getTopVotedItems = (limit: number = 5) => {
    const allItems: { id: string; columnId: string; voteCount: number; content: string }[] = [];
    
    template?.columns.forEach(column => {
      const items = getDisplayableItems(column.id);
      items.forEach(item => {
        const voteCount = getVoteCount(item.id);
        if (voteCount > 0) {
          allItems.push({
            id: item.id,
            columnId: column.id,
            voteCount,
            content: item.cards.map(c => c.content).join(' | ')
          });
        }
      });
    });

    return allItems.sort((a, b) => b.voteCount - a.voteCount).slice(0, limit);
  };

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No template found for this retrospective.</p>
      </div>
    );
  }

  const topItems = getTopVotedItems();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Done Button */}
      <div className="flex justify-end">
        <button
          onClick={handleToggleDone}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors border-2 min-w-[120px] sm:min-w-[150px] justify-center text-sm sm:text-base ${
            localIsDone
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-500'
              : 'bg-kone-blue/10 dark:bg-kone-blue/20 text-kone-blue dark:text-kone-lightBlue hover:bg-kone-blue/20 dark:hover:bg-kone-blue/30 border-kone-blue dark:border-kone-lightBlue'
          }`}
        >
          <CheckCircle2 className={`w-4 h-4 sm:w-5 sm:h-5 ${localIsDone ? 'text-green-500' : 'text-kone-blue dark:text-kone-lightBlue'}`} />
          {localIsDone ? 'Done' : 'Mark as Done'}
        </button>
      </div>

      {/* Vote Info Banner */}
      <div className="bg-gradient-to-r from-kone-blue/10 to-indigo-100 dark:from-kone-blue/20 dark:to-indigo-900/30 rounded-xl p-3 sm:p-4 border border-kone-blue/20 dark:border-kone-lightBlue/30">
        <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-kone-blue dark:bg-kone-lightBlue rounded-full flex items-center justify-center">
              <ThumbsUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100">Cast Your Votes</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Click on cards to vote for the topics most important to discuss
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-center">
              <div className={`text-2xl sm:text-3xl font-bold ${votesRemaining > 0 ? 'text-kone-blue dark:text-kone-lightBlue' : 'text-red-500'}`}>
                {votesRemaining}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">votes left</div>
            </div>
            <div className="h-10 sm:h-12 w-px bg-gray-300 dark:bg-gray-600"></div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gray-700 dark:text-gray-300">
                {votesUsed}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">votes used</div>
            </div>
          </div>
        </div>
        
        {votesRemaining === 0 && (
          <div className="mt-3 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>You've used all your votes. Remove a vote to change your selection.</span>
          </div>
        )}
      </div>

      {/* Top Voted Summary (if any votes exist) */}
      {topItems.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-yellow-500" />
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">Top Voted</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {topItems.map((item, index) => {
              const column = template.columns.find(c => c.id === item.columnId);
              return (
                <div 
                  key={item.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
                >
                  <span className="font-bold text-kone-blue dark:text-kone-lightBlue">#{index + 1}</span>
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: column?.color }}
                  ></div>
                  <span className="text-gray-700 dark:text-gray-300 max-w-[200px] truncate">
                    {item.content.substring(0, 50)}{item.content.length > 50 ? '...' : ''}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    ({item.voteCount})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Voting Columns */}
      <div className="overflow-x-auto overflow-y-hidden -mx-2 sm:mx-0 px-2 sm:px-0">
        <div className="flex gap-3 sm:gap-4 pb-2" style={{ width: 'max-content' }}>
          {template.columns.map((column) => {
            const items = getDisplayableItems(column.id);
            const columnTotalVotes = items.reduce((sum, item) => sum + getVoteCount(item.id), 0);
            
            return (
              <div
                key={column.id}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 min-h-[400px] flex-shrink-0"
                style={{ width: '300px' }}
              >
                {/* Column Header */}
                <div
                  className="flex items-center gap-2 mb-4 pb-2 border-b-2"
                  style={{ borderBottomColor: column.color }}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: column.color }}
                  ></div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{column.name}</h3>
                  <span className="ml-auto text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                  {columnTotalVotes > 0 && (
                    <span className="text-sm font-semibold text-kone-blue dark:text-kone-lightBlue">
                      ({columnTotalVotes} votes)
                    </span>
                  )}
                </div>

                {/* Cards/Groups Area */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {items.length === 0 && (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                      No cards in this column
                    </div>
                  )}

                  {items.map((item) => {
                    const voteCount = getVoteCount(item.id);
                    const userVoteCount = getUserVoteCountForItem(item.id);
                    const hasVoted = userVoteCount > 0;

                    return (
                      <div
                        key={item.id}
                        className={`rounded-lg p-3 shadow-sm transition-all border-2 ${
                          hasVoted 
                            ? 'bg-kone-blue/10 dark:bg-kone-lightBlue/10 border-kone-blue dark:border-kone-lightBlue' 
                            : 'bg-white dark:bg-gray-600 border-transparent hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        {/* Card Content */}
                        <div className="mb-3 overflow-hidden">
                          {item.type === 'group' ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
                                <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                  Grouped ({item.cards.length} cards)
                                </span>
                              </div>
                              {item.cards.map((card, idx) => (
                                <div 
                                  key={card.id}
                                  className={`text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-all ${
                                    idx > 0 ? 'pt-2 border-t border-gray-200 dark:border-gray-500' : ''
                                  }`}
                                >
                                  {card.content}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-all">
                              {item.cards[0]?.content}
                            </p>
                          )}
                        </div>

                        {/* Vote Controls */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-500">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <button
                                onClick={() => handleVote(item.id, column.id)}
                                disabled={votesRemaining <= 0}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                  votesRemaining > 0
                                    ? 'bg-kone-blue dark:bg-kone-lightBlue text-white hover:bg-kone-blue/90 dark:hover:bg-kone-lightBlue/90 shadow-sm'
                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
                                }`}
                                title="Add vote"
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                              {userVoteCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                                  {userVoteCount}
                                </span>
                              )}
                            </div>
                            
                            {userVoteCount > 0 && (
                              <button
                                onClick={() => handleUnvote(item.id)}
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all shadow-sm"
                                title="Remove vote"
                              >
                                <Minus className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                          
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                            voteCount > 0 
                              ? 'bg-kone-blue/20 dark:bg-kone-lightBlue/20 text-kone-blue dark:text-kone-lightBlue' 
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                          }`}>
                            <ThumbsUp className="w-3 h-3" />
                            <span className="text-sm font-semibold">{voteCount}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
