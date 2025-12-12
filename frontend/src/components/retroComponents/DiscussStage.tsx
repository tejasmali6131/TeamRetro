import { useState, useEffect } from 'react';
import { MessageCircle, ChevronLeft, ChevronRight, ThumbsUp, CheckCircle2, Clock, Play, Pause, RotateCcw, Users, Crown } from 'lucide-react';
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

interface DiscussionItem {
  id: string;
  type: 'card' | 'group';
  columnId: string;
  cards: Card[];
  voteCount: number;
  discussed: boolean;
}

interface DiscussStageProps {
  template: Template | undefined;
  currentUserId: string;
  ws: WebSocket | null;
  retroId: string;
  cards: Card[];
  cardGroups: CardGroup[];
  votes: VoteData;
  isRoomCreator: boolean;
  discussedItems: Set<string>;
  setDiscussedItems: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export default function DiscussStage({ 
  template, 
  currentUserId, 
  ws, 
  retroId,
  cards, 
  cardGroups,
  votes,
  isRoomCreator,
  discussedItems,
  setDiscussedItems
}: DiscussStageProps) {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [discussionTimer, setDiscussionTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerDuration, setTimerDuration] = useState(120); // 2 minutes default

  // Get vote count for an item
  const getVoteCount = (itemId: string): number => {
    return votes[itemId]?.length || 0;
  };

  // Build sorted list of discussion items (sorted by vote count descending)
  const getDiscussionItems = (): DiscussionItem[] => {
    const items: DiscussionItem[] = [];
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
          type: 'group',
          columnId: group.columnId,
          cards: groupCards,
          voteCount: getVoteCount(group.id),
          discussed: discussedItems.has(group.id)
        });
        
