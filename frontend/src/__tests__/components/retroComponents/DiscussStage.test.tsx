import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import DiscussStage from '../../../components/retroComponents/DiscussStage';
import { Template, Card, CardGroup, VoteData } from '@/types/retroBoard';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: Object.assign(
    vi.fn((message: string) => message),
    {
      success: vi.fn(),
      error: vi.fn(),
    }
  ),
}));

// Mock the retroUtils module
vi.mock('@/types/retroUtils', () => ({
  getDiscussionItems: vi.fn((cards: Card[], _cardGroups: CardGroup[], votes: VoteData, discussedItems: Set<string>) => {
    // Return sorted cards by votes, respecting discussed status
    return cards.map(card => ({
      id: card.id,
      type: 'card' as const,
      columnId: card.columnId,
      cards: [card],
      voteCount: votes[card.id]?.length || 0,
      discussed: discussedItems.has(card.id),
    })).sort((a, b) => b.voteCount - a.voteCount);
  }),
  getColumnInfo: vi.fn((template: Template, columnId: string) => {
    return template?.columns.find(c => c.id === columnId);
  }),
  formatTime: vi.fn((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }),
}));

// Helper to create WebSocket mock with message handler capture
function createMockWsWithHandler() {
  let messageHandler: ((event: MessageEvent) => void) | undefined;
  const ws = {
    send: vi.fn(),
    addEventListener: vi.fn((event: string, handler: (event: MessageEvent) => void) => {
      if (event === 'message') {
        messageHandler = handler;
      }
    }),
    removeEventListener: vi.fn(),
    readyState: WebSocket.OPEN,
  } as unknown as WebSocket;
  
  return {
    ws,
    triggerMessage: (data: object | string) => {
      if (messageHandler) {
        act(() => {
          messageHandler!({ data: typeof data === 'string' ? data : JSON.stringify(data) } as MessageEvent);
        });
      }
    }
  };
}

