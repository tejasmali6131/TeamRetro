export interface Template {
  id: string;
  name: string;
  description: string;
  columns: TemplateColumn[];
  isDefault: boolean;
}

export interface TemplateColumn {
  id: string;
  name: string;
  color: string;
  order: number;
  placeholder: string;
}

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
  template?: Template;
  isAnonymous: boolean;
  votingLimit: number;
  timerDuration: number | null;
  status: 'draft' | 'active' | 'voting' | 'completed';
  stages?: RetroStage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRetroData {
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
}
