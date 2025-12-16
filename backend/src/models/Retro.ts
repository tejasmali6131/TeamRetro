export interface RetroStage {
  id: string;
  name: string;
  duration: number;
  enabled: boolean;
}

export interface Retro {
  id: string;
  sessionName: string;
  context: string;
  templateId: string;
  isAnonymous: boolean;
  votingLimit: number;
  timerDuration: number | null;
  status: 'draft' | 'active' | 'voting' | 'completed';
  stages?: RetroStage[];
  reactionsEnabled?: boolean;
  commentsEnabled?: boolean;
  commentReactionsEnabled?: boolean;
  nameDeck?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRetroDTO {
  sessionName: string;
  context: string;
  templateId: string;
  isAnonymous: boolean;
  votingLimit?: number;
  timerDuration?: number;
  stages?: RetroStage[];
  reactionsEnabled?: boolean;
  commentsEnabled?: boolean;
  commentReactionsEnabled?: boolean;
  nameDeck?: string;
}
