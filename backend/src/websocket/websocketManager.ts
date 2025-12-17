import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { generateRandomName, clearUsedNames, setNameDeck } from '../data/names';
import { getRetroById } from '../data/retros';

interface Participant {
  id: string;
  name: string;
  ws: WebSocket | null;
  retroId: string;
  joinedAt: Date;
  isCreator: boolean;
  isConnected: boolean;
}

interface Card {
  id: string;
  columnId: string;
  content: string;
  authorId: string;
  groupId: string | null;
  createdAt: Date;
}

interface CardGroup {
  id: string;
  cardIds: string[];
  columnId: string;
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface RetroRoom {
  id: string;
  participants: Map<string, Participant>;
  creatorId: string;
  currentStage: number;
  // Persistent state
  cards: Card[];
  cardGroups: CardGroup[];
  votes: { [itemId: string]: string[] };
  actionItems: ActionItem[];
  discussedItems: string[];
  // Track which users are done with each stage (stageId -> userId[])
  stageDoneStatus: { [stageId: string]: string[] };
  // Card reactions: cardId -> { emoji: userId[] }
  reactions: { [cardId: string]: { [emoji: string]: string[] } };
}

// Store for disconnected users (to allow reconnection within a time window)
const disconnectedUsers: Map<string, { retroId: string; name: string; isCreator: boolean; disconnectedAt: Date }> = new Map();
const RECONNECT_TIMEOUT = 5 * 60 * 1000; // 5 minutes to reconnect

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private rooms: Map<string, RetroRoom> = new Map();

