import { useEffect, useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Card,
  CardGroup,
  VoteData,
  ActionItem,
  StageDoneStatus,
  Reactions,
  IcebreakerState,
  Participant,
} from '@/types/retroBoard';

interface WebSocketState {
  ws: WebSocket | null;
  currentUserId: string;
  participants: Participant[];
  cards: Card[];
  cardGroups: CardGroup[];
  votes: VoteData;
  actionItems: ActionItem[];
  discussedItems: Set<string>;
  stageDoneStatus: StageDoneStatus;
  reactions: Reactions;
  icebreakerState: IcebreakerState | null;
  currentStageIndex: number;
}

interface UseRetroWebSocketOptions {
  retroId: string | undefined;
  enabledStages: { id: string; name: string }[];
}

// Message handlers - each handler processes a specific message type
type MessageHandler = (
  data: any,
  state: WebSocketState,
  setters: ReturnType<typeof useRetroWebSocket>['setters']
) => void;

const messageHandlers: Record<string, MessageHandler> = {
  'user-joined': (data, _state, setters) => {
    if (data.retroId) {
      sessionStorage.setItem(`retro_userId_${data.retroId}`, data.userId);
    }
    setters.setCurrentUserId(data.userId);

    // Restore state from server
    if (data.currentState) {
      const cs = data.currentState;
      if (cs.currentStage !== undefined) setters.setCurrentStageIndex(cs.currentStage);
      if (cs.cards) setters.setCards(cs.cards);
      if (cs.cardGroups) setters.setCardGroups(cs.cardGroups);
      if (cs.votes) setters.setVotes(cs.votes);
      if (cs.actionItems) setters.setActionItems(cs.actionItems);
      if (cs.discussedItems) setters.setDiscussedItems(new Set(cs.discussedItems));
      if (cs.stageDoneStatus) setters.setStageDoneStatus(cs.stageDoneStatus);
      if (cs.reactions) setters.setReactions(cs.reactions);
      if (cs.icebreakerState) setters.setIcebreakerState(cs.icebreakerState);
    }

    if (data.isReconnection) {
      toast.success(`Reconnected as ${data.userName}`);
    } else if (data.userName) {
      toast.success(`Joined as ${data.userName}`);
    }
  },

  'participants-update': (data, _state, setters) => {
    setters.setParticipants(data.participants);
    if (data.newParticipant?.name) {
      const isCurrentUser = data.participants.some(
        (p: Participant) => p.id === data.newParticipant.id && p.name === data.newParticipant.name
      );
      if (!isCurrentUser) {
        toast.success(`${data.newParticipant.name} joined`);
      }
    }
  },

  'stage-change': (data, _state, setters) => {
    setters.setCurrentStageIndex(data.stageIndex);
    setters.setStageDoneStatus({});
  },

  'stage-done-update': (data, _state, setters) => {
    setters.setStageDoneStatus(data.stageDoneStatus);
  },

  'reaction-update': (data, _state, setters) => {
    setters.setReactions(data.reactions);
  },

  'creator-assigned': (data) => {
    if (data.isCreator) {
      toast.success('You are now the room admin!');
    }
  },

  'card-created': (data, _state, setters) => {
    setters.setCards((prev) => [
      ...prev,
      {
        id: data.card.id,
        columnId: data.card.columnId,
        content: data.card.content,
        authorId: data.card.authorId,
        groupId: data.card.groupId || null,
        createdAt: new Date(data.card.createdAt),
      },
    ]);
  },

  'card-updated': (data, _state, setters) => {
    setters.setCards((prev) =>
      prev.map((card) => (card.id === data.card.id ? { ...card, content: data.card.content } : card))
    );
  },

  'card-deleted': (data, _state, setters) => {
    setters.setCards((prev) => prev.filter((card) => card.id !== data.cardId));
  },

  'cards-grouped': (data, _state, setters) => {
    setters.setCardGroups((prev) => {
      const updatedGroups = prev
        .map((group) => ({
          ...group,
          cardIds: group.cardIds.filter((id) => !data.cardIds.includes(id)),
        }))
        .filter((group) => group.cardIds.length > 0);

      return [...updatedGroups, { id: data.groupId, cardIds: data.cardIds, columnId: data.columnId }];
    });

    setters.setCards((prev) =>
      prev.map((card) => (data.cardIds.includes(card.id) ? { ...card, groupId: data.groupId } : card))
    );
  },

  'card-ungrouped': (data, _state, setters) => {
    setters.setCardGroups((prev) =>
      prev
        .map((group) => ({
          ...group,
          cardIds: group.cardIds.filter((id) => id !== data.cardId),
        }))
        .filter((group) => group.cardIds.length > 1)
    );

    setters.setCards((prev) =>
      prev.map((card) => (card.id === data.cardId ? { ...card, groupId: null } : card))
    );
  },

  'vote-added': (data, _state, setters) => {
    setters.setVotes((prev) => ({
      ...prev,
      [data.itemId]: [...(prev[data.itemId] || []), data.voterId],
    }));
  },

  'vote-removed': (data, _state, setters) => {
    setters.setVotes((prev) => {
      const currentVotes = prev[data.itemId] || [];
      const voterIndex = currentVotes.findIndex((id) => id === data.voterId);
      if (voterIndex === -1) return prev;

      const newVotes = [...currentVotes];
      newVotes.splice(voterIndex, 1);
      return { ...prev, [data.itemId]: newVotes };
    });
  },

  'action-item-update': (data, _state, setters) => {
    if (data.action === 'action-added') {
      setters.setActionItems((prev) => [...prev, data.actionItem]);
    } else if (data.action === 'action-updated') {
      setters.setActionItems((prev) =>
        prev.map((item) => (item.id === data.actionItem.id ? data.actionItem : item))
      );
    } else if (data.action === 'action-deleted') {
      setters.setActionItems((prev) => prev.filter((item) => item.id !== data.actionItemId));
    }
  },

  'discuss-update': (data, _state, setters) => {
    if (data.action === 'item-marked-discussed' && data.itemId) {
      setters.setDiscussedItems((prev) => new Set([...prev, data.itemId]));
    } else if (data.action === 'item-unmarked-discussed' && data.itemId) {
      setters.setDiscussedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.itemId);
        return newSet;
      });
    }
  },
};

