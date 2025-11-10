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
  createdAt: Date;
  updatedAt: Date;
}

export interface Participant {
  id: string;
  retroId: string;
  name: string;
  joinedAt: Date;
}

export interface CreateRetroData {
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
