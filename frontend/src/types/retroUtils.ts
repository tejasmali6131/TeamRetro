// Shared utility functions for retro components
import { Template, Card, CardGroup, VoteData, Participant, ActionItem } from './retroBoard';

//Get vote count for an item (card or group)
export const getVoteCount = (votes: VoteData, itemId: string): number => {
  return votes[itemId]?.length || 0;
};

//Get total votes across all items
export const getTotalVotes = (votes: VoteData): number => {
  return Object.values(votes).reduce((sum, voters) => sum + voters.length, 0);
};

//Check if a user has voted for an item
export const hasUserVoted = (votes: VoteData, itemId: string, userId: string): boolean => {
  return votes[itemId]?.includes(userId) || false;
};

//Get user's total vote count
export const getUserVoteCount = (votes: VoteData, userId: string): number => {
  return Object.values(votes).filter(voters => voters.includes(userId)).length;
};

//Get column info from template
export const getColumnInfo = (template: Template | undefined, columnId: string) => {
  return template?.columns.find(c => c.id === columnId);
};

//Get column name with fallback
export const getColumnName = (template: Template | undefined, columnId: string): string => {
  return template?.columns.find(c => c.id === columnId)?.name || 'Unknown';
};

//Get participant name by ID
export const getParticipantName = (participants: Participant[], participantId: string): string => {
  return participants.find(p => p.id === participantId)?.name || 'Unknown';
};

//Get assignee name with fallback to 'Unassigned'
export const getAssigneeName = (participants: Participant[], assigneeId: string): string => {
  if (!assigneeId) return 'Unassigned';
  return participants.find(p => p.id === assigneeId)?.name || 'Unassigned';
};

//Get priority color classes
export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'high': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
    case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
    case 'low': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
  }
};

//Get status color classes
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    case 'in_progress': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
  }
};

//Processed item interface
export interface ProcessedItem {
  id: string;
  type: 'card' | 'group';
  columnId: string;
  cards: Card[];
  voteCount: number;
  content: string;
}

//Process cards and groups into a unified list with vote counts
//This is the core function used by multiple stages (Vote, Discuss, Review, Report)
export const processCardsAndGroups = (
  cards: Card[],
  cardGroups: CardGroup[],
  votes: VoteData
): ProcessedItem[] => {
  const items: ProcessedItem[] = [];
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
        voteCount: getVoteCount(votes, group.id),
        content: groupCards.map(c => c.content).join(' • ')
      });
      
      group.cardIds.forEach(id => processedCardIds.add(id));
    } else {
      items.push({
        id: card.id,
        type: 'card',
        columnId: card.columnId,
        cards: [card],
        voteCount: getVoteCount(votes, card.id),
        content: card.content
      });
      processedCardIds.add(card.id);
    }
  });

  return items;
};

//Get top voted items sorted by vote count
export const getTopVotedItems = (
  cards: Card[],
  cardGroups: CardGroup[],
  votes: VoteData,
  limit: number = 5
): ProcessedItem[] => {
  const items = processCardsAndGroups(cards, cardGroups, votes);
  return items.sort((a, b) => b.voteCount - a.voteCount).slice(0, limit);
};

//Get items sorted for discussion (by vote count, undiscussed first)
export const getDiscussionItems = (
  cards: Card[],
  cardGroups: CardGroup[],
  votes: VoteData,
  discussedItems: Set<string>
): (ProcessedItem & { discussed: boolean })[] => {
  const items = processCardsAndGroups(cards, cardGroups, votes);
  
  return items
    .map(item => ({ ...item, discussed: discussedItems.has(item.id) }))
    .sort((a, b) => {
      if (a.discussed !== b.discussed) return a.discussed ? 1 : -1;
      return b.voteCount - a.voteCount;
    });
};

//Get cards organized by column
export const getCardsByColumn = (
  template: Template | undefined,
  cards: Card[],
  cardGroups: CardGroup[],
  votes: VoteData
): { [columnId: string]: { cards: Card[]; groups: { id: string; cards: Card[]; voteCount: number }[] } } => {
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
          voteCount: getVoteCount(votes, group.id)
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

//Get participant statistics
export const getParticipantStats = (
  participant: Participant,
  cards: Card[],
  votes: VoteData,
  actionItems: ActionItem[]
) => ({
  cardsCreated: cards.filter(c => c.authorId === participant.id).length,
  votesGiven: Object.values(votes).filter(voters => voters.includes(participant.id)).length,
  actionsAssigned: actionItems.filter(a => a.assigneeId === participant.id).length
});

//Format seconds to mm:ss
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
