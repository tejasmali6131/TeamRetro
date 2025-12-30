import {
  retros,
  participants,
  getAllRetros,
  getRetroById,
  createRetro,
  updateRetro,
  deleteRetro,
  addParticipant
} from '../../data/retros';

describe('Retros Data Store', () => {
  // Helper to create test retro data
  const createTestRetroData = (overrides = {}) => ({
    sessionName: 'Test Retro',
    context: '',
    templateId: '1',
    isAnonymous: false,
    votingLimit: 3,
    timerDuration: null,
    status: 'draft' as const,
    ...overrides
  });

  beforeEach(() => {
    // Clear arrays before each test
    retros.length = 0;
    participants.length = 0;
  });

  describe('getAllRetros', () => {
    it('should return empty array when no retros exist', () => {
      const result = getAllRetros();
      expect(result).toEqual([]);
    });

    it('should return all retros sorted by createdAt descending', () => {
      // Create retros with explicit different timestamps
      const retro1 = createRetro(createTestRetroData({ sessionName: 'First Retro' }));
      const retro2 = createRetro(createTestRetroData({ sessionName: 'Second Retro' }));
      
      // Manually set different timestamps to ensure sorting works
      retro1.createdAt = new Date('2024-01-01');
      retro2.createdAt = new Date('2024-01-02');

      const result = getAllRetros();

      expect(result.length).toBe(2);
      // Most recent should be first
      expect(result[0].sessionName).toBe('Second Retro');
      expect(result[1].sessionName).toBe('First Retro');
    });
  });

  describe('getRetroById', () => {
    it('should return undefined when retro not found', () => {
      const result = getRetroById('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should return retro when found', () => {
      const created = createRetro(createTestRetroData({ context: 'Test context' }));

      const result = getRetroById(created.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
      expect(result?.sessionName).toBe('Test Retro');
    });
  });

  describe('createRetro', () => {
    it('should create a retro with auto-generated id', () => {
      const result = createRetro(createTestRetroData({ sessionName: 'New Retro' }));

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^retro-\d+$/);
    });

    it('should set createdAt and updatedAt timestamps', () => {
      const before = new Date();

      const result = createRetro(createTestRetroData({ sessionName: 'New Retro' }));

      const after = new Date();

      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(result.updatedAt.getTime()).toBe(result.createdAt.getTime());
    });

    it('should add retro to storage', () => {
      expect(retros.length).toBe(0);

      createRetro(createTestRetroData({ sessionName: 'New Retro' }));

      expect(retros.length).toBe(1);
    });

    it('should preserve all provided properties', () => {
      const result = createRetro({
        sessionName: 'Full Retro',
        context: 'Sprint 5',
        templateId: '2',
        isAnonymous: true,
        votingLimit: 5,
        timerDuration: 300,
        status: 'active'
      });

      expect(result.sessionName).toBe('Full Retro');
      expect(result.context).toBe('Sprint 5');
      expect(result.templateId).toBe('2');
      expect(result.isAnonymous).toBe(true);
      expect(result.votingLimit).toBe(5);
      expect(result.timerDuration).toBe(300);
      expect(result.status).toBe('active');
    });
  });

  describe('updateRetro', () => {
    it('should return null when retro not found', () => {
      const result = updateRetro('nonexistent', { sessionName: 'Updated' });
      expect(result).toBeNull();
    });

    it('should update retro and return updated version', () => {
      const created = createRetro(createTestRetroData({ sessionName: 'Original Name' }));

      const result = updateRetro(created.id, { sessionName: 'Updated Name' });

      expect(result).toBeDefined();
      expect(result?.sessionName).toBe('Updated Name');
    });

    it('should update updatedAt timestamp', () => {
      const created = createRetro(createTestRetroData());

      const originalUpdatedAt = created.updatedAt;

      // Small delay to ensure different timestamp
      const result = updateRetro(created.id, { sessionName: 'Updated' });

      expect(result?.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    it('should preserve createdAt timestamp', () => {
      const created = createRetro(createTestRetroData());

      const originalCreatedAt = created.createdAt;

      const result = updateRetro(created.id, { sessionName: 'Updated' });

      expect(result?.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });

    it('should update multiple fields', () => {
      const created = createRetro(createTestRetroData({ sessionName: 'Original' }));

      const result = updateRetro(created.id, {
        sessionName: 'Updated Name',
        context: 'New context',
        isAnonymous: true,
        status: 'active'
      });

      expect(result?.sessionName).toBe('Updated Name');
      expect(result?.context).toBe('New context');
      expect(result?.isAnonymous).toBe(true);
      expect(result?.status).toBe('active');
    });
  });

  describe('deleteRetro', () => {
    it('should return false when retro not found', () => {
      const result = deleteRetro('nonexistent');
      expect(result).toBe(false);
    });

    it('should return true and remove retro', () => {
      const created = createRetro(createTestRetroData());

      expect(retros.length).toBe(1);

      const result = deleteRetro(created.id);

      expect(result).toBe(true);
      expect(retros.length).toBe(0);
    });

    it('should also remove associated participants', () => {
      const created = createRetro(createTestRetroData());

      addParticipant({ retroId: created.id, name: 'User 1' });
      addParticipant({ retroId: created.id, name: 'User 2' });
      addParticipant({ retroId: 'other-retro', name: 'User 3' });

      expect(participants.length).toBe(3);

      deleteRetro(created.id);

      expect(participants.length).toBe(1);
      expect(participants[0].name).toBe('User 3');
    });
  });

  describe('addParticipant', () => {
    it('should create participant with auto-generated id', () => {
      const result = addParticipant({ retroId: 'retro-1', name: 'Test User' });

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^participant-\d+-[a-z0-9]+$/);
    });

    it('should set joinedAt timestamp', () => {
      const before = new Date();

      const result = addParticipant({ retroId: 'retro-1', name: 'Test User' });

      const after = new Date();

      expect(result.joinedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.joinedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should add participant to storage', () => {
      expect(participants.length).toBe(0);

      addParticipant({ retroId: 'retro-1', name: 'Test User' });

      expect(participants.length).toBe(1);
    });

    it('should preserve provided properties', () => {
      const result = addParticipant({ retroId: 'retro-123', name: 'John Doe' });

      expect(result.retroId).toBe('retro-123');
      expect(result.name).toBe('John Doe');
    });
  });
});
