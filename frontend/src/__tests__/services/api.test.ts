import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Template, Retro, CreateRetroData } from '@/types/retro';

// Create mock functions using vi.hoisted to ensure they're available before imports
const { mockGet, mockPost, mockPatch, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPatch: vi.fn(),
  mockDelete: vi.fn(),
}));

// Mock axios.create to return an instance with our mock methods
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: mockGet,
      post: mockPost,
      patch: mockPatch,
      delete: mockDelete,
    })),
  },
}));

// Import after mocking
import { getTemplates, getTemplateById, createRetro, getRetroById, updateRetro, deleteRetro } from '@/services/api';

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Template API', () => {
    describe('getTemplates', () => {
      it('fetches all templates successfully', async () => {
        const mockTemplates: Template[] = [
          {
            id: 'template-1',
            name: 'Retrospective',
            description: 'Standard retro',
            isDefault: true,
            columns: [],
          },
          {
            id: 'template-2',
            name: 'Planning',
            description: 'Planning template',
            isDefault: false,
            columns: [],
          },
        ];

        mockGet.mockResolvedValue({ data: mockTemplates });

        const result = await getTemplates();

        expect(mockGet).toHaveBeenCalledWith('/templates');
        expect(result).toEqual(mockTemplates);
      });

      it('handles error when fetching templates fails', async () => {
        const error = new Error('Network error');
        mockGet.mockRejectedValue(error);

        await expect(getTemplates()).rejects.toThrow('Network error');
      });
    });

    describe('getTemplateById', () => {
      it('fetches template by ID successfully', async () => {
        const mockTemplate: Template = {
          id: 'template-1',
          name: 'Retrospective',
          description: 'Standard retro',
          isDefault: true,
          columns: [
            { 
              id: 'col-1', 
              name: 'What went well', 
              color: '#10b981', 
              order: 0, 
              placeholder: 'Add a card...' 
            }
          ],
        };

        mockGet.mockResolvedValue({ data: mockTemplate });

        const result = await getTemplateById('template-1');

        expect(mockGet).toHaveBeenCalledWith('/templates/template-1');
        expect(result).toEqual(mockTemplate);
      });

      it('handles error when template not found', async () => {
        mockGet.mockRejectedValue(new Error('Template not found'));

        await expect(getTemplateById('invalid-id')).rejects.toThrow('Template not found');
      });
    });
  });

  describe('Retro API', () => {
    describe('createRetro', () => {
      it('creates a new retro successfully', async () => {
        const createData: CreateRetroData = {
          sessionName: 'Q1 Planning',
          context: 'Q1 2024 planning session',
          templateId: 'template-1',
          isAnonymous: false,
        };

        const mockRetro: Retro = {
          id: 'retro-1',
          sessionName: 'Q1 Planning',
          context: 'Q1 2024 planning session',
          templateId: 'template-1',
          isAnonymous: false,
          votingLimit: 3,
          timerDuration: 0,
          status: 'active' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          template: {
            id: 'template-1',
            name: 'Planning',
            description: 'Planning template',
            isDefault: false,
            columns: [],
          },
        };

        mockPost.mockResolvedValue({ data: mockRetro });

        const result = await createRetro(createData);

        expect(mockPost).toHaveBeenCalledWith('/retros', createData);
        expect(result).toEqual(mockRetro);
      });

      it('handles error when creating retro fails', async () => {
        const createData: CreateRetroData = {
          sessionName: 'Test Retro',
          context: 'Test context',
          templateId: 'template-1',
          isAnonymous: false,
        };

        mockPost.mockRejectedValue(new Error('Failed to create retro'));

        await expect(createRetro(createData)).rejects.toThrow('Failed to create retro');
      });
    });

    describe('getRetroById', () => {
      it('fetches retro by ID successfully', async () => {
        const mockRetro: Retro = {
          id: 'retro-1',
          sessionName: 'Sprint 1 Retro',
          context: 'Sprint 1',
          templateId: 'template-1',
          isAnonymous: false,
          votingLimit: 3,
          timerDuration: 300,
          status: 'active' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          template: {
            id: 'template-1',
            name: 'Retrospective',
            description: 'Standard retro',
            isDefault: true,
            columns: [],
          },
        };

        mockGet.mockResolvedValue({ data: mockRetro });

        const result = await getRetroById('retro-1');

        expect(mockGet).toHaveBeenCalledWith('/retros/retro-1');
        expect(result).toEqual(mockRetro);
      });

      it('handles error when retro not found', async () => {
        mockGet.mockRejectedValue(new Error('Retro not found'));

        await expect(getRetroById('invalid-id')).rejects.toThrow('Retro not found');
      });
    });

    describe('updateRetro', () => {
      it('updates retro successfully', async () => {
        const updateData = { votingLimit: 5 };
        const mockRetro: Retro = {
          id: 'retro-1',
          sessionName: 'Sprint 1 Retro',
          context: 'Sprint 1',
          templateId: 'template-1',
          isAnonymous: false,
          votingLimit: 5,
          timerDuration: 300,
          status: 'active' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          template: {
            id: 'template-1',
            name: 'Retrospective',
            description: 'Standard retro',
            isDefault: true,
            columns: [],
          },
        };

        mockPatch.mockResolvedValue({ data: mockRetro });

        const result = await updateRetro('retro-1', updateData);

        expect(mockPatch).toHaveBeenCalledWith('/retros/retro-1', updateData);
        expect(result).toEqual(mockRetro);
      });

      it('handles error when updating retro fails', async () => {
        mockPatch.mockRejectedValue(new Error('Failed to update retro'));

        await expect(updateRetro('retro-1', { votingLimit: 5 })).rejects.toThrow('Failed to update retro');
      });
    });

    describe('deleteRetro', () => {
      it('deletes retro successfully', async () => {
        mockDelete.mockResolvedValue({ data: null });

        await deleteRetro('retro-1');

        expect(mockDelete).toHaveBeenCalledWith('/retros/retro-1');
      });

      it('handles error when deleting retro fails', async () => {
        mockDelete.mockRejectedValue(new Error('Failed to delete retro'));

        await expect(deleteRetro('retro-1')).rejects.toThrow('Failed to delete retro');
      });
    });
  });
});
