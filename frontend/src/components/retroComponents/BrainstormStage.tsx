import { useState, useEffect, useRef } from 'react';
import { X, Edit2, Check, EyeOff, CheckCircle2 } from 'lucide-react';
import { Template, Card } from '@/types/retroBoard';

interface BrainstormStageProps {
  template: Template | undefined;
  currentUserId: string;
  ws: WebSocket | null;
  retroId: string;
  cards: Card[];
  setCards: React.Dispatch<React.SetStateAction<Card[]>>;
  stageId: string;
  isDone: boolean;
}

export default function BrainstormStage({ template, currentUserId, ws, retroId, cards, setCards, stageId, isDone }: BrainstormStageProps) {
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [localIsDone, setLocalIsDone] = useState(isDone);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  // Sync local state with prop
  useEffect(() => {
    setLocalIsDone(isDone);
  }, [isDone]);

  // Focus input when opening
  useEffect(() => {
    if (activeInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeInput]);

  // Focus edit input when editing
  useEffect(() => {
    if (editingCardId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingCardId]);

  const handleAddCard = (columnId: string) => {
    setActiveInput(columnId);
    setInputValue('');
  };

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

  const handleSubmitCard = (columnId: string) => {
    if (!inputValue.trim() || !ws) return;

    const newCard: Card = {
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      columnId,
      content: inputValue.trim(),
      authorId: currentUserId,
      groupId: null,
      createdAt: new Date()
    };

    // Add locally immediately
    setCards(prev => [...prev, newCard]);

    // Broadcast to others via WebSocket
    ws.send(JSON.stringify({
      type: 'card-create',
      retroId,
      card: newCard
    }));

    setActiveInput(null);
    setInputValue('');
  };

  const handleCancelInput = () => {
    setActiveInput(null);
    setInputValue('');
  };

  const handleEditCard = (card: Card) => {
    setEditingCardId(card.id);
    setEditValue(card.content);
  };

  const handleSaveEdit = (card: Card) => {
    if (!editValue.trim() || !ws) return;

    // Update locally
    setCards(prev => prev.map(c => 
      c.id === card.id ? { ...c, content: editValue.trim() } : c
    ));

    // Broadcast to others
    ws.send(JSON.stringify({
      type: 'card-update',
      retroId,
      card: { ...card, content: editValue.trim() }
    }));

    setEditingCardId(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingCardId(null);
    setEditValue('');
  };

  const handleDeleteCard = (cardId: string) => {
    // Remove locally
    setCards(prev => prev.filter(c => c.id !== cardId));

    // Broadcast to others
    if (ws) {
      ws.send(JSON.stringify({
        type: 'card-delete',
        retroId,
        cardId
      }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void, cancelAction: () => void) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      action();
    } else if (e.key === 'Escape') {
      cancelAction();
    }
  };

  const getCardsForColumn = (columnId: string) => {
    return cards.filter(card => card.columnId === columnId);
  };

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No template found for this retrospective.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
      
      <div className="overflow-x-auto overflow-y-hidden -mx-2 sm:mx-0 px-2 sm:px-0">
        <div className="flex gap-3 sm:gap-4 pb-2" style={{ width: 'max-content' }}>
          {template.columns.map((column) => {
            const columnCards = getCardsForColumn(column.id);
            
            return (
              <div
                key={column.id}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 min-h-[350px] sm:min-h-[400px] flex-shrink-0"
                style={{ width: '260px' }}
            >
              {/* Column Header */}
              <div
                className="flex items-center gap-2 mb-3 sm:mb-4 pb-2 border-b-2"
                style={{ borderBottomColor: column.color }}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: column.color }}
                ></div>
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">{column.name}</h3>
                <span className="ml-auto text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {columnCards.length}
                </span>
              </div>

              {/* Cards Area */}
              <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                {columnCards.length === 0 && activeInput !== column.id && (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                    No cards yet. Add your thoughts!
                  </div>
                )}

                {columnCards.map((card) => {
                  const isOwner = card.authorId === currentUserId;
                  const isEditing = editingCardId === card.id;

                  return (
                    <div
                      key={card.id}
                      className={`rounded-lg p-3 shadow-sm transition-all ${
                        isOwner 
                          ? 'bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500' 
                          : 'bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700'
                      }`}
                    >
                      {isEditing && isOwner ? (
                        <div>
                          <textarea
                            ref={editInputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, () => handleSaveEdit(card), handleCancelEdit)}
                            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-500 rounded-md focus:ring-2 focus:ring-kone-blue dark:focus:ring-kone-lightBlue focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            rows={3}
                            placeholder="Enter your thought..."
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSaveEdit(card)}
                              className="p-1 text-kone-blue hover:text-kone-blue/80 dark:text-kone-lightBlue dark:hover:text-kone-lightBlue/80"
                              title="Save"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="overflow-hidden">
                          {isOwner ? (
                            <>
                              <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-all">
                                {card.content}
                              </p>
                              <div className="flex justify-end gap-1 mt-2 opacity-0 hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEditCard(card)}
                                  className="p-1 text-gray-400 hover:text-kone-blue dark:hover:text-kone-lightBlue"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCard(card.id)}
                                  className="p-1 text-gray-400 hover:text-red-500"
                                  title="Delete"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </>
                          ) : (
                            // Show blank/hidden card for other users
                            <div className="flex items-center justify-center py-3">
                              <EyeOff className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Input for new card */}
                {activeInput === column.id && (
                  <div className="bg-white dark:bg-gray-600 rounded-lg p-3 shadow-sm border-2 border-kone-blue dark:border-kone-lightBlue">
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, () => handleSubmitCard(column.id), handleCancelInput)}
                      className="w-full p-2 text-sm border border-gray-300 dark:border-gray-500 rounded-md focus:ring-2 focus:ring-kone-blue dark:focus:ring-kone-lightBlue focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      rows={3}
                      placeholder={column.placeholder || "Enter your thought..."}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={handleCancelInput}
                        className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSubmitCard(column.id)}
                        disabled={!inputValue.trim()}
                        className="px-3 py-1 text-sm bg-kone-blue dark:bg-kone-lightBlue text-white rounded-md hover:bg-kone-blue/90 dark:hover:bg-kone-lightBlue/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Add Card Button */}
              {activeInput !== column.id && (
                <button 
                  onClick={() => handleAddCard(column.id)}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-kone-blue dark:hover:border-kone-lightBlue hover:text-kone-blue dark:hover:text-kone-lightBlue transition-colors"
                >
                  + Add Card
                </button>
              )}
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
