import { useState, useRef } from 'react';
import { Layers, X } from 'lucide-react';

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

interface GroupStageProps {
  template: Template | undefined;
  currentUserId: string;
  ws: WebSocket | null;
  retroId: string;
  cards: Card[];
  setCards: React.Dispatch<React.SetStateAction<Card[]>>;
  cardGroups: CardGroup[];
  setCardGroups: React.Dispatch<React.SetStateAction<CardGroup[]>>;
}

export default function GroupStage({ 
  template, 
  ws, 
  retroId, 
  cards, 
  setCards,
  cardGroups,
  setCardGroups 
}: GroupStageProps) {
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);
  const dragCounter = useRef(0);

  const getCardsForColumn = (columnId: string) => {
    return cards.filter(card => card.columnId === columnId);
  };

  const getGroupForCard = (cardId: string): CardGroup | undefined => {
    return cardGroups.find(group => group.cardIds.includes(cardId));
  };

  const getGroupedCards = (groupId: string): Card[] => {
    const group = cardGroups.find(g => g.id === groupId);
    if (!group) return [];
    return group.cardIds.map(id => cards.find(c => c.id === id)).filter(Boolean) as Card[];
  };

  const getFirstCardInGroup = (groupId: string): string | undefined => {
    const group = cardGroups.find(g => g.id === groupId);
    return group?.cardIds[0];
  };

  // Get cards that should be displayed (either ungrouped or first in their group)
  const getDisplayableCards = (columnId: string): Card[] => {
    const columnCards = getCardsForColumn(columnId);
    const displayCards: Card[] = [];
    const processedGroupIds = new Set<string>();

    for (const card of columnCards) {
      const group = getGroupForCard(card.id);
      if (group) {
        // Only show the first card of each group
        if (!processedGroupIds.has(group.id) && getFirstCardInGroup(group.id) === card.id) {
          displayCards.push(card);
          processedGroupIds.add(group.id);
        }
      } else {
        // Ungrouped cards are always shown
        displayCards.push(card);
      }
    }
    return displayCards;
  };

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedCardId(cardId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cardId);
  };

  const handleDragEnd = () => {
    setDraggedCardId(null);
    setDragOverCardId(null);
    dragCounter.current = 0;
  };

  const handleDragEnter = (e: React.DragEvent, cardId: string) => {
    e.preventDefault();
    dragCounter.current++;
    if (draggedCardId && draggedCardId !== cardId) {
      setDragOverCardId(cardId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverCardId(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetCardId: string) => {
    e.preventDefault();
    setDragOverCardId(null);
    dragCounter.current = 0;

    if (!draggedCardId || draggedCardId === targetCardId || !ws) return;

    const draggedCard = cards.find(c => c.id === draggedCardId);
    const targetCard = cards.find(c => c.id === targetCardId);

    if (!draggedCard || !targetCard) return;

    // Can only group cards in the same column
    if (draggedCard.columnId !== targetCard.columnId) return;

    const existingDraggedGroup = getGroupForCard(draggedCardId);
    const existingTargetGroup = getGroupForCard(targetCardId);

    let newGroupId: string;
    let newCardIds: string[];

    if (existingTargetGroup) {
      // Add dragged card(s) to target's group
      newGroupId = existingTargetGroup.id;
      if (existingDraggedGroup) {
        // Merge two groups
        newCardIds = [...new Set([...existingTargetGroup.cardIds, ...existingDraggedGroup.cardIds])];
      } else {
        // Add single card to existing group
        newCardIds = [...existingTargetGroup.cardIds, draggedCardId];
      }
    } else if (existingDraggedGroup) {
      // Add target to dragged card's group
      newGroupId = existingDraggedGroup.id;
      newCardIds = [...existingDraggedGroup.cardIds, targetCardId];
    } else {
      // Create new group
      newGroupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      newCardIds = [targetCardId, draggedCardId];
    }

    // Update local state
    setCardGroups(prev => {
      // Remove cards from existing groups
      const updatedGroups = prev.map(group => ({
        ...group,
        cardIds: group.cardIds.filter(id => !newCardIds.includes(id))
      })).filter(group => group.cardIds.length > 0);

      // Check if we're updating an existing group or creating new
      const existingGroupIndex = updatedGroups.findIndex(g => g.id === newGroupId);
      if (existingGroupIndex >= 0) {
        updatedGroups[existingGroupIndex].cardIds = newCardIds;
        return updatedGroups;
      } else {
        return [...updatedGroups, {
          id: newGroupId,
          cardIds: newCardIds,
          columnId: targetCard.columnId
        }];
      }
    });

    // Update cards with groupId
    setCards(prev => prev.map(card => 
      newCardIds.includes(card.id)
        ? { ...card, groupId: newGroupId }
        : card
    ));

    // Broadcast to others
    ws.send(JSON.stringify({
      type: 'cards-group',
      retroId,
      groupId: newGroupId,
      cardIds: newCardIds,
      columnId: targetCard.columnId
    }));

    setDraggedCardId(null);
  };

  const handleUngroup = (cardId: string) => {
    if (!ws) return;

    const group = getGroupForCard(cardId);
    if (!group) return;

    // Update local state
    setCardGroups(prev => {
      return prev.map(g => {
        if (g.id === group.id) {
          return {
            ...g,
            cardIds: g.cardIds.filter(id => id !== cardId)
          };
        }
        return g;
      }).filter(g => g.cardIds.length > 1); // Remove groups with less than 2 cards
    });

    // Update card to remove groupId
    setCards(prev => prev.map(card => 
      card.id === cardId
        ? { ...card, groupId: null }
        : card
    ));

    // Broadcast to others
    ws.send(JSON.stringify({
      type: 'card-ungroup',
      retroId,
      cardId,
      groupId: group.id
    }));
  };

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No template found for this retrospective.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto overflow-y-hidden">
      <div className="flex gap-4 pb-2" style={{ width: 'max-content' }}>
        {template.columns.map((column) => {
          const displayCards = getDisplayableCards(column.id);
          
          return (
            <div
              key={column.id}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 min-h-[400px] flex-shrink-0"
              style={{ width: '280px' }}
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
                  {getCardsForColumn(column.id).length}
                </span>
              </div>

              {/* Info text */}
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 italic">
                Drag cards onto each other to group them
              </p>

              {/* Cards Area */}
              <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                {displayCards.length === 0 && (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                    No cards in this column
                  </div>
                )}

                {displayCards.map((card) => {
                  const group = getGroupForCard(card.id);
                  const groupedCards = group ? getGroupedCards(group.id) : [card];
                  const isBeingDragged = draggedCardId === card.id;
                  const isDragTarget = dragOverCardId === card.id;

                  return (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card.id)}
                      onDragEnd={handleDragEnd}
                      onDragEnter={(e) => handleDragEnter(e, card.id)}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, card.id)}
                      className={`rounded-lg p-3 shadow-sm transition-all cursor-grab active:cursor-grabbing ${
                        isBeingDragged 
                          ? 'opacity-50 scale-95' 
                          : isDragTarget
                          ? 'ring-2 ring-kone-blue dark:ring-kone-lightBlue bg-kone-blue/10 dark:bg-kone-lightBlue/10'
                          : 'bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 hover:shadow-md'
                      }`}
                    >
                      {group && groupedCards.length > 1 ? (
                        // Grouped cards display
                        <div>
                          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200 dark:border-gray-500">
                            <Layers className="w-4 h-4 text-kone-blue dark:text-kone-lightBlue" />
                            <span className="text-xs font-medium text-kone-blue dark:text-kone-lightBlue">
                              {groupedCards.length} cards grouped
                            </span>
                          </div>
                          <div className="space-y-2">
                            {groupedCards.map((groupedCard) => (
                              <div 
                                key={groupedCard.id}
                                className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm"
                              >
                                <span className="flex-1 text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                                  {groupedCard.content}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUngroup(groupedCard.id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                                  title="Remove from group"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        // Single card display
                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                          {card.content}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
