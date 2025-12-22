// Shared types for RetroBoard and related components

export interface TemplateColumn {
  id: string;
  name: string;
  color: string;
  placeholder: string;
}

export interface Template {
  id: string;
  name: string;
  columns: TemplateColumn[];
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: Date;
  isCreator?: boolean;
}

export interface Card {
  id: string;
  columnId: string;
  content: string;
  authorId: string;
  groupId: string | null;
  createdAt: Date;
}

export interface CardGroup {
  id: string;
  cardIds: string[];
  columnId: string;
}

export interface VoteData {
  [itemId: string]: string[];
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface IcebreakerState {
  currentQuestionIndex: number;
  questions: string[];
  isAnswering: boolean;
  answeredParticipants: string[];
  answers: { [participantId: string]: string };
}

export interface StageDoneStatus {
  [stageId: string]: string[];
}

export interface Reactions {
  [cardId: string]: { [emoji: string]: string[] };
}

export interface RetroState {
  cards: Card[];
  cardGroups: CardGroup[];
  votes: VoteData;
  actionItems: ActionItem[];
  discussedItems: Set<string>;
  stageDoneStatus: StageDoneStatus;
  reactions: Reactions;
  icebreakerState: IcebreakerState | null;
  currentStageIndex: number;
}