        group.cardIds.forEach(id => processedCardIds.add(id));
      } else {
        items.push({
          id: card.id,
          type: 'card',
          columnId: card.columnId,
          cards: [card],
          voteCount: getVoteCount(card.id),
          discussed: discussedItems.has(card.id)
        });
        processedCardIds.add(card.id);
      }
    });

    // Sort by vote count (descending), then by discussed status
    return items.sort((a, b) => {
      if (a.discussed !== b.discussed) return a.discussed ? 1 : -1;
      return b.voteCount - a.voteCount;
    });
  };

  const discussionItems = getDiscussionItems();
  const currentItem = discussionItems[currentItemIndex];
  const totalItems = discussionItems.length;
  const discussedCount = discussedItems.size;

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning && discussionTimer > 0) {
      interval = setInterval(() => {
        setDiscussionTimer(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            toast('Time is up for this topic!', { icon: '⏰' });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, discussionTimer]);

  // Listen for WebSocket messages
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'discuss-update') {
          switch (data.action) {
            case 'item-changed':
              setCurrentItemIndex(data.itemIndex);
              setDiscussionTimer(0);
              setIsTimerRunning(false);
              break;
            // item-marked-discussed and item-unmarked-discussed are handled by RetroBoard
            case 'timer-started':
              setDiscussionTimer(data.duration);
              setIsTimerRunning(true);
              break;
            case 'timer-paused':
              setIsTimerRunning(false);
              break;
            case 'timer-resumed':
              setIsTimerRunning(true);
              break;
            case 'timer-reset':
              setDiscussionTimer(0);
              setIsTimerRunning(false);
              break;
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws]);

  const handlePreviousItem = () => {
    if (currentItemIndex > 0) {
      const newIndex = currentItemIndex - 1;
      setCurrentItemIndex(newIndex);
      setDiscussionTimer(0);
      setIsTimerRunning(false);
      
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'discuss-update',
          action: 'item-changed',
          retroId,
          itemIndex: newIndex
        }));
      }
    }
  };

  const handleNextItem = () => {
    if (currentItemIndex < totalItems - 1) {
      const newIndex = currentItemIndex + 1;
      setCurrentItemIndex(newIndex);
      setDiscussionTimer(0);
      setIsTimerRunning(false);
      
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'discuss-update',
          action: 'item-changed',
          retroId,
          itemIndex: newIndex
        }));
      }
    }
  };

  const handleMarkDiscussed = (itemId: string) => {
    const isCurrentlyDiscussed = discussedItems.has(itemId);
    
    if (isCurrentlyDiscussed) {
      setDiscussedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    } else {
      setDiscussedItems(prev => new Set([...prev, itemId]));
    }

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'discuss-update',
        action: isCurrentlyDiscussed ? 'item-unmarked-discussed' : 'item-marked-discussed',
        retroId,
        itemId
      }));
    }
  };

  const handleStartTimer = () => {
    setDiscussionTimer(timerDuration);
    setIsTimerRunning(true);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'discuss-update',
        action: 'timer-started',
        retroId,
        duration: timerDuration
      }));
    }
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'discuss-update',
        action: 'timer-paused',
        retroId
      }));
    }
  };

  const handleResumeTimer = () => {
    setIsTimerRunning(true);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'discuss-update',
        action: 'timer-resumed',
        retroId
      }));
    }
  };

  const handleResetTimer = () => {
    setDiscussionTimer(0);
    setIsTimerRunning(false);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'discuss-update',
        action: 'timer-reset',
        retroId
      }));
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getColumnInfo = (columnId: string) => {
    return template?.columns.find(c => c.id === columnId);
  };

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No template found for this retrospective.</p>
      </div>
    );
  }

  if (discussionItems.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 text-lg">No items to discuss</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Add cards in the Brainstorm stage first
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-600 dark:bg-purple-500 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Discussion Time</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Go through each topic and discuss as a team
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {discussedCount}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">discussed</div>
            </div>
            <div className="h-12 w-px bg-gray-300 dark:bg-gray-600"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-700 dark:text-gray-300">
                {totalItems - discussedCount}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">remaining</div>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-600 dark:bg-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${totalItems > 0 ? (discussedCount / totalItems) * 100 : 0}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
            {discussedCount} of {totalItems} items discussed
          </p>
        </div>
      </div>

      {/* Main Discussion Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Topic - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Topic Header */}
            <div 
              className="px-6 py-4 border-b-4"
              style={{ borderBottomColor: getColumnInfo(currentItem?.columnId)?.color || '#6366f1' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getColumnInfo(currentItem?.columnId)?.color }}
                  ></div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {getColumnInfo(currentItem?.columnId)?.name}
                  </span>
                  {currentItem?.type === 'group' && (
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                      Grouped ({currentItem.cards.length} cards)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-kone-blue/10 dark:bg-kone-lightBlue/10 rounded-full">
                    <ThumbsUp className="w-4 h-4 text-kone-blue dark:text-kone-lightBlue" />
                    <span className="text-sm font-semibold text-kone-blue dark:text-kone-lightBlue">
                      {currentItem?.voteCount || 0}
                    </span>
                  </div>
                  {currentItem?.discussed && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">Discussed</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Topic Content */}
            <div className="p-6">
              <div className="text-center mb-2 text-sm text-gray-500 dark:text-gray-400">
                Topic {currentItemIndex + 1} of {totalItems}
              </div>
              
              {currentItem?.type === 'group' ? (
                <div className="space-y-4">
                  {currentItem.cards.map((card, idx) => (
                    <div 
                      key={card.id}
                      className={`p-4 bg-gray-50 dark:bg-gray-700 rounded-lg ${
                        idx > 0 ? 'border-t-2 border-gray-200 dark:border-gray-600' : ''
                      }`}
                    >
                      <p className="text-lg text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {card.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-xl text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-center">
                    {currentItem?.cards[0]?.content}
                  </p>
                </div>
              )}

              {/* Navigation and Actions */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                {isRoomCreator ? (
                  <button
                    onClick={handlePreviousItem}
                    disabled={currentItemIndex === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Previous
                  </button>
                ) : (
                  <div className="w-24"></div>
                )}

                {isRoomCreator ? (
                  <button
                    onClick={() => currentItem && handleMarkDiscussed(currentItem.id)}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
                      currentItem?.discussed
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                        : 'bg-purple-600 dark:bg-purple-500 text-white hover:bg-purple-700 dark:hover:bg-purple-600'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {currentItem?.discussed ? 'Discussed' : 'Mark as Discussed'}
                  </button>
                ) : (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    currentItem?.discussed
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm">{currentItem?.discussed ? 'Discussed' : 'Pending'}</span>
                  </div>
                )}

                {isRoomCreator ? (
                  <button
                    onClick={handleNextItem}
                    disabled={currentItemIndex === totalItems - 1}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <div className="w-24"></div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Timer and Queue */}
        <div className="space-y-4">
          {/* Discussion Timer */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Discussion Timer</h4>
              </div>
              {isRoomCreator && (
                <span className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                  <Crown className="w-3 h-3" />
                  Admin
                </span>
              )}
            </div>
            
            {/* Timer Display */}
            <div className={`text-center py-4 mb-4 rounded-lg ${
              isTimerRunning 
                ? 'bg-purple-100 dark:bg-purple-900/30' 
                : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <div className={`text-4xl font-mono font-bold ${
                discussionTimer <= 10 && isTimerRunning
                  ? 'text-red-500 animate-pulse'
                  : 'text-gray-900 dark:text-gray-100'
              }`}>
                {formatTime(discussionTimer)}
              </div>
              {isTimerRunning && (
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">In progress...</p>
              )}
              {!isTimerRunning && discussionTimer > 0 && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Paused</p>
              )}
            </div>

            {isRoomCreator ? (
              <>
                {/* Timer Duration Selector - Creator Only */}
                {!isTimerRunning && discussionTimer === 0 && (
                  <div className="mb-4">
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Duration</label>
                    <select
                      value={timerDuration}
                      onChange={(e) => setTimerDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    >
                      <option value={60}>1 minute</option>
                      <option value={120}>2 minutes</option>
                      <option value={180}>3 minutes</option>
                      <option value={300}>5 minutes</option>
                      <option value={600}>10 minutes</option>
                    </select>
                  </div>
                )}

                {/* Timer Controls - Creator Only */}
                <div className="flex gap-2">
                  {isTimerRunning ? (
                    <button
                      onClick={handlePauseTimer}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all"
                    >
                      <Pause className="w-4 h-4" />
                      Pause
                    </button>
                  ) : discussionTimer > 0 ? (
                    <button
                      onClick={handleResumeTimer}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-all"
                    >
                      <Play className="w-4 h-4" />
                      Continue
                    </button>
                  ) : (
                    <button
                      onClick={handleStartTimer}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-all"
                    >
                      <Play className="w-4 h-4" />
                      Start
                    </button>
                  )}
                  <button
                    onClick={handleResetTimer}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Timer is controlled by the room admin
              </p>
            )}
          </div>

          {/* Discussion Queue */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Discussion Queue</h4>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {totalItems} items
              </span>
            </div>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {discussionItems.map((item, index) => {
                const column = getColumnInfo(item.columnId);
                const isActive = index === currentItemIndex;
                
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!isRoomCreator) return;
                      setCurrentItemIndex(index);
                      if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                          type: 'discuss-update',
                          action: 'item-changed',
                          retroId,
                          itemIndex: index
                        }));
                      }
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      isRoomCreator ? 'cursor-pointer' : 'cursor-default'
                    } ${
                      isActive
                        ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500'
                        : item.discussed
                        ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800'
                        : isRoomCreator
                        ? 'bg-gray-50 dark:bg-gray-700 border border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                        : 'bg-gray-50 dark:bg-gray-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: column?.color }}
                      ></div>
                      <span className={`text-sm truncate flex-1 ${
                        isActive 
                          ? 'text-purple-700 dark:text-purple-300 font-medium' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {item.cards[0]?.content.substring(0, 40)}
                        {(item.cards[0]?.content.length || 0) > 40 ? '...' : ''}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {item.discussed && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {item.voteCount}
                        </span>
                        <ThumbsUp className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {!isRoomCreator && (
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                The admin controls topic navigation
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