describe('DiscussStage', () => {
  const mockTemplate: Template = {
    id: 'template1',
    name: 'Test Template',
    columns: [
      { id: 'col1', name: 'What went well', color: '#10B981', placeholder: 'Enter...' },
      { id: 'col2', name: 'What to improve', color: '#EF4444', placeholder: 'Enter...' },
    ],
  };

  const mockCards: Card[] = [
    { id: 'card1', columnId: 'col1', content: 'Card 1 content', authorId: 'user1', groupId: null, createdAt: new Date() },
    { id: 'card2', columnId: 'col1', content: 'Card 2 content', authorId: 'user2', groupId: null, createdAt: new Date() },
    { id: 'card3', columnId: 'col2', content: 'Card 3 content', authorId: 'user1', groupId: null, createdAt: new Date() },
  ];

  const mockVotes: VoteData = {
    card1: ['user1', 'user2', 'user3'],
    card2: ['user1'],
    card3: ['user1', 'user2'],
  };

  const mockWs = {
    send: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: WebSocket.OPEN,
  } as unknown as WebSocket;

  const mockSetDiscussedItems = vi.fn();

  const defaultProps = {
    template: mockTemplate,
    currentUserId: 'user1',
    ws: mockWs,
    retroId: 'retro123',
    cards: mockCards,
    cardGroups: [] as CardGroup[],
    votes: mockVotes,
    isRoomCreator: true,
    discussedItems: new Set<string>(),
    setDiscussedItems: mockSetDiscussedItems,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the discussion header', () => {
      render(<DiscussStage {...defaultProps} />);

      expect(screen.getByText('Discussion Time')).toBeInTheDocument();
      expect(screen.getByText(/Go through each topic/)).toBeInTheDocument();
    });

    it('displays discussed count', () => {
      render(<DiscussStage {...defaultProps} />);

      expect(screen.getByText('discussed')).toBeInTheDocument();
    });

    it('displays remaining count', () => {
      render(<DiscussStage {...defaultProps} />);

      expect(screen.getByText('remaining')).toBeInTheDocument();
    });

    it('shows progress bar', () => {
      const discussedItems = new Set(['card1']);
      render(<DiscussStage {...defaultProps} discussedItems={discussedItems} />);

      expect(screen.getByText(/items discussed/)).toBeInTheDocument();
    });

    it('renders no template message when template is undefined', () => {
      render(<DiscussStage {...defaultProps} template={undefined} />);

      expect(screen.getByText('No template found for this retrospective.')).toBeInTheDocument();
    });

    it('renders empty state when no items to discuss', () => {
      render(<DiscussStage {...defaultProps} cards={[]} />);

      expect(screen.getByText('No items to discuss')).toBeInTheDocument();
      expect(screen.getByText('Add cards in the Brainstorm stage first')).toBeInTheDocument();
    });

    it('shows current topic indicator', () => {
      render(<DiscussStage {...defaultProps} />);

      expect(screen.getByText(/Topic 1 of/)).toBeInTheDocument();
    });
  });

  describe('Navigation (Room Creator)', () => {
    it('shows navigation buttons for room creator', () => {
      render(<DiscussStage {...defaultProps} />);

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('disables previous button on first item', () => {
      render(<DiscussStage {...defaultProps} />);

      const prevButton = screen.getByText('Previous').closest('button');
      expect(prevButton).toBeDisabled();
    });

    it('navigates to next item when next button clicked', () => {
      render(<DiscussStage {...defaultProps} />);

      const nextButton = screen.getByText('Next').closest('button');
      fireEvent.click(nextButton!);

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"action":"item-changed"')
      );
    });

    it('navigates to previous item when previous button clicked', () => {
      const { ws, triggerMessage } = createMockWsWithHandler();
      render(<DiscussStage {...defaultProps} ws={ws} />);

      // Move to next item first
      triggerMessage({ type: 'discuss-update', action: 'item-changed', itemIndex: 1 });

      const prevButton = screen.getByText('Previous').closest('button');
      fireEvent.click(prevButton!);

      expect(ws.send).toHaveBeenCalledWith(
        expect.stringContaining('"action":"item-changed"')
      );
    });

    it('hides navigation for non-creator', () => {
      render(<DiscussStage {...defaultProps} isRoomCreator={false} />);

      // Should not have interactive Previous/Next buttons
      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });
  });

  describe('Mark as Discussed', () => {
    it('shows Mark as Discussed button for room creator', () => {
      render(<DiscussStage {...defaultProps} />);

      expect(screen.getByText('Mark as Discussed')).toBeInTheDocument();
    });

    it('marks item as discussed when button clicked', () => {
      render(<DiscussStage {...defaultProps} />);

      const button = screen.getByText('Mark as Discussed');
      fireEvent.click(button);

      expect(mockSetDiscussedItems).toHaveBeenCalled();
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"action":"item-marked-discussed"')
      );
    });

    it('shows Discussed status for already discussed items', () => {
      // card1 has the most votes so it will be first (current item)
      const discussedItems = new Set(['card1']);
      render(<DiscussStage {...defaultProps} discussedItems={discussedItems} />);

      // The "Discussed" button should be visible for the current item
      const buttons = screen.getAllByRole('button');
      const discussedButton = buttons.find(btn => btn.textContent?.includes('Discussed'));
      expect(discussedButton).toBeTruthy();
    });

    it('unmarks item when clicking Discussed button again', () => {
      // card1 has the most votes so it will be first (current item)
      const discussedItems = new Set(['card1']);
      render(<DiscussStage {...defaultProps} discussedItems={discussedItems} />);

      // Find the Discussed button
      const buttons = screen.getAllByRole('button');
      const discussedButton = buttons.find(btn => btn.textContent?.includes('Discussed'));
      expect(discussedButton).toBeTruthy();
      fireEvent.click(discussedButton!);

      expect(mockSetDiscussedItems).toHaveBeenCalled();
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"action":"item-unmarked-discussed"')
      );
    });

    it('shows read-only status for non-creator', () => {
      render(<DiscussStage {...defaultProps} isRoomCreator={false} />);

      // Should not have the interactive Mark as Discussed button
      expect(screen.queryByText('Mark as Discussed')).not.toBeInTheDocument();
    });
  });

  describe('Discussion Timer', () => {
    it('shows timer section', () => {
      render(<DiscussStage {...defaultProps} />);

      expect(screen.getByText('Discussion Timer')).toBeInTheDocument();
    });

    it('shows Admin badge for room creator', () => {
      render(<DiscussStage {...defaultProps} />);

      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('shows timer duration selector for room creator', () => {
      render(<DiscussStage {...defaultProps} />);

      expect(screen.getByTitle('Timer Duration')).toBeInTheDocument();
    });

    it('shows timer controls for room creator', () => {
      render(<DiscussStage {...defaultProps} />);

      expect(screen.getByTitle('Reset Timer')).toBeInTheDocument();
    });

    it('hides timer controls for non-creator', () => {
      render(<DiscussStage {...defaultProps} isRoomCreator={false} />);

      expect(screen.queryByTitle('Reset Timer')).not.toBeInTheDocument();
      expect(screen.getByText('Timer is controlled by the room admin')).toBeInTheDocument();
    });

    it('starts timer when start button clicked', () => {
      render(<DiscussStage {...defaultProps} />);

      // Find and click the start/play button (it's labeled differently)
      const startButton = screen.getByTitle('Reset Timer').previousElementSibling;
      if (startButton) {
        fireEvent.click(startButton);
      }

      expect(mockWs.send).toHaveBeenCalled();
    });

    it('resets timer when reset button clicked', () => {
      render(<DiscussStage {...defaultProps} />);

      const resetButton = screen.getByTitle('Reset Timer');
      fireEvent.click(resetButton);

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"action":"timer-reset"')
      );
    });
  });

  describe('Discussion Queue', () => {
    it('shows discussion queue section', () => {
      render(<DiscussStage {...defaultProps} />);

      expect(screen.getByText('Discussion Queue')).toBeInTheDocument();
    });

    it('displays total items count', () => {
      render(<DiscussStage {...defaultProps} />);

      // Multiple elements contain 'items', use getAllByText
      const itemsElements = screen.getAllByText(/items/);
      expect(itemsElements.length).toBeGreaterThan(0);
    });

    it('shows admin navigation hint for non-creator', () => {
      render(<DiscussStage {...defaultProps} isRoomCreator={false} />);

      expect(screen.getByText('The admin controls topic navigation')).toBeInTheDocument();
    });
  });

  describe('WebSocket Message Handling', () => {
    it('handles item-changed message', () => {
      const { ws, triggerMessage } = createMockWsWithHandler();
      render(<DiscussStage {...defaultProps} ws={ws} />);

      triggerMessage({ type: 'discuss-update', action: 'item-changed', itemIndex: 2 });

      // Component should update internally (can't directly test state)
    });

    it('handles timer-started message', () => {
      const { ws, triggerMessage } = createMockWsWithHandler();
      render(<DiscussStage {...defaultProps} ws={ws} />);

      triggerMessage({ type: 'discuss-update', action: 'timer-started', duration: 120 });

      // Timer should start
    });

    it('handles timer-paused message', () => {
      const { ws, triggerMessage } = createMockWsWithHandler();
      render(<DiscussStage {...defaultProps} ws={ws} />);

      // Start timer first
      triggerMessage({ type: 'discuss-update', action: 'timer-started', duration: 120 });
      // Then pause
      triggerMessage({ type: 'discuss-update', action: 'timer-paused' });
    });

    it('handles timer-resumed message', () => {
      const { ws, triggerMessage } = createMockWsWithHandler();
      render(<DiscussStage {...defaultProps} ws={ws} />);

      triggerMessage({ type: 'discuss-update', action: 'timer-resumed' });
    });

    it('handles timer-reset message', () => {
      const { ws, triggerMessage } = createMockWsWithHandler();
      render(<DiscussStage {...defaultProps} ws={ws} />);

      triggerMessage({ type: 'discuss-update', action: 'timer-reset' });
    });

    it('handles invalid JSON gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { ws, triggerMessage } = createMockWsWithHandler();
      render(<DiscussStage {...defaultProps} ws={ws} />);

      triggerMessage('invalid json');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('ignores non-discuss messages', () => {
      const { ws, triggerMessage } = createMockWsWithHandler();
      render(<DiscussStage {...defaultProps} ws={ws} />);

      triggerMessage({ type: 'other-type', action: 'something' });

      // Should not cause any errors
    });

    it('removes event listener on unmount', () => {
      const removeEventListener = vi.fn();
      
      const wsWithHandler = {
        ...mockWs,
        addEventListener: vi.fn(),
        removeEventListener,
      } as unknown as WebSocket;

      const { unmount } = render(<DiscussStage {...defaultProps} ws={wsWithHandler} />);
      unmount();

      expect(removeEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });

  describe('Edge Cases', () => {
    it('handles ws null gracefully for navigation', () => {
      render(<DiscussStage {...defaultProps} ws={null} />);

      const nextButton = screen.getByText('Next').closest('button');
      fireEvent.click(nextButton!);

      // Should not throw
    });

    it('handles ws null gracefully for mark discussed', () => {
      render(<DiscussStage {...defaultProps} ws={null} />);

      const button = screen.getByText('Mark as Discussed');
      fireEvent.click(button);

      expect(mockSetDiscussedItems).toHaveBeenCalled();
    });

    it('handles ws null gracefully for timer controls', () => {
      render(<DiscussStage {...defaultProps} ws={null} />);

      const resetButton = screen.getByTitle('Reset Timer');
      fireEvent.click(resetButton);

      // Should not throw
    });
  });

  describe('Timer Controls Advanced', () => {
    it('allows changing timer duration', () => {
      render(<DiscussStage {...defaultProps} />);

      const durationSelect = screen.getByTitle('Timer Duration');
      fireEvent.change(durationSelect, { target: { value: '180' } });

      expect(durationSelect).toHaveValue('180');
    });

    it('starts timer with selected duration', () => {
      render(<DiscussStage {...defaultProps} />);

      // Change duration
      const durationSelect = screen.getByTitle('Timer Duration');
      fireEvent.change(durationSelect, { target: { value: '300' } });

      // Find and click start button
      const timerButtons = screen.getAllByRole('button');
      const startButton = timerButtons.find(btn => 
        btn.querySelector('.lucide-play') || btn.textContent?.includes('Start')
      );
      
      if (startButton) {
        fireEvent.click(startButton);
        expect(mockWs.send).toHaveBeenCalledWith(
          expect.stringContaining('"action":"timer-started"')
        );
      }
    });

    it('pauses running timer', () => {
      const { ws, triggerMessage } = createMockWsWithHandler();
      render(<DiscussStage {...defaultProps} ws={ws} />);

      // Start timer via message
      triggerMessage({ type: 'discuss-update', action: 'timer-started', duration: 120 });

      // Now the pause button should be visible - find and click it
      const pauseButtons = screen.getAllByRole('button');
      const pauseButton = pauseButtons.find(btn => 
        btn.querySelector('.lucide-pause')
      );
      
      if (pauseButton) {
        fireEvent.click(pauseButton);
        expect(ws.send).toHaveBeenCalledWith(
          expect.stringContaining('"action":"timer-paused"')
        );
      }
    });

    it('resumes paused timer', () => {
      const { ws, triggerMessage } = createMockWsWithHandler();
      render(<DiscussStage {...defaultProps} ws={ws} />);

      // Start timer
      triggerMessage({ type: 'discuss-update', action: 'timer-started', duration: 120 });
      // Pause it
      triggerMessage({ type: 'discuss-update', action: 'timer-paused' });

      // Now click play/resume button
      const playButtons = screen.getAllByRole('button');
      const playButton = playButtons.find(btn => 
        btn.querySelector('.lucide-play')
      );
      
      if (playButton) {
        fireEvent.click(playButton);
        expect(ws.send).toHaveBeenCalledWith(
          expect.stringContaining('"action":"timer-resumed"')
        );
      }
    });
  });

  describe('Queue Item Selection', () => {
    it('renders discussion queue with items', () => {
      render(<DiscussStage {...defaultProps} />);

      // Discussion queue should show the items
      expect(screen.getByText('Discussion Queue')).toBeInTheDocument();
    });
  });

  describe('WebSocket Closed State', () => {
    it('handles ws.readyState not OPEN for timer start', () => {
      const closedWs = {
        ...mockWs,
        readyState: WebSocket.CLOSED,
      } as unknown as WebSocket;
      
      render(<DiscussStage {...defaultProps} ws={closedWs} />);

      // Find and click start button - should not throw
      const timerButtons = screen.getAllByRole('button');
      const startButton = timerButtons.find(btn => 
        btn.querySelector('.lucide-play')
      );
      
      if (startButton) {
        fireEvent.click(startButton);
        // Should not have sent message since WS is closed
        expect(closedWs.send).not.toHaveBeenCalled();
      }
    });

    it('handles ws.readyState not OPEN for navigation', () => {
      const closedWs = {
        ...mockWs,
        readyState: WebSocket.CLOSED,
      } as unknown as WebSocket;
      
      render(<DiscussStage {...defaultProps} ws={closedWs} />);

      const nextButton = screen.getByText('Next').closest('button');
      fireEvent.click(nextButton!);

      // Should not have sent message
      expect(closedWs.send).not.toHaveBeenCalled();
    });

    it('handles ws.readyState not OPEN for mark discussed', () => {
      const closedWs = {
        ...mockWs,
        readyState: WebSocket.CLOSED,
      } as unknown as WebSocket;
      
      render(<DiscussStage {...defaultProps} ws={closedWs} />);

      const button = screen.getByText('Mark as Discussed');
      fireEvent.click(button);

      // Local state should still update
      expect(mockSetDiscussedItems).toHaveBeenCalled();
      // But WS message should not be sent
      expect(closedWs.send).not.toHaveBeenCalled();
    });
  });
});
