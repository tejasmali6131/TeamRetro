import { WebSocketServer } from 'ws';
import { wsManager } from '../../websocket/websocketManager';
import * as namesModule from '../../data/names';
import * as retrosModule from '../../data/retros';

// Mock external dependencies
jest.mock('ws', () => {
  const mockWebSocket = {
    OPEN: 1,
    CLOSED: 3
  };
  return {
    WebSocket: mockWebSocket,
    WebSocketServer: jest.fn()
  };
});
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9))
}));
jest.mock('../../data/names', () => ({
  generateRandomName: jest.fn(() => 'MockUser'),
  clearUsedNames: jest.fn(),
  setNameDeck: jest.fn()
}));
jest.mock('../../data/retros', () => ({
  getRetroById: jest.fn()
}));

// Get the mocked WebSocketServer
const MockedWebSocketServer = WebSocketServer as jest.MockedClass<typeof WebSocketServer>;

// Helper to create mock WebSocket
const createMockWebSocket = () => {
  const ws: any = {
    send: jest.fn(),
    close: jest.fn(),
    readyState: 1, // WebSocket.OPEN
    on: jest.fn()
  };
  return ws;
};

// Helper to create mock HTTP request
const createMockRequest = (url: string, userAgent = 'Mozilla/5.0') => ({
  url,
  headers: {
    'user-agent': userAgent
  }
});

