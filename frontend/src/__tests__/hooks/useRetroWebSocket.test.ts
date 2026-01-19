import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRetroWebSocket } from '@/hooks/useRetroWebSocket';
import toast from 'react-hot-toast';
import type { RetroStage } from '@/types/retro';

vi.mock('react-hot-toast');

// Enhanced mock WebSocket with message handling
class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;

  readyState = MockWebSocket.OPEN;
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Immediately trigger onopen
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }

  send(_data: string) {
    // Mock send method
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code, reason }));
    }
  }

  // Helper method to simulate receiving a message
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }
}

let mockWebSocketInstance: MockWebSocket | null = null;

describe('useRetroWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWebSocketInstance = null;
    global.WebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url);
        mockWebSocketInstance = this;
      }
    } as any;
  });

  afterEach(() => {
    mockWebSocketInstance = null;
  });

  const enabledStages: RetroStage[] = [
    { id: 'brainstorm', name: 'Brainstorm', duration: 300, enabled: true },
    { id: 'group', name: 'Group', duration: 300, enabled: true },
  ];

  describe('Basic Functionality', () => {
    it('initializes with default state and provides state setters', () => {
      const { result } = renderHook(() =>
        useRetroWebSocket({ retroId: undefined, enabledStages })
      );

      expect(result.current.currentUserId).toBe('');
      expect(result.current.participants).toEqual([]);
      expect(result.current.cards).toEqual([]);
      expect(result.current.currentStageIndex).toBe(0);
      expect(typeof result.current.sendMessage).toBe('function');
      expect(typeof result.current.setCards).toBe('function');
      expect(typeof result.current.setVotes).toBe('function');
    });

    it('does not establish connection when retroId is undefined', () => {
      renderHook(() =>
        useRetroWebSocket({ retroId: undefined, enabledStages })
      );

      expect(mockWebSocketInstance).toBeNull();
    });

    it('establishes WebSocket connection when retroId is provided', async () => {
      renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      expect(mockWebSocketInstance?.url).toContain('retro-123');
    });
  });

  describe('State Management', () => {
    it('updates all state types correctly', () => {
      const { result } = renderHook(() =>
        useRetroWebSocket({ retroId: undefined, enabledStages })
      );

      // Test cards
      const newCard = {
        id: 'card-1',
        columnId: 'col-1',
        content: 'New card',
        authorId: 'user-1',
        groupId: null,
        createdAt: new Date(),
      };
      act(() => {
        result.current.setCards([newCard]);
      });
      expect(result.current.cards).toHaveLength(1);

      // Test votes
      act(() => {
        result.current.setVotes({ 'card-1': ['user-1', 'user-2'] });
      });
      expect(result.current.votes['card-1']).toEqual(['user-1', 'user-2']);

      // Test stage index
      act(() => {
        result.current.setCurrentStageIndex(1);
      });
      expect(result.current.currentStageIndex).toBe(1);
    });
  });

  describe('WebSocket Message Handling', () => {
    it('handles user-joined message', async () => {
      const { result } = renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      act(() => {
        mockWebSocketInstance?.simulateMessage({
          type: 'user-joined',
          userId: 'user-123',
          userName: 'John Doe',
          retroId: 'retro-123',
        });
      });

      await waitFor(() => {
        expect(result.current.currentUserId).toBe('user-123');
      });
      expect(toast.success).toHaveBeenCalledWith('Joined as John Doe');
    });

    it('handles participants-update message', async () => {
      const { result } = renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      const participants = [
        { id: 'user-1', name: 'Alice', isCreator: false },
        { id: 'user-2', name: 'Bob', isCreator: false },
      ];

      act(() => {
        mockWebSocketInstance?.simulateMessage({
          type: 'participants-update',
          participants,
        });
      });

      await waitFor(() => {
        expect(result.current.participants).toHaveLength(2);
      });
    });

    it('handles stage-change message', async () => {
      const { result } = renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      act(() => {
        mockWebSocketInstance?.simulateMessage({
          type: 'stage-change',
          stageIndex: 1,
        });
      });

      await waitFor(() => {
        expect(result.current.currentStageIndex).toBe(1);
      });
    });

    it('handles card-created message', async () => {
      const { result } = renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      act(() => {
        mockWebSocketInstance?.simulateMessage({
          type: 'card-created',
          card: {
            id: 'card-1',
            columnId: 'col-1',
            content: 'Test card',
            authorId: 'user-1',
            createdAt: new Date().toISOString(),
          },
        });
      });

      await waitFor(() => {
        expect(result.current.cards).toHaveLength(1);
      });
      expect(result.current.cards[0].content).toBe('Test card');
    });

    it('handles card-updated message', async () => {
      const { result } = renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      // First create a card
      act(() => {
        result.current.setCards([
          {
            id: 'card-1',
            columnId: 'col-1',
            content: 'Original content',
            authorId: 'user-1',
            groupId: null,
            createdAt: new Date(),
          },
        ]);
      });

      // Then update it
      act(() => {
        mockWebSocketInstance?.simulateMessage({
          type: 'card-updated',
          card: {
            id: 'card-1',
            content: 'Updated content',
          },
        });
      });

      await waitFor(() => {
        expect(result.current.cards[0].content).toBe('Updated content');
      });
    });

    it('handles card-deleted message', async () => {
      const { result } = renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      // First create a card
      act(() => {
        result.current.setCards([
          {
            id: 'card-1',
            columnId: 'col-1',
            content: 'Test card',
            authorId: 'user-1',
            groupId: null,
            createdAt: new Date(),
          },
        ]);
      });

      // Then delete it
      act(() => {
        mockWebSocketInstance?.simulateMessage({
          type: 'card-deleted',
          cardId: 'card-1',
        });
      });

      await waitFor(() => {
        expect(result.current.cards).toHaveLength(0);
      });
    });
  });

  describe('WebSocket Connection Management', () => {
    it('sends messages through WebSocket', async () => {
      const { result } = renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      const sendSpy = vi.spyOn(mockWebSocketInstance!, 'send');

      act(() => {
        result.current.sendMessage({ type: 'test-action', data: 'test' });
      });

      expect(sendSpy).toHaveBeenCalledWith(
        JSON.stringify({ type: 'test-action', data: 'test' })
      );
    });

    it('cleans up WebSocket on unmount', async () => {
      const { unmount } = renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      const closeSpy = vi.spyOn(mockWebSocketInstance!, 'close');

      unmount();

      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('Additional Message Handlers', () => {
    it('handles cards-grouped message', async () => {
      const { result } = renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      // First add some cards
      act(() => {
        result.current.setCards([
          { id: 'card-1', columnId: 'col-1', content: 'Card 1', authorId: 'user-1', groupId: null, createdAt: new Date() },
          { id: 'card-2', columnId: 'col-1', content: 'Card 2', authorId: 'user-1', groupId: null, createdAt: new Date() },
        ]);
      });

      // Group them
      act(() => {
        mockWebSocketInstance?.simulateMessage({
          type: 'cards-grouped',
          groupId: 'group-1',
          cardIds: ['card-1', 'card-2'],
          columnId: 'col-1',
        });
      });

      await waitFor(() => {
        expect(result.current.cardGroups).toHaveLength(1);
        expect(result.current.cardGroups[0].cardIds).toEqual(['card-1', 'card-2']);
      });
    });

    it('handles card-ungrouped message', async () => {
      const { result } = renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      // First set up cards and a group
      act(() => {
        result.current.setCards([
          { id: 'card-1', columnId: 'col-1', content: 'Card 1', authorId: 'user-1', groupId: 'group-1', createdAt: new Date() },
          { id: 'card-2', columnId: 'col-1', content: 'Card 2', authorId: 'user-1', groupId: 'group-1', createdAt: new Date() },
          { id: 'card-3', columnId: 'col-1', content: 'Card 3', authorId: 'user-1', groupId: 'group-1', createdAt: new Date() },
        ]);
        result.current.setCardGroups([{ id: 'group-1', cardIds: ['card-1', 'card-2', 'card-3'], columnId: 'col-1' }]);
      });

      // Ungroup one card
      act(() => {
        mockWebSocketInstance?.simulateMessage({
          type: 'card-ungrouped',
          cardId: 'card-1',
        });
      });

      await waitFor(() => {
        // Card should have groupId set to null
        const card = result.current.cards.find(c => c.id === 'card-1');
        expect(card?.groupId).toBeNull();
      });
    });

    it('handles vote-added message', async () => {
      const { result } = renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      act(() => {
        mockWebSocketInstance?.simulateMessage({
          type: 'vote-added',
          itemId: 'card-1',
          voterId: 'user-1',
        });
      });

      await waitFor(() => {
        expect(result.current.votes['card-1']).toContain('user-1');
      });
    });

    it('handles vote-removed message', async () => {
      const { result } = renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      // First add a vote
      act(() => {
        result.current.setVotes({ 'card-1': ['user-1', 'user-2'] });
      });

      // Then remove it
      act(() => {
        mockWebSocketInstance?.simulateMessage({
          type: 'vote-removed',
          itemId: 'card-1',
          voterId: 'user-1',
        });
      });

      await waitFor(() => {
        expect(result.current.votes['card-1']).not.toContain('user-1');
        expect(result.current.votes['card-1']).toContain('user-2');
      });
    });

    it('handles vote-removed for non-existent vote', async () => {
      const { result } = renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      act(() => {
        result.current.setVotes({ 'card-1': ['user-2'] });
      });

      // Try to remove a vote that doesn't exist
      act(() => {
        mockWebSocketInstance?.simulateMessage({
          type: 'vote-removed',
          itemId: 'card-1',
          voterId: 'user-999',
        });
      });

      await waitFor(() => {
        // Should not change votes
        expect(result.current.votes['card-1']).toEqual(['user-2']);
      });
    });

    it('handles stage-done-update message', async () => {
      const { result } = renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      act(() => {
        mockWebSocketInstance?.simulateMessage({
          type: 'stage-done-update',
          stageDoneStatus: { 'brainstorm': ['user-1', 'user-2'] },
        });
      });

      await waitFor(() => {
        expect(result.current.stageDoneStatus['brainstorm']).toEqual(['user-1', 'user-2']);
      });
    });

    it('handles reaction-update message', async () => {
      const { result } = renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      act(() => {
        mockWebSocketInstance?.simulateMessage({
          type: 'reaction-update',
          reactions: { 'card-1': { '👍': ['user-1'] } },
        });
      });

      await waitFor(() => {
        expect(result.current.reactions['card-1']).toEqual({ '👍': ['user-1'] });
      });
    });

    it('handles action-item-update (add) message', async () => {
      const { result } = renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      const newAction = {
        id: 'action-1',
        title: 'Fix bug',
        description: '',
        assigneeId: 'user-1',
        priority: 'high',
        dueDate: '',
        status: 'pending',
      };

      act(() => {
        mockWebSocketInstance?.simulateMessage({
          type: 'action-item-update',
          action: 'action-added',
          actionItem: newAction,
        });
      });

      await waitFor(() => {
        expect(result.current.actionItems).toHaveLength(1);
        expect(result.current.actionItems[0].title).toBe('Fix bug');
      });
    });

    it('handles action-item-update (update) message', async () => {
      const { result } = renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      // Add initial action
      act(() => {
        result.current.setActionItems([{
          id: 'action-1',
          title: 'Original title',
          description: '',
          assigneeId: 'user-1',
          priority: 'medium',
          dueDate: '',
          status: 'pending',
        }]);
      });

      // Update the action
      act(() => {
        mockWebSocketInstance?.simulateMessage({
          type: 'action-item-update',
          action: 'action-updated',
          actionItem: {
            id: 'action-1',
            title: 'Updated title',
            description: 'New description',
            assigneeId: 'user-1',
            priority: 'high',
            dueDate: '2024-12-01',
            status: 'in_progress',
          },
        });
      });

      await waitFor(() => {
        expect(result.current.actionItems[0].title).toBe('Updated title');
        expect(result.current.actionItems[0].status).toBe('in_progress');
      });
    });

    it('handles action-item-update (delete) message', async () => {
      const { result } = renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      // Add initial action
      act(() => {
        result.current.setActionItems([{
          id: 'action-1',
          title: 'Task to delete',
          description: '',
          assigneeId: 'user-1',
          priority: 'medium',
          dueDate: '',
          status: 'pending',
        }]);
      });

      // Delete the action
      act(() => {
        mockWebSocketInstance?.simulateMessage({
          type: 'action-item-update',
          action: 'action-deleted',
          actionItemId: 'action-1',
        });
      });

      await waitFor(() => {
        expect(result.current.actionItems).toHaveLength(0);
      });
    });

    it('handles discuss-update (item-marked-discussed) message', async () => {
      const { result } = renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      act(() => {
        mockWebSocketInstance?.simulateMessage({
          type: 'discuss-update',
          action: 'item-marked-discussed',
          itemId: 'card-1',
        });
      });

      await waitFor(() => {
        expect(result.current.discussedItems.has('card-1')).toBe(true);
      });
    });

    it('handles discuss-update (item-unmarked-discussed) message', async () => {
      const { result } = renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      // First mark as discussed
      act(() => {
        result.current.setDiscussedItems(new Set(['card-1']));
      });

      // Then unmark
      act(() => {
        mockWebSocketInstance?.simulateMessage({
          type: 'discuss-update',
          action: 'item-unmarked-discussed',
          itemId: 'card-1',
        });
      });

      await waitFor(() => {
        expect(result.current.discussedItems.has('card-1')).toBe(false);
      });
    });

    it('handles creator-assigned message', async () => {
      renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      act(() => {
        mockWebSocketInstance?.simulateMessage({
          type: 'creator-assigned',
          isCreator: true,
        });
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('You are now the room admin!');
      });
    });

    it('handles user-joined with reconnection', async () => {
      renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      act(() => {
        mockWebSocketInstance?.simulateMessage({
          type: 'user-joined',
          userId: 'user-123',
          userName: 'John Doe',
          isReconnection: true,
          retroId: 'retro-123',
        });
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Reconnected as John Doe');
      });
    });

    it('handles user-joined with current state restoration', async () => {
      const { result } = renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      act(() => {
        mockWebSocketInstance?.simulateMessage({
          type: 'user-joined',
          userId: 'user-123',
          userName: 'John',
          retroId: 'retro-123',
          currentState: {
            currentStage: 2,
            cards: [{ id: 'card-1', content: 'Test', columnId: 'col-1', authorId: 'user-1', groupId: null, createdAt: new Date().toISOString() }],
            cardGroups: [{ id: 'group-1', cardIds: ['card-1'], columnId: 'col-1' }],
            votes: { 'card-1': ['user-1'] },
            actionItems: [{ id: 'action-1', title: 'Task', description: '', assigneeId: '', priority: 'low', dueDate: '', status: 'pending' }],
            discussedItems: ['card-1'],
            stageDoneStatus: { 'brainstorm': ['user-1'] },
            reactions: { 'card-1': { '👍': ['user-1'] } },
            icebreakerState: { question: 'What is your hobby?' },
          },
        });
      });

      await waitFor(() => {
        expect(result.current.currentStageIndex).toBe(2);
        expect(result.current.cards).toHaveLength(1);
        expect(result.current.cardGroups).toHaveLength(1);
        expect(result.current.votes['card-1']).toEqual(['user-1']);
        expect(result.current.actionItems).toHaveLength(1);
        expect(result.current.discussedItems.has('card-1')).toBe(true);
      });
    });

    it('handles participants-update with new participant toast', async () => {
      const { result } = renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      // Set current user
      act(() => {
        mockWebSocketInstance?.simulateMessage({
          type: 'user-joined',
          userId: 'user-1',
          userName: 'Alice',
          retroId: 'retro-123',
        });
      });

      await waitFor(() => {
        expect(result.current.currentUserId).toBe('user-1');
      });

      // Another user joins
      act(() => {
        mockWebSocketInstance?.simulateMessage({
          type: 'participants-update',
          participants: [
            { id: 'user-1', name: 'Alice', isCreator: true },
            { id: 'user-2', name: 'Bob', isCreator: false },
          ],
          newParticipant: { id: 'user-2', name: 'Bob' },
        });
      });

      await waitFor(() => {
        expect(result.current.participants).toHaveLength(2);
      });
    });

    it('handles stage-change and shows toast', async () => {
      renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      act(() => {
        mockWebSocketInstance?.simulateMessage({
          type: 'stage-change',
          stageIndex: 1,
        });
      });

      // Toast should be called with stage name
      await waitFor(() => {
        expect(toast).toHaveBeenCalled();
      });
    });
  });

  describe('WebSocket Error Handling', () => {
    it('handles WebSocket errors', async () => {
      renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      act(() => {
        mockWebSocketInstance?.onerror?.(new Event('error'));
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Connection error. Please refresh the page.');
      });
    });

    it('handles unexpected WebSocket close', async () => {
      renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      // Simulate unexpected close (not 1000 or 1001)
      act(() => {
        mockWebSocketInstance?.onclose?.(new CloseEvent('close', { code: 1006, reason: 'Abnormal closure' }));
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Connection lost. Please refresh the page.');
      });
    });

    it('handles malformed WebSocket messages', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
      });

      act(() => {
        if (mockWebSocketInstance?.onmessage) {
          mockWebSocketInstance.onmessage(new MessageEvent('message', { data: 'invalid json' }));
        }
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error parsing WebSocket message:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('uses stored userId for reconnection', async () => {
      sessionStorage.setItem('retro_userId_retro-123', 'stored-user-123');

      renderHook(() =>
        useRetroWebSocket({ retroId: 'retro-123', enabledStages })
      );

      await waitFor(() => {
        expect(mockWebSocketInstance).not.toBeNull();
        expect(mockWebSocketInstance?.url).toContain('userId=stored-user-123');
      });

      sessionStorage.removeItem('retro_userId_retro-123');
    });
  });

});
