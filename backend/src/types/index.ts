// Shared types for backend WebSocket and data operations
import { WebSocket } from 'ws';

export interface Participant {
  id: string;
  name: string;
  ws: WebSocket | null;
  retroId: string;
  joinedAt: Date;
  isCreator: boolean;
  isConnected: boolean;
}

// Participant data sent to clients (without WebSocket reference)
export interface ParticipantData {
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

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface VoteData {
  [itemId: string]: string[];
}

export interface StageDoneStatus {
  [stageId: string]: string[];
}

export interface Reactions {
  [cardId: string]: { [emoji: string]: string[] };
}

export interface IcebreakerState {
  currentQuestionIndex: number;
  questions: string[];
  isAnswering: boolean;
  answeredParticipants: string[];
  answers: { [participantId: string]: string };
}

export interface RetroRoom {
  id: string;
  participants: Map<string, Participant>;
  creatorId: string;
  currentStage: number;
  cards: Card[];
  cardGroups: CardGroup[];
  votes: VoteData;
  actionItems: ActionItem[];
  discussedItems: string[];
  stageDoneStatus: StageDoneStatus;
  reactions: Reactions;
  icebreakerState: IcebreakerState;
}

export interface DisconnectedUser {
  retroId: string;
  name: string;
  isCreator: boolean;
  disconnectedAt: Date;
}

// WebSocket message types
export type MessageType = 
  | 'stage-change'
  | 'mark-stage-done'
  | 'timer-update'
  | 'icebreaker-update'
  | 'card-create'
  | 'card-update'
  | 'card-delete'
  | 'cards-group'
  | 'card-ungroup'
  | 'vote-add'
  | 'vote-remove'
  | 'discuss-update'
  | 'action-item-update'
  | 'reaction-toggle';