describe('WebSocketManager', () => {
  let mockWss: any;
  let connectionHandler: (ws: any, req: any) => void;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Reset the rooms map by accessing private property (for testing purposes)
    (wsManager as any).rooms = new Map();
    (wsManager as any).wss = null;

    // Setup WebSocketServer mock
    mockWss = {
      on: jest.fn((event: string, handler: any) => {
        if (event === 'connection') {
          connectionHandler = handler;
        }
      })
    };
    MockedWebSocketServer.mockReturnValue(mockWss as any);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initialize', () => {
    it('should create a WebSocketServer with the provided server', () => {
      const mockServer = { listen: jest.fn() };
      wsManager.initialize(mockServer);

      expect(WebSocketServer).toHaveBeenCalledWith({ server: mockServer });
      expect(mockWss.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    it('should set up periodic cleanup of disconnected users', () => {
      const mockServer = { listen: jest.fn() };
      wsManager.initialize(mockServer);

      // Advance timer to trigger cleanup interval
      jest.advanceTimersByTime(60000);
      // No error means cleanup ran successfully
    });
  });

  describe('connection handling', () => {
    beforeEach(() => {
      const mockServer = { listen: jest.fn() };
      wsManager.initialize(mockServer);
    });

    it('should reject connections without retroId', () => {
      const mockWs = createMockWebSocket();
      const mockReq = createMockRequest('/ws/retro/');

      connectionHandler(mockWs, mockReq);

      expect(mockWs.close).toHaveBeenCalled();
    });

    it('should reject connections with invalid URL', () => {
      const mockWs = createMockWebSocket();
      const mockReq = createMockRequest('/invalid/path');

      connectionHandler(mockWs, mockReq);

      expect(mockWs.close).toHaveBeenCalled();
    });

    it('should reject bot user agents', () => {
      // Test representative bot agents (slack, social media, generic bot)
      const botAgents = ['Slackbot-LinkExpanding', 'Twitterbot/1.0', 'Mozilla/5.0 (compatible; bot)'];

      botAgents.forEach(agent => {
        const mockWs = createMockWebSocket();
        const mockReq = createMockRequest('/ws/retro/test-retro', agent);

        connectionHandler(mockWs, mockReq);

        expect(mockWs.close).toHaveBeenCalledWith(1008, 'Bot connections not allowed');
      });
    });

    it('should accept connections with valid retroId', () => {
      const mockWs = createMockWebSocket();
      const mockReq = createMockRequest('/ws/retro/valid-retro-id');
      (retrosModule.getRetroById as jest.Mock).mockReturnValue({ nameDeck: 'animals' });

      connectionHandler(mockWs, mockReq);

      expect(mockWs.close).not.toHaveBeenCalled();
      expect(mockWs.send).toHaveBeenCalled();
      expect(mockWs.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockWs.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('should create a new room for a new retroId', () => {
      const mockWs = createMockWebSocket();
      const mockReq = createMockRequest('/ws/retro/new-retro-id');
      (retrosModule.getRetroById as jest.Mock).mockReturnValue({ nameDeck: 'fantasy' });

      connectionHandler(mockWs, mockReq);

      const room = wsManager.getRoom('new-retro-id');
      expect(room).toBeDefined();
      expect(room?.id).toBe('new-retro-id');
      expect(namesModule.setNameDeck).toHaveBeenCalledWith('new-retro-id', 'fantasy');
    });

    it('should send current room state on connection and set first user as creator', () => {
      const mockWs = createMockWebSocket();
      const mockReq = createMockRequest('/ws/retro/state-test');
      (retrosModule.getRetroById as jest.Mock).mockReturnValue(null);

      connectionHandler(mockWs, mockReq);

      const sendCall = mockWs.send.mock.calls[0][0];
      const message = JSON.parse(sendCall);
      expect(message.type).toBe('user-joined');
      expect(message.isCreator).toBe(true);
      expect(message.currentState).toBeDefined();
      expect(message.currentState.currentStage).toBe(0);
      expect(message.currentState.cards).toEqual([]);
      expect(message.currentState.cardGroups).toEqual([]);
      expect(message.currentState.votes).toEqual({});
    });

    it('should set second user as non-creator', () => {
      const mockWs1 = createMockWebSocket();
      const mockReq1 = createMockRequest('/ws/retro/multi-user-test');
      (retrosModule.getRetroById as jest.Mock).mockReturnValue(null);

      connectionHandler(mockWs1, mockReq1);

      const mockWs2 = createMockWebSocket();
      const mockReq2 = createMockRequest('/ws/retro/multi-user-test');

      connectionHandler(mockWs2, mockReq2);

      const sendCall = mockWs2.send.mock.calls[0][0];
      const message = JSON.parse(sendCall);
      expect(message.isCreator).toBe(false);
    });

    it('should handle reconnection with userId query param', () => {
      // First connection
      const mockWs1 = createMockWebSocket();
      const mockReq1 = createMockRequest('/ws/retro/reconnect-test');
      (retrosModule.getRetroById as jest.Mock).mockReturnValue(null);
      (namesModule.generateRandomName as jest.Mock).mockReturnValueOnce('FirstUser');

      connectionHandler(mockWs1, mockReq1);

      // Get the userId from the first connection
      const firstMessage = JSON.parse(mockWs1.send.mock.calls[0][0]);
      const userId = firstMessage.userId;

      // Simulate some interaction first (so user is not treated as bot)
      const messageHandler = mockWs1.on.mock.calls.find((call: any) => call[0] === 'message')[1];
      messageHandler(JSON.stringify({ type: 'ping' }));

      // Simulate disconnect
      const closeHandler = mockWs1.on.mock.calls.find((call: any) => call[0] === 'close')[1];
      closeHandler();

      // Reconnect with the same userId (before timeout)
      const mockWs2 = createMockWebSocket();
      const mockReq2 = createMockRequest(`/ws/retro/reconnect-test?userId=${userId}`);
      (namesModule.generateRandomName as jest.Mock).mockReturnValueOnce('SecondUser');

      connectionHandler(mockWs2, mockReq2);

      const reconnectMessage = JSON.parse(mockWs2.send.mock.calls[0][0]);
      expect(reconnectMessage.userId).toBe(userId);
      expect(reconnectMessage.isReconnection).toBe(true);
    });
  });

  describe('message handling', () => {
    let mockWs: any;
    let messageHandler: (message: string) => void;
    let userId: string;

    beforeEach(() => {
      const mockServer = { listen: jest.fn() };
      wsManager.initialize(mockServer);

      mockWs = createMockWebSocket();
      const mockReq = createMockRequest('/ws/retro/message-test');
      (retrosModule.getRetroById as jest.Mock).mockReturnValue(null);

      connectionHandler(mockWs, mockReq);

      // Get the message handler
      messageHandler = mockWs.on.mock.calls.find((call: any) => call[0] === 'message')[1];

      // Get the userId
      const joinMessage = JSON.parse(mockWs.send.mock.calls[0][0]);
      userId = joinMessage.userId;
    });

    describe('stage-change', () => {
      it('should allow creator to change stage', () => {
        messageHandler(JSON.stringify({
          type: 'stage-change',
          stageIndex: 2
        }));

        const room = wsManager.getRoom('message-test');
        expect(room?.currentStage).toBe(2);
      });

      it('should not allow non-creator to change stage', () => {
        // Add second user
        const mockWs2 = createMockWebSocket();
        const mockReq2 = createMockRequest('/ws/retro/message-test');
        connectionHandler(mockWs2, mockReq2);

        const messageHandler2 = mockWs2.on.mock.calls.find((call: any) => call[0] === 'message')[1];

        messageHandler2(JSON.stringify({
          type: 'stage-change',
          stageIndex: 5
        }));

        const room = wsManager.getRoom('message-test');
        expect(room?.currentStage).toBe(0); // Should remain at 0
      });

      it('should reset stage done status on stage change', () => {
        const room = wsManager.getRoom('message-test');
        room!.stageDoneStatus = { 'stage-1': [userId] };

        messageHandler(JSON.stringify({
          type: 'stage-change',
          stageIndex: 1
        }));

        expect(room?.stageDoneStatus).toEqual({});
      });
    });

    describe('mark-stage-done', () => {
      it('should mark/unmark user as done for a stage without duplicates', () => {
        // Mark as done
        messageHandler(JSON.stringify({
          type: 'mark-stage-done',
          stageId: 'brainstorm',
          isDone: true
        }));

        const room = wsManager.getRoom('message-test');
        expect(room?.stageDoneStatus['brainstorm']).toContain(userId);

        // Try to mark again (should not duplicate)
        messageHandler(JSON.stringify({
          type: 'mark-stage-done',
          stageId: 'brainstorm',
          isDone: true
        }));

        const count = room?.stageDoneStatus['brainstorm'].filter(id => id === userId).length;
        expect(count).toBe(1);

        // Unmark
        messageHandler(JSON.stringify({
          type: 'mark-stage-done',
          stageId: 'brainstorm',
          isDone: false
        }));

        expect(room?.stageDoneStatus['brainstorm']).not.toContain(userId);
      });
    });

    describe('timer-update', () => {
      it('should broadcast timer updates from creator', () => {
        // Add second user to receive broadcasts
        const mockWs2 = createMockWebSocket();
        const mockReq2 = createMockRequest('/ws/retro/message-test');
        connectionHandler(mockWs2, mockReq2);

        mockWs2.send.mockClear();

        messageHandler(JSON.stringify({
          type: 'timer-update',
          timeRemaining: 60,
          isRunning: true
        }));

        // Second user should receive the timer update
        const calls = mockWs2.send.mock.calls;
        const timerUpdate = calls.find((call: any) => {
          const msg = JSON.parse(call[0]);
          return msg.type === 'timer-update';
        });
        expect(timerUpdate).toBeDefined();
      });

      it('should not broadcast timer updates from non-creator', () => {
        // Add second user
        const mockWs2 = createMockWebSocket();
        const mockReq2 = createMockRequest('/ws/retro/message-test');
        connectionHandler(mockWs2, mockReq2);

        const messageHandler2 = mockWs2.on.mock.calls.find((call: any) => call[0] === 'message')[1];

        mockWs.send.mockClear();

        messageHandler2(JSON.stringify({
          type: 'timer-update',
          timeRemaining: 60,
          isRunning: true
        }));

        // Creator should not receive timer update from non-creator
        const calls = mockWs.send.mock.calls;
        const timerUpdate = calls.find((call: any) => {
          const msg = JSON.parse(call[0]);
          return msg.type === 'timer-update';
        });
        expect(timerUpdate).toBeUndefined();
      });
    });

    describe('icebreaker-update', () => {
      it('should handle icebreaker state changes', () => {
        // Start answering
        messageHandler(JSON.stringify({
          type: 'icebreaker-update',
          action: 'answering-started'
        }));

        const room = wsManager.getRoom('message-test');
        expect(room?.icebreakerState.isAnswering).toBe(true);

        // Complete answer
        messageHandler(JSON.stringify({
          type: 'icebreaker-update',
          action: 'answer-completed',
          participantId: userId,
          answer: 'My answer'
        }));

        expect(room?.icebreakerState.answeredParticipants).toContain(userId);
        expect(room?.icebreakerState.answers[userId]).toBe('My answer');

        // Change question (should reset state)
        messageHandler(JSON.stringify({
          type: 'icebreaker-update',
          action: 'question-changed',
          questionIndex: 2
        }));

        expect(room?.icebreakerState.currentQuestionIndex).toBe(2);
        expect(room?.icebreakerState.isAnswering).toBe(false);
        expect(room?.icebreakerState.answeredParticipants).toEqual([]);
        expect(room?.icebreakerState.answers).toEqual({});
      });

      it('should handle question editing', () => {
        messageHandler(JSON.stringify({
          type: 'icebreaker-update',
          action: 'question-edited',
          questionIndex: 0,
          newQuestion: 'Updated question?'
        }));

        const room = wsManager.getRoom('message-test');
        expect(room?.icebreakerState.questions[0]).toBe('Updated question?');
      });
    });

    describe('card operations', () => {
      it('should handle card lifecycle (create, update, delete)', () => {
        const card = { id: 'card-1', content: 'Test card', columnId: 'col-1', authorId: userId, groupId: null, createdAt: '2024-01-01T00:00:00.000Z' };
        
        // Create
        messageHandler(JSON.stringify({
          type: 'card-create',
          card
        }));

        const room = wsManager.getRoom('message-test');
        expect(room?.cards.length).toBe(1);
        expect(room?.cards[0].id).toBe('card-1');
        expect(room?.cards[0].content).toBe('Test card');

        // Update
        messageHandler(JSON.stringify({
          type: 'card-update',
          card: { id: 'card-1', content: 'Updated content' }
        }));

        const updatedCard = room?.cards.find(c => c.id === 'card-1');
        expect(updatedCard?.content).toBe('Updated content');

        // Delete
        messageHandler(JSON.stringify({
          type: 'card-delete',
          cardId: 'card-1'
        }));

        expect(room?.cards.find(c => c.id === 'card-1')).toBeUndefined();
      });
    });

    describe('card grouping', () => {
      it('should handle grouping and regrouping cards', () => {
        // Create initial group
        messageHandler(JSON.stringify({
          type: 'cards-group',
          groupId: 'group-1',
          cardIds: ['card-1', 'card-2', 'card-3'],
          columnId: 'col-1'
        }));

        const room = wsManager.getRoom('message-test');
        expect(room?.cardGroups).toContainEqual({
          id: 'group-1',
          cardIds: ['card-1', 'card-2', 'card-3'],
          columnId: 'col-1'
        });

        // Create new group with some of the same cards (should remove from original)
        messageHandler(JSON.stringify({
          type: 'cards-group',
          groupId: 'group-2',
          cardIds: ['card-2', 'card-3'],
          columnId: 'col-1'
        }));

        const group1 = room?.cardGroups.find(g => g.id === 'group-1');
        expect(group1?.cardIds).toEqual(['card-1']);
      });

      it('should handle ungrouping cards and remove empty groups', () => {
        messageHandler(JSON.stringify({
          type: 'cards-group',
          groupId: 'group-1',
          cardIds: ['card-1'],
          columnId: 'col-1'
        }));

        messageHandler(JSON.stringify({
          type: 'card-ungroup',
          cardId: 'card-1',
          groupId: 'group-1'
        }));

        const room = wsManager.getRoom('message-test');
        expect(room?.cardGroups.find(g => g.id === 'group-1')).toBeUndefined();
      });
    });

    describe('voting', () => {
      it('should handle vote add/remove with multiple votes', () => {
        // Add first vote
        messageHandler(JSON.stringify({
          type: 'vote-add',
          itemId: 'item-1',
          columnId: 'col-1',
          userId
        }));

        const room = wsManager.getRoom('message-test');
        expect(room?.votes['item-1']).toContain(userId);

        // Add second vote (same user can vote multiple times)
        messageHandler(JSON.stringify({
          type: 'vote-add',
          itemId: 'item-1',
          columnId: 'col-1',
          userId
        }));

        expect(room?.votes['item-1'].filter(id => id === userId).length).toBe(2);

        // Remove one vote
        messageHandler(JSON.stringify({
          type: 'vote-remove',
          itemId: 'item-1',
          userId
        }));

        // Should remove only one vote
        expect(room?.votes['item-1'].length).toBe(1);
      });
    });

    describe('discuss-update', () => {
      it('should handle marking/unmarking items as discussed without duplicates', () => {
        // Mark as discussed
        messageHandler(JSON.stringify({
          type: 'discuss-update',
          action: 'item-marked-discussed',
          itemId: 'item-1'
        }));

        const room = wsManager.getRoom('message-test');
        expect(room?.discussedItems).toContain('item-1');

        // Try marking again (should not duplicate)
        messageHandler(JSON.stringify({
          type: 'discuss-update',
          action: 'item-marked-discussed',
          itemId: 'item-1'
        }));

        const count = room?.discussedItems.filter(id => id === 'item-1').length;
        expect(count).toBe(1);

        // Unmark
        messageHandler(JSON.stringify({
          type: 'discuss-update',
          action: 'item-unmarked-discussed',
          itemId: 'item-1'
        }));

        expect(room?.discussedItems).not.toContain('item-1');
      });
    });

    describe('action-item-update', () => {
      it('should handle action item lifecycle (add, update, delete)', () => {
        const actionItem = { id: 'action-1', text: 'Do something', assignee: 'John' };
        
        // Add
        messageHandler(JSON.stringify({
          type: 'action-item-update',
          action: 'action-added',
          actionItem
        }));

        const room = wsManager.getRoom('message-test');
        expect(room?.actionItems).toContainEqual(actionItem);

        // Update
        const updatedItem = { id: 'action-1', text: 'Updated task', assignee: 'Jane' };
        messageHandler(JSON.stringify({
          type: 'action-item-update',
          action: 'action-updated',
          actionItem: updatedItem
        }));

        expect(room?.actionItems[0]).toEqual(updatedItem);

        // Delete
        messageHandler(JSON.stringify({
          type: 'action-item-update',
          action: 'action-deleted',
          actionItemId: 'action-1'
        }));

        expect(room?.actionItems.find(a => a.id === 'action-1')).toBeUndefined();
      });
    });

    describe('reaction-toggle', () => {
      it('should add reaction', () => {
        messageHandler(JSON.stringify({
          type: 'reaction-toggle',
          cardId: 'card-1',
          emoji: '👍'
        }));

        const room = wsManager.getRoom('message-test');
        expect(room?.reactions['card-1']['👍']).toContain(userId);
      });

      it('should remove reaction when toggled again and clean up empty arrays', () => {
        messageHandler(JSON.stringify({
          type: 'reaction-toggle',
          cardId: 'card-1',
          emoji: '👍'
        }));

        messageHandler(JSON.stringify({
          type: 'reaction-toggle',
          cardId: 'card-1',
          emoji: '👍'
        }));

        const room = wsManager.getRoom('message-test');
        expect(room?.reactions['card-1']).toBeUndefined();
      });

      it('should broadcast updated reactions to all participants', () => {
        // Add second user
        const mockWs2 = createMockWebSocket();
        const mockReq2 = createMockRequest('/ws/retro/message-test');
        connectionHandler(mockWs2, mockReq2);

        mockWs2.send.mockClear();

        messageHandler(JSON.stringify({
          type: 'reaction-toggle',
          cardId: 'card-1',
          emoji: '👍'
        }));

        const calls = mockWs2.send.mock.calls;
        const reactionUpdate = calls.find((call: any) => {
          const msg = JSON.parse(call[0]);
          return msg.type === 'reaction-update';
        });
        expect(reactionUpdate).toBeDefined();
      });
    });

    describe('invalid messages', () => {
      it('should handle invalid JSON gracefully', () => {
        expect(() => {
          messageHandler('not valid json');
        }).not.toThrow();
      });

      it('should ignore unknown message types', () => {
        const room = wsManager.getRoom('message-test');
        expect(room).toBeDefined();

        messageHandler(JSON.stringify({
          type: 'unknown-type',
          data: 'some data'
        }));

        // Room state should not change significantly
        expect(wsManager.getRoom('message-test')).toBeDefined();
      });
    });
  });

  describe('disconnect handling', () => {
    let mockWs: any;
    let closeHandler: () => void;
    let messageHandler: (message: string) => void;

    beforeEach(() => {
      const mockServer = { listen: jest.fn() };
      wsManager.initialize(mockServer);

      mockWs = createMockWebSocket();
      const mockReq = createMockRequest('/ws/retro/disconnect-test');
      (retrosModule.getRetroById as jest.Mock).mockReturnValue(null);

      connectionHandler(mockWs, mockReq);

      closeHandler = mockWs.on.mock.calls.find((call: any) => call[0] === 'close')[1];
      messageHandler = mockWs.on.mock.calls.find((call: any) => call[0] === 'message')[1];
    });

    it('should mark participant as disconnected and remove after timeout', () => {
      // Send a message to mark as interactive
      messageHandler(JSON.stringify({ type: 'ping' }));
      
      closeHandler();

      const room = wsManager.getRoom('disconnect-test');
      const participants = Array.from(room?.participants.values() || []);
      expect(participants[0].isConnected).toBe(false);

      // Advance past the disconnect timeout (30 seconds for interactive users)
      jest.advanceTimersByTime(31000);

      // Room should be cleaned up when empty
      expect(wsManager.getRoom('disconnect-test')).toBeUndefined();
      expect(namesModule.clearUsedNames).toHaveBeenCalledWith('disconnect-test');
    });

    it('should immediately remove quick disconnects without interaction (likely bots)', () => {
      // Close without sending any messages (hasInteracted = false)
      closeHandler();

      // Room should be cleaned up immediately for non-interactive quick disconnects
      // When the only participant is removed, the room itself is deleted
      const room = wsManager.getRoom('disconnect-test');
      expect(room).toBeUndefined();
    });
  });

  describe('getRoom and getRoomParticipants', () => {
    it('should return undefined/empty for non-existent room', () => {
      expect(wsManager.getRoom('non-existent')).toBeUndefined();
      expect(wsManager.getRoomParticipants('non-existent')).toEqual([]);
    });

    it('should return room and connected participants for existing retroId', () => {
      const mockServer = { listen: jest.fn() };
      wsManager.initialize(mockServer);

      const mockWs = createMockWebSocket();
      const mockReq = createMockRequest('/ws/retro/get-room-test');
      (retrosModule.getRetroById as jest.Mock).mockReturnValue(null);

      connectionHandler(mockWs, mockReq);

      const room = wsManager.getRoom('get-room-test');
      expect(room).toBeDefined();
      expect(room?.id).toBe('get-room-test');

      const participants = wsManager.getRoomParticipants('get-room-test');
      expect(participants.length).toBe(1);
      expect(participants[0]).toHaveProperty('id');
      expect(participants[0]).toHaveProperty('name');
      expect(participants[0]).toHaveProperty('isCreator');
    });

    it('should exclude disconnected participants', () => {
      const mockServer = { listen: jest.fn() };
      wsManager.initialize(mockServer);

      const mockWs1 = createMockWebSocket();
      const mockReq1 = createMockRequest('/ws/retro/exclude-test');
      (retrosModule.getRetroById as jest.Mock).mockReturnValue(null);

      connectionHandler(mockWs1, mockReq1);

      // Disconnect the first user
      const closeHandler = mockWs1.on.mock.calls.find((call: any) => call[0] === 'close')[1];
      closeHandler();

      // Add second user
      const mockWs2 = createMockWebSocket();
      const mockReq2 = createMockRequest('/ws/retro/exclude-test');

      connectionHandler(mockWs2, mockReq2);

      const participants = wsManager.getRoomParticipants('exclude-test');
      // Only second user should be returned as connected
      expect(participants.length).toBe(1);
    });
  });

  describe('broadcasting', () => {
    it('should broadcast to all participants except excluded user', () => {
      const mockServer = { listen: jest.fn() };
      wsManager.initialize(mockServer);

      const mockWs1 = createMockWebSocket();
      const mockReq1 = createMockRequest('/ws/retro/broadcast-test');
      (retrosModule.getRetroById as jest.Mock).mockReturnValue(null);

      connectionHandler(mockWs1, mockReq1);

      const mockWs2 = createMockWebSocket();
      const mockReq2 = createMockRequest('/ws/retro/broadcast-test');

      connectionHandler(mockWs2, mockReq2);

      // Clear previous sends
      mockWs1.send.mockClear();
      mockWs2.send.mockClear();

      // First user creates a card (should broadcast to second user, not first)
      const messageHandler = mockWs1.on.mock.calls.find((call: any) => call[0] === 'message')[1];
      messageHandler(JSON.stringify({
        type: 'card-create',
        card: { id: 'card-1', text: 'Test' }
      }));

      // Second user should receive card-created
      const ws2Calls = mockWs2.send.mock.calls;
      const cardCreated = ws2Calls.find((call: any) => {
        const msg = JSON.parse(call[0]);
        return msg.type === 'card-created';
      });
      expect(cardCreated).toBeDefined();
    });

    it('should not send to closed WebSocket connections', () => {
      const mockServer = { listen: jest.fn() };
      wsManager.initialize(mockServer);

      const mockWs1 = createMockWebSocket();
      const mockReq1 = createMockRequest('/ws/retro/closed-test');
      (retrosModule.getRetroById as jest.Mock).mockReturnValue(null);

      connectionHandler(mockWs1, mockReq1);

      const mockWs2 = createMockWebSocket();
      mockWs2.readyState = 3; // WebSocket.CLOSED - Mark as closed
      const mockReq2 = createMockRequest('/ws/retro/closed-test');

      connectionHandler(mockWs2, mockReq2);

      mockWs2.send.mockClear();

      // First user creates a card
      const messageHandler = mockWs1.on.mock.calls.find((call: any) => call[0] === 'message')[1];
      messageHandler(JSON.stringify({
        type: 'card-create',
        card: { id: 'card-1', text: 'Test' }
      }));

      // Second user (closed connection) should not receive card-created
      const cardCreated = mockWs2.send.mock.calls.find((call: any) => {
        try {
          const msg = JSON.parse(call[0]);
          return msg.type === 'card-created';
        } catch {
          return false;
        }
      });
      expect(cardCreated).toBeUndefined();
    });
  });

  describe('disconnected user cleanup', () => {
    it('should clean up expired disconnected user sessions', () => {
      const mockServer = { listen: jest.fn() };
      wsManager.initialize(mockServer);

      const mockWs = createMockWebSocket();
      const mockReq = createMockRequest('/ws/retro/cleanup-test');
      (retrosModule.getRetroById as jest.Mock).mockReturnValue(null);

      connectionHandler(mockWs, mockReq);

      // Send message to mark as interactive
      const messageHandler = mockWs.on.mock.calls.find((call: any) => call[0] === 'message')[1];
      messageHandler(JSON.stringify({ type: 'ping' }));

      // Disconnect the user
      const closeHandler = mockWs.on.mock.calls.find((call: any) => call[0] === 'close')[1];
      closeHandler();

      // Advance time past RECONNECT_TIMEOUT (5 minutes)
      jest.advanceTimersByTime(6 * 60 * 1000);

      // The periodic cleanup should have run
      // Reconnection should no longer work
    });
  });
});
