import { Template } from '../models/Template';

export const templates: Template[] = [
  {
    id: '1',
    name: 'Start, Stop, Continue',
    description: 'Reflect on what to start doing, stop doing, and continue doing',
    columns: [
      {
        id: 'start',
        name: 'Start',
        placeholder: 'What should we start doing?',
        color: '#10b981',
        order: 1
      },
      {
        id: 'stop',
        name: 'Stop',
        placeholder: 'What should we stop doing?',
        color: '#ef4444',
        order: 2
      },
      {
        id: 'continue',
        name: 'Continue',
        placeholder: 'What should we continue doing?',
        color: '#3b82f6',
        order: 3
      }
    ],
    isDefault: true,
    createdBy: 'system',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Mad, Sad, Glad',
    description: 'Express emotions about the sprint',
    columns: [
      {
        id: 'mad',
        name: 'Mad',
        placeholder: 'What made you angry or frustrated?',
        color: '#dc2626',
        order: 1
      },
      {
        id: 'sad',
        name: 'Sad',
        placeholder: 'What made you disappointed?',
        color: '#f59e0b',
        order: 2
      },
      {
        id: 'glad',
        name: 'Glad',
        placeholder: 'What made you happy?',
        color: '#22c55e',
        order: 3
      }
    ],
    isDefault: true,
    createdBy: 'system',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '3',
    name: 'Liked, Learned, Lacked, Longed For',
    description: 'The 4Ls retrospective format',
    columns: [
      {
        id: 'liked',
        name: 'Liked',
        placeholder: 'What did you like?',
        color: '#22c55e',
        order: 1
      },
      {
        id: 'learned',
        name: 'Learned',
        placeholder: 'What did you learn?',
        color: '#3b82f6',
        order: 2
      },
      {
        id: 'lacked',
        name: 'Lacked',
        placeholder: 'What was missing?',
        color: '#f59e0b',
        order: 3
      },
      {
        id: 'longed-for',
        name: 'Longed For',
        placeholder: 'What did you desire?',
        color: '#8b5cf6',
        order: 4
      }
    ],
    isDefault: true,
    createdBy: 'system',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '4',
    name: 'Sailboat',
    description: 'Visualize your team as a sailboat navigating towards goals',
    columns: [
      {
        id: 'wind',
        name: 'Wind (Helping)',
        placeholder: 'What is pushing us forward?',
        color: '#10b981',
        order: 1
      },
      {
        id: 'anchor',
        name: 'Anchor (Hindering)',
        placeholder: 'What is holding us back?',
        color: '#ef4444',
        order: 2
      },
      {
        id: 'rocks',
        name: 'Rocks (Risks)',
        placeholder: 'What risks do we need to avoid?',
        color: '#f59e0b',
        order: 3
      },
      {
        id: 'island',
        name: 'Island (Goals)',
        placeholder: 'Where do we want to go?',
        color: '#3b82f6',
        order: 4
      }
    ],
    isDefault: true,
    createdBy: 'system',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// Helper function to get all templates
export const getAllTemplates = (): Template[] => {
  return templates;
};

// Helper function to get a template by ID
export const getTemplateById = (id: string): Template | undefined => {
  return templates.find(template => template.id === id);
};

// Helper function to add a custom template
export const addTemplate = (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Template => {
  const now = new Date();
  const newTemplate: Template = {
    ...template,
    id: `custom-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    isDefault: false
  };
  templates.push(newTemplate);
  return newTemplate;
};