  initialize(server: any) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket, req) => {
      // Extract retroId and optional userId from URL: /ws/retro/{retroId}?userId={userId}
      const urlMatch = req.url?.match(/\/ws\/retro\/([^\/\?]+)/);
      const retroId = urlMatch?.[1];
      
      // Parse query parameters for userId (for reconnection)
      const urlParams = new URLSearchParams(req.url?.split('?')[1] || '');
      const existingUserId = urlParams.get('userId');

      if (!retroId) {
        console.log('WebSocket connection rejected: no retroId');
        ws.close();
        return;
      }

      this.handleConnection(ws, retroId, existingUserId);
    });

    // Cleanup disconnected users periodically
    setInterval(() => {
      const now = Date.now();
      disconnectedUsers.forEach((data, odUserId) => {
        if (now - data.disconnectedAt.getTime() > RECONNECT_TIMEOUT) {
          disconnectedUsers.delete(odUserId);
          console.log(`Cleaned up disconnected user session: ${odUserId}`);
        }
      });
    }, 60000); // Check every minute
  }

  private handleConnection(ws: WebSocket, retroId: string, existingUserId: string | null) {
    let userId: string;
    let userName: string;
    let isReconnection = false;

    // Get or create room
    if (!this.rooms.has(retroId)) {
      // Set the name deck for this retro session
      const retro = getRetroById(retroId);
      if (retro && retro.nameDeck) {
        setNameDeck(retroId, retro.nameDeck);
      }
      
      console.log(`Creating new room for retro ${retroId}`);
      this.rooms.set(retroId, {
        id: retroId,
        participants: new Map(),
        creatorId: '',
        currentStage: 0,
        cards: [],
        cardGroups: [],
        votes: {},
        actionItems: [],
        discussedItems: [],
        stageDoneStatus: {},
        reactions: {}
      });
    } else {
      console.log(`Room ${retroId} already exists`);
    }

    const room = this.rooms.get(retroId)!;

    // Check if this is a reconnection attempt
    if (existingUserId) {
      // Check if user exists in disconnected users
      const disconnectedUser = disconnectedUsers.get(existingUserId);
      if (disconnectedUser && disconnectedUser.retroId === retroId) {
        // Reconnecting user
        userId = existingUserId;
        userName = disconnectedUser.name;
        isReconnection = true;
        disconnectedUsers.delete(existingUserId);
        console.log(`User ${userName} (${userId}) reconnecting to retro ${retroId}`);
      } else {
        // Check if user still exists in room (just disconnected WebSocket)
        const existingParticipant = room.participants.get(existingUserId);
        if (existingParticipant) {
          userId = existingUserId;
          userName = existingParticipant.name;
          isReconnection = true;
          console.log(`User ${userName} (${userId}) reconnecting (was still in room) to retro ${retroId}`);
        } else if (room.creatorId === existingUserId) {
          // The user was the creator but got disconnected - restore them
          userId = existingUserId;
          userName = generateRandomName(retroId);
          isReconnection = true;
          console.log(`User ${userId} reconnecting as creator to retro ${retroId}`);
        } else {
          // existingUserId not valid, create new user
          userId = uuidv4();
          userName = generateRandomName(retroId);
        }
      }
    } else {
      // New user
      userId = uuidv4();
      userName = generateRandomName(retroId);
    }

    // Determine if this user should be the creator
    // User is creator if: room has no creator, OR user's ID matches room's creatorId, 
    // OR room was just created and all previous participants are disconnected (StrictMode recovery)
    console.log(`Room ${retroId} - current creatorId: "${room.creatorId}", participants count: ${room.participants.size}`);
    
    const connectedParticipants = Array.from(room.participants.values()).filter(p => p.isConnected);
    const roomHasNoActiveCreator = !room.creatorId || 
      (room.creatorId && !room.participants.get(room.creatorId)?.isConnected && connectedParticipants.length === 0);
    
    if (roomHasNoActiveCreator && room.creatorId !== userId) {
      room.creatorId = userId;
      console.log(`User ${userName} (${userId}) is the room creator (new or recovered)`);
    } else if (room.creatorId === userId) {
      console.log(`User ${userName} (${userId}) is reconnecting as the room creator`);
    } else {
      console.log(`User ${userName} (${userId}) is NOT the creator - creator is ${room.creatorId}`);
    }

    const participant: Participant = {
      id: userId,
      name: userName,
      ws,
      retroId,
      joinedAt: new Date(),
      isCreator: userId === room.creatorId,
      isConnected: true
    };

    room.participants.set(userId, participant);

    // Send user their ID, name, and current state
    ws.send(JSON.stringify({
      type: 'user-joined',
      userId,
      userName,
      isCreator: userId === room.creatorId,
      isReconnection,
      // Send current room state for state restoration
      currentState: {
        currentStage: room.currentStage,
        cards: room.cards,
        cardGroups: room.cardGroups,
        votes: room.votes,
        actionItems: room.actionItems,
        discussedItems: room.discussedItems,
        stageDoneStatus: room.stageDoneStatus,
        reactions: room.reactions
      }
    }));

    // Broadcast updated participants list to all
    this.broadcastParticipants(retroId, isReconnection ? undefined : participant);

    // Handle messages
    ws.on('message', (message: string) => {
      this.handleMessage(userId, retroId, message);
    });

    // Handle disconnect
    ws.on('close', () => {
      this.handleDisconnect(userId, retroId);
    });

    console.log(`User ${userName} (${userId}) ${isReconnection ? 'reconnected to' : 'joined'} retro ${retroId}`);
  }

  private handleMessage(userId: string, retroId: string, message: string) {
    try {
      const data = JSON.parse(message.toString());
      const room = this.rooms.get(retroId);

      if (!room) return;

      switch (data.type) {
        case 'stage-change':
          // Only creator can change stages
          if (room.creatorId === userId) {
            room.currentStage = data.stageIndex;
            // Reset stage done status when stage changes
            room.stageDoneStatus = {};
            this.broadcastToRoom(retroId, {
              type: 'stage-change',
              stageIndex: data.stageIndex
            }, userId);
          }
          break;

        case 'mark-stage-done':
          // Track user's done status for a stage
          const stageId = data.stageId;
          const isDone = data.isDone;
          
          if (!room.stageDoneStatus[stageId]) {
            room.stageDoneStatus[stageId] = [];
          }
          
          if (isDone && !room.stageDoneStatus[stageId].includes(userId)) {
            room.stageDoneStatus[stageId].push(userId);
          } else if (!isDone) {
            room.stageDoneStatus[stageId] = room.stageDoneStatus[stageId].filter(id => id !== userId);
          }
          
          // Broadcast to all participants (including sender)
          this.broadcastToRoom(retroId, {
            type: 'stage-done-update',
            stageId,
            userId,
            isDone,
            stageDoneStatus: room.stageDoneStatus
          });
          break;

        case 'timer-update':
          // Broadcast timer updates to all participants
          if (room.creatorId === userId) {
            this.broadcastToRoom(retroId, {
              type: 'timer-update',
              ...data
            }, userId);
          }
          break;

        case 'icebreaker-update':
          // Broadcast icebreaker updates to all participants (including sender)
          this.broadcastToRoom(retroId, {
            type: 'icebreaker-update',
            action: data.action,
            participant: data.participant,
            participantId: data.participantId,
            participantName: data.participantName,
            answer: data.answer,
            questionIndex: data.questionIndex,
            newQuestion: data.newQuestion
          });
          break;

        case 'card-create':
          // Store card in room state
          room.cards.push(data.card);
          // Broadcast card creation to all participants
          this.broadcastToRoom(retroId, {
            type: 'card-created',
            card: data.card
          }, userId);
          break;

        case 'card-update':
          // Update card in room state
          const cardIndex = room.cards.findIndex(c => c.id === data.card.id);
          if (cardIndex !== -1) {
            room.cards[cardIndex] = { ...room.cards[cardIndex], ...data.card };
          }
          // Broadcast card update to all participants
          this.broadcastToRoom(retroId, {
            type: 'card-updated',
            card: data.card
          }, userId);
          break;

        case 'card-delete':
          // Remove card from room state
          room.cards = room.cards.filter(c => c.id !== data.cardId);
          // Broadcast card deletion to all participants
          this.broadcastToRoom(retroId, {
            type: 'card-deleted',
            cardId: data.cardId
          }, userId);
          break;

        case 'cards-group':
          // Update groups in room state
          // Remove cards from existing groups
          room.cardGroups = room.cardGroups.map(group => ({
            ...group,
            cardIds: group.cardIds.filter(id => !data.cardIds.includes(id))
          })).filter(group => group.cardIds.length > 0);
          // Add new group
          room.cardGroups.push({
            id: data.groupId,
            cardIds: data.cardIds,
            columnId: data.columnId
          });
          // Broadcast card grouping to all participants
          this.broadcastToRoom(retroId, {
            type: 'cards-grouped',
            groupId: data.groupId,
            cardIds: data.cardIds,
            columnId: data.columnId
          }, userId);
          break;

        case 'card-ungroup':
          // Update groups in room state
          room.cardGroups = room.cardGroups.map(group => ({
            ...group,
            cardIds: group.cardIds.filter(id => id !== data.cardId)
          })).filter(group => group.cardIds.length > 0);
          // Broadcast card ungrouping to all participants
          this.broadcastToRoom(retroId, {
            type: 'card-ungrouped',
            cardId: data.cardId,
            groupId: data.groupId
          }, userId);
          break;

        case 'vote-add':
          // Store vote in room state (allow multiple votes per user on same item)
          if (!room.votes[data.itemId]) {
            room.votes[data.itemId] = [];
          }
          room.votes[data.itemId].push(data.userId);
          // Broadcast vote addition to all participants
          this.broadcastToRoom(retroId, {
            type: 'vote-added',
            itemId: data.itemId,
            columnId: data.columnId,
            voterId: data.userId
          }, userId);
          break;

        case 'vote-remove':
          // Remove one vote from room state (only one instance, not all)
          if (room.votes[data.itemId]) {
            const voteIndex = room.votes[data.itemId].indexOf(data.userId);
            if (voteIndex !== -1) {
              room.votes[data.itemId].splice(voteIndex, 1);
            }
          }
          // Broadcast vote removal to all participants
          this.broadcastToRoom(retroId, {
            type: 'vote-removed',
            itemId: data.itemId,
            voterId: data.userId
          }, userId);
          break;

        case 'discuss-update':
          // Store discussed items in room state
          if (data.action === 'item-marked-discussed' && data.itemId) {
            if (!room.discussedItems.includes(data.itemId)) {
              room.discussedItems.push(data.itemId);
            }
          } else if (data.action === 'item-unmarked-discussed' && data.itemId) {
            room.discussedItems = room.discussedItems.filter(id => id !== data.itemId);
          }
          // Broadcast discuss stage updates to all participants
          this.broadcastToRoom(retroId, {
            type: 'discuss-update',
            action: data.action,
            itemIndex: data.itemIndex,
            itemId: data.itemId,
            duration: data.duration
          }, userId);
          break;

        case 'action-item-update':
          // Store action items in room state
          if (data.action === 'action-added' && data.actionItem) {
            room.actionItems.push(data.actionItem);
          } else if (data.action === 'action-updated' && data.actionItem) {
            const actionIndex = room.actionItems.findIndex(a => a.id === data.actionItem.id);
            if (actionIndex !== -1) {
              room.actionItems[actionIndex] = data.actionItem;
            }
          } else if (data.action === 'action-deleted' && data.actionItemId) {
            room.actionItems = room.actionItems.filter(a => a.id !== data.actionItemId);
          }
          // Broadcast action item updates to all participants
          this.broadcastToRoom(retroId, {
            type: 'action-item-update',
            action: data.action,
            actionItem: data.actionItem,
            actionItemId: data.actionItemId
          }, userId);
          break;

        case 'reaction-toggle':
          // Toggle reaction on a card
          const { cardId, emoji } = data;
          
          if (!room.reactions[cardId]) {
            room.reactions[cardId] = {};
          }
          if (!room.reactions[cardId][emoji]) {
            room.reactions[cardId][emoji] = [];
          }
          
          const emojiReactions = room.reactions[cardId][emoji];
          const userIndex = emojiReactions.indexOf(userId);
          
          if (userIndex === -1) {
            // Add reaction
            emojiReactions.push(userId);
          } else {
            // Remove reaction
            emojiReactions.splice(userIndex, 1);
          }
          
          // Clean up empty arrays
          if (emojiReactions.length === 0) {
            delete room.reactions[cardId][emoji];
          }
          if (Object.keys(room.reactions[cardId]).length === 0) {
            delete room.reactions[cardId];
          }
          
          // Broadcast updated reactions to all participants
          this.broadcastToRoom(retroId, {
            type: 'reaction-update',
            reactions: room.reactions
          });
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  private handleDisconnect(userId: string, retroId: string) {
    const room = this.rooms.get(retroId);
    if (!room) return;

    const participant = room.participants.get(userId);
    if (participant) {
      // Store user info for potential reconnection
      disconnectedUsers.set(userId, {
        retroId: retroId,
        name: participant.name,
        isCreator: participant.isCreator,
        disconnectedAt: new Date()
      });

      // Mark as disconnected but don't remove immediately
      participant.isConnected = false;
      participant.ws = null;

      console.log(`User ${participant.name} (${userId}) disconnected from retro ${retroId}`);

      // Set a timeout to fully remove the participant if they don't reconnect
      setTimeout(() => {
        const currentRoom = this.rooms.get(retroId);
        if (!currentRoom) return;

        const currentParticipant = currentRoom.participants.get(userId);
        if (currentParticipant && !currentParticipant.isConnected) {
          currentRoom.participants.delete(userId);
          console.log(`User ${currentParticipant.name} (${userId}) removed after disconnect timeout`);

          // If room is empty, clean it up
          if (currentRoom.participants.size === 0) {
            clearUsedNames(retroId);
            this.rooms.delete(retroId);
            console.log(`Room ${retroId} cleaned up`);
          } else {
            // Creator remains the same even if they leave - do not reassign
            // Broadcast updated participants list
            this.broadcastParticipants(retroId);
          }
        }
      }, 30000); // Wait 30 seconds before removing
    }
  }

  private broadcastParticipants(retroId: string, newParticipant?: Participant) {
    const room = this.rooms.get(retroId);
    if (!room) return;

    const participantsList = Array.from(room.participants.values())
      .filter(p => p.isConnected)
      .map(p => ({
        id: p.id,
        name: p.name,
        joinedAt: p.joinedAt,
        isCreator: p.id === room.creatorId
      }));

    const message = JSON.stringify({
      type: 'participants-update',
      participants: participantsList,
      newParticipant: newParticipant ? {
        id: newParticipant.id,
        name: newParticipant.name
      } : null
    });

    room.participants.forEach(participant => {
      if (participant.ws && participant.ws.readyState === WebSocket.OPEN) {
        participant.ws.send(message);
      }
    });
  }

  private broadcastToRoom(retroId: string, message: any, excludeUserId?: string) {
    const room = this.rooms.get(retroId);
    if (!room) return;

    const messageStr = JSON.stringify(message);

    room.participants.forEach(participant => {
      if ((excludeUserId === undefined || participant.id !== excludeUserId) && 
          participant.ws && 
          participant.ws.readyState === WebSocket.OPEN) {
        participant.ws.send(messageStr);
      }
    });
  }

  getRoom(retroId: string): RetroRoom | undefined {
    return this.rooms.get(retroId);
  }

  getRoomParticipants(retroId: string) {
    const room = this.rooms.get(retroId);
    if (!room) return [];

    return Array.from(room.participants.values())
      .filter(p => p.isConnected)
      .map(p => ({
        id: p.id,
        name: p.name,
        joinedAt: p.joinedAt,
        isCreator: p.id === room.creatorId
      }));
  }
}

export const wsManager = new WebSocketManager();
