import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { generateRandomName, clearUsedNames, setNameDeck } from '../data/names';
import { getRetroById } from '../data/retros';

interface Participant {
  id: string;
  name: string;
  ws: WebSocket;
  retroId: string;
  joinedAt: Date;
  isCreator: boolean;
}

interface RetroRoom {
  id: string;
  participants: Map<string, Participant>;
  creatorId: string;
  currentStage: number;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private rooms: Map<string, RetroRoom> = new Map();

  initialize(server: any) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket, req) => {
      // Extract retroId from URL: /ws/retro/{retroId}
      const urlMatch = req.url?.match(/\/ws\/retro\/([^\/\?]+)/);
      const retroId = urlMatch?.[1];

      if (!retroId) {
        console.log('WebSocket connection rejected: no retroId');
        ws.close();
        return;
      }

      this.handleConnection(ws, retroId);
    });
  }

  private handleConnection(ws: WebSocket, retroId: string) {
    const userId = uuidv4();
    
    // Get or create room
    if (!this.rooms.has(retroId)) {
      // Set the name deck for this retro session
      const retro = getRetroById(retroId);
      if (retro && retro.nameDeck) {
        setNameDeck(retroId, retro.nameDeck);
      }
      
      this.rooms.set(retroId, {
        id: retroId,
        participants: new Map(),
        creatorId: userId, // First person to join becomes creator
        currentStage: 0
      });
    }
    
    const userName = generateRandomName(retroId);

    const room = this.rooms.get(retroId)!;
    const isCreator = room.participants.size === 0;

    const participant: Participant = {
      id: userId,
      name: userName,
      ws,
      retroId,
      joinedAt: new Date(),
      isCreator
    };

    if (isCreator) {
      room.creatorId = userId;
    }

    room.participants.set(userId, participant);

    // Send user their ID and name
    ws.send(JSON.stringify({
      type: 'user-joined',
      userId,
      userName,
      isCreator
    }));

    // Broadcast updated participants list to all
    this.broadcastParticipants(retroId, participant);

    // Handle messages
    ws.on('message', (message: string) => {
      this.handleMessage(userId, retroId, message);
    });

    // Handle disconnect
    ws.on('close', () => {
      this.handleDisconnect(userId, retroId);
    });

    console.log(`User ${userName} (${userId}) joined retro ${retroId}`);
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
            this.broadcastToRoom(retroId, {
              type: 'stage-change',
              stageIndex: data.stageIndex
            }, userId);
          }
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
          // Don't exclude anyone by not passing excludeUserId
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
      room.participants.delete(userId);

      console.log(`User ${participant.name} (${userId}) left retro ${retroId}`);

      // If room is empty, clean it up
      if (room.participants.size === 0) {
        // Clear used names for this retro session
        clearUsedNames(retroId);
        this.rooms.delete(retroId);
        console.log(`Room ${retroId} cleaned up`);
      } else {
        // If creator left, assign new creator
        if (room.creatorId === userId) {
          const newCreator = Array.from(room.participants.values())[0];
          room.creatorId = newCreator.id;
          newCreator.isCreator = true;

          // Notify new creator
          newCreator.ws.send(JSON.stringify({
            type: 'creator-assigned',
            isCreator: true
          }));
        }

        // Broadcast updated participants list
        this.broadcastParticipants(retroId);
      }
    }
  }

  private broadcastParticipants(retroId: string, newParticipant?: Participant) {
    const room = this.rooms.get(retroId);
    if (!room) return;

    const participantsList = Array.from(room.participants.values()).map(p => ({
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
      if (participant.ws.readyState === WebSocket.OPEN) {
        participant.ws.send(message);
      }
    });
  }

  private broadcastToRoom(retroId: string, message: any, excludeUserId?: string) {
    const room = this.rooms.get(retroId);
    if (!room) return;

    const messageStr = JSON.stringify(message);

    room.participants.forEach(participant => {
      // If excludeUserId is undefined, send to all; otherwise skip the excluded user
      if ((excludeUserId === undefined || participant.id !== excludeUserId) && participant.ws.readyState === WebSocket.OPEN) {
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

    return Array.from(room.participants.values()).map(p => ({
      id: p.id,
      name: p.name,
      joinedAt: p.joinedAt,
      isCreator: p.id === room.creatorId
    }));
  }
}

export const wsManager = new WebSocketManager();
