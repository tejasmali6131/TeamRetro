export interface Retro {
  id: string;
  sessionName: string;
  context: string;
  templateId: string;
  isAnonymous: boolean;
  votingLimit: number;
  timerDuration: number | null;
  status: 'draft' | 'active' | 'voting' | 'completed';
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
}

export interface RetroSettings {
  isAnonymous: boolean;
  votingLimit: number;
  timerDuration: number | null;
  allowComments: boolean;
  allowGrouping: boolean;
}
