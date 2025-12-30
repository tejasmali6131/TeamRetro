export interface Template {
  id: string;
  name: string;
  description: string;
  columns: TemplateColumn[];
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateColumn {
  id: string;
  name: string;
  color: string;
  order: number;
  placeholder: string;
}

// Predefined templates
export const DEFAULT_TEMPLATES = {
  START_STOP_CONTINUE: {
    name: 'Start/Stop/Continue',
    description: 'Identify actions to start, stop, and continue',
    columns: [
      { name: 'Start', color: '#10B981', order: 1, placeholder: 'What should we start doing?' },
      { name: 'Stop', color: '#EF4444', order: 2, placeholder: 'What should we stop doing?' },
      { name: 'Continue', color: '#3B82F6', order: 3, placeholder: 'What should we continue doing?' },
    ],
  },
  MAD_SAD_GLAD: {
    name: 'Mad/Sad/Glad',
    description: 'Express emotions about the sprint',
    columns: [
      { name: 'Mad', color: '#DC2626', order: 1, placeholder: 'What made you angry?' },
      { name: 'Sad', color: '#F59E0B', order: 2, placeholder: 'What made you sad?' },
      { name: 'Glad', color: '#059669', order: 3, placeholder: 'What made you happy?' },
    ],
  },
  LIKED_LEARNED_LACKED: {
    name: 'Liked/Learned/Lacked',
    description: 'Reflect on positive, learning, and improvement areas',
    columns: [
      { name: 'Liked', color: '#10B981', order: 1, placeholder: 'What did you like?' },
      { name: 'Learned', color: '#8B5CF6', order: 2, placeholder: 'What did you learn?' },
      { name: 'Lacked', color: '#F59E0B', order: 3, placeholder: 'What was lacking?' },
    ],
  },
};