export function useRetroWebSocket({ retroId, enabledStages }: UseRetroWebSocketOptions) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [cardGroups, setCardGroups] = useState<CardGroup[]>([]);
  const [votes, setVotes] = useState<VoteData>({});
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [discussedItems, setDiscussedItems] = useState<Set<string>>(new Set());
  const [stageDoneStatus, setStageDoneStatus] = useState<StageDoneStatus>({});
  const [reactions, setReactions] = useState<Reactions>({});
  const [icebreakerState, setIcebreakerState] = useState<IcebreakerState | null>(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  // Use ref for enabledStages to avoid stale closure in toast
  const enabledStagesRef = useRef(enabledStages);
  enabledStagesRef.current = enabledStages;

  const setters = {
    setCurrentUserId,
    setParticipants,
    setCards,
    setCardGroups,
    setVotes,
    setActionItems,
    setDiscussedItems,
    setStageDoneStatus,
    setReactions,
    setIcebreakerState,
    setCurrentStageIndex,
  };

  useEffect(() => {
    let socket: WebSocket | null = null;
    let isCleaning = false;
    let connectionTimeout: ReturnType<typeof setTimeout> | null = null;

    if (retroId) {
      // Delay to avoid React StrictMode double-mount creating ghost users
      connectionTimeout = setTimeout(() => {
        if (isCleaning) return;

        const storedUserId = sessionStorage.getItem(`retro_userId_${retroId}`);
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = import.meta.env.VITE_WS_URL || `${wsProtocol}//${window.location.host}`;
        let wsUrl = `${wsHost}/ws/retro/${retroId}`;

        if (storedUserId) {
          wsUrl += `?userId=${storedUserId}`;
          console.log('Attempting to reconnect with stored userId:', storedUserId);
        }

        console.log('Initializing WebSocket connection:', wsUrl);
        socket = new WebSocket(wsUrl);

        socket.onopen = () => console.log('WebSocket connected successfully');

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            // Add retroId to data for sessionStorage
            data.retroId = retroId;
            console.log('WebSocket message received:', data);

            const handler = messageHandlers[data.type];
            if (handler) {
              const state: WebSocketState = {
                ws: socket,
                currentUserId,
                participants,
                cards,
                cardGroups,
                votes,
                actionItems,
                discussedItems,
                stageDoneStatus,
                reactions,
                icebreakerState,
                currentStageIndex,
              };
              handler(data, state, setters);

              // Special handling for stage-change toast
              if (data.type === 'stage-change') {
                toast(`Stage changed to ${enabledStagesRef.current[data.stageIndex]?.name || 'next stage'}`);
              }
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (!isCleaning) {
            toast.error('Connection error. Please refresh the page.');
          }
        };

        socket.onclose = (event) => {
          console.log('WebSocket closed. Code:', event.code, 'Reason:', event.reason);
          if (!isCleaning && event.code !== 1000 && event.code !== 1001) {
            toast.error('Connection lost. Please refresh the page.');
          }
        };

        setWs(socket);
      }, 100);
    }

    return () => {
      isCleaning = true;
      if (connectionTimeout) clearTimeout(connectionTimeout);
      if (socket && socket.readyState !== WebSocket.CLOSED) {
        console.log('Cleaning up WebSocket connection');
        socket.close(1000, 'Component unmounting');
      }
    };
  }, [retroId]);

  // Send message helper
  const sendMessage = useCallback(
    (message: object) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    },
    [ws]
  );

  return {
    ws,
    currentUserId,
    participants,
    cards,
    cardGroups,
    votes,
    actionItems,
    discussedItems,
    stageDoneStatus,
    reactions,
    icebreakerState,
    currentStageIndex,
    setCards,
    setCardGroups,
    setVotes,
    setActionItems,
    setDiscussedItems,
    setCurrentStageIndex,
    sendMessage,
    setters,
  };
}
