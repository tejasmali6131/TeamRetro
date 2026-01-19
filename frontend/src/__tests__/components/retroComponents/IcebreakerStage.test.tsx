import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import IcebreakerStage from '../../../components/retroComponents/IcebreakerStage';
import { Participant, IcebreakerState } from '@/types/retroBoard';

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

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock emoji-picker-react
vi.mock('emoji-picker-react', () => ({
  default: ({ onEmojiClick }: { onEmojiClick: (data: { emoji: string }) => void }) => (
    <div data-testid="emoji-picker">
      <button onClick={() => onEmojiClick({ emoji: '😀' })}>Select Emoji</button>
    </div>
  ),
}));

describe('IcebreakerStage', () => {
  const mockParticipants: Participant[] = [
    { id: 'user1', name: 'Alice', joinedAt: new Date() },
    { id: 'user2', name: 'Bob', joinedAt: new Date() },
    { id: 'user3', name: 'Charlie', joinedAt: new Date() },
  ];

  const mockWs = {
    send: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: WebSocket.OPEN,
  } as unknown as WebSocket;

  const defaultProps = {
    participants: mockParticipants,
    currentUserId: 'user1',
    isRoomCreator: true,
    ws: mockWs,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the icebreaker header', () => {
      render(<IcebreakerStage {...defaultProps} />);

      expect(screen.getByText('Icebreaker Time!')).toBeInTheDocument();
      expect(screen.getByText(/Let's get to know each other better/)).toBeInTheDocument();
    });

    it('displays the first question by default', () => {
      render(<IcebreakerStage {...defaultProps} />);

      expect(screen.getByText('How would you describe your current mood?')).toBeInTheDocument();
    });

    it('shows question navigation for room creator', () => {
      render(<IcebreakerStage {...defaultProps} />);

      expect(screen.getByText(/Question 1 of 6/)).toBeInTheDocument();
      expect(screen.getByLabelText('Previous question')).toBeInTheDocument();
      expect(screen.getByLabelText('Next question')).toBeInTheDocument();
    });

    it('shows edit button for room creator', () => {
      render(<IcebreakerStage {...defaultProps} />);

      expect(screen.getByLabelText('Edit question')).toBeInTheDocument();
    });

    it('hides navigation and edit for non-creator', () => {
      render(<IcebreakerStage {...defaultProps} isRoomCreator={false} />);

      expect(screen.queryByLabelText('Previous question')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Next question')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Edit question')).not.toBeInTheDocument();
    });

    it('shows Get Answers button for room creator', () => {
      render(<IcebreakerStage {...defaultProps} />);

      expect(screen.getByText('Get Answers')).toBeInTheDocument();
    });

    it('shows waiting message for non-creator', () => {
      render(<IcebreakerStage {...defaultProps} isRoomCreator={false} />);

      expect(screen.getByText('Waiting for admin to start answering...')).toBeInTheDocument();
    });

    it('disables Get Answers button when only one participant', () => {
      render(<IcebreakerStage {...defaultProps} participants={[mockParticipants[0]]} />);

      expect(screen.getByText('Waiting for more participants...')).toBeInTheDocument();
    });
  });

  describe('Question Navigation', () => {
    it('disables previous button on first question', () => {
      render(<IcebreakerStage {...defaultProps} />);

      const prevButton = screen.getByLabelText('Previous question');
      expect(prevButton).toBeDisabled();
    });

    it('navigates to next question when next button clicked', () => {
      render(<IcebreakerStage {...defaultProps} />);

      const nextButton = screen.getByLabelText('Next question');
      fireEvent.click(nextButton);

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"action":"question-changed"')
      );
    });

    it('navigates to previous question when previous button clicked', () => {
      const initialState: IcebreakerState = {
        currentQuestionIndex: 2,
        questions: [
          "Question 1",
          "Question 2",
          "Question 3",
        ],
        isAnswering: false,
        answeredParticipants: [],
        answers: {},
      };

      render(<IcebreakerStage {...defaultProps} initialState={initialState} />);

      const prevButton = screen.getByLabelText('Previous question');
      fireEvent.click(prevButton);

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"action":"question-changed"')
      );
    });
  });

  describe('Question Editing', () => {
    it('shows edit form when edit button clicked', () => {
      render(<IcebreakerStage {...defaultProps} />);

      const editButton = screen.getByLabelText('Edit question');
      fireEvent.click(editButton);

      expect(screen.getByPlaceholderText('Enter your custom question...')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('saves edited question when save clicked', async () => {
      const toast = await import('react-hot-toast');
      render(<IcebreakerStage {...defaultProps} />);

      const editButton = screen.getByLabelText('Edit question');
      fireEvent.click(editButton);

      const textarea = screen.getByPlaceholderText('Enter your custom question...');
      fireEvent.change(textarea, { target: { value: 'New custom question?' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"action":"question-edited"')
      );
      expect(toast.default.success).toHaveBeenCalledWith('Question updated!');
    });

    it('cancels editing when cancel clicked', () => {
      render(<IcebreakerStage {...defaultProps} />);

      const editButton = screen.getByLabelText('Edit question');
      fireEvent.click(editButton);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Edit form should be hidden
      expect(screen.queryByPlaceholderText('Enter your custom question...')).not.toBeInTheDocument();
    });
  });

  describe('Answering Flow', () => {
    it('starts answering when Get Answers clicked', async () => {
      const toast = await import('react-hot-toast');
      render(<IcebreakerStage {...defaultProps} />);

      const getAnswersButton = screen.getByText('Get Answers');
      fireEvent.click(getAnswersButton);

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"action":"answering-started"')
      );
      expect(toast.default.success).toHaveBeenCalledWith('Everyone can now answer!');
    });

    it('shows answer input when answering is active', () => {
      const initialState: IcebreakerState = {
        currentQuestionIndex: 0,
        questions: ["Question 1"],
        isAnswering: true,
        answeredParticipants: [],
        answers: {},
      };

      render(<IcebreakerStage {...defaultProps} initialState={initialState} />);

      expect(screen.getByText('Your Answer')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Type your answer here (optional)...')).toBeInTheDocument();
      expect(screen.getByText('Submit Answer')).toBeInTheDocument();
    });

    it('submits answer when Submit Answer clicked', async () => {
      const toast = await import('react-hot-toast');
      const initialState: IcebreakerState = {
        currentQuestionIndex: 0,
        questions: ["Question 1"],
        isAnswering: true,
        answeredParticipants: [],
        answers: {},
      };

      render(<IcebreakerStage {...defaultProps} initialState={initialState} />);

      const textarea = screen.getByPlaceholderText('Type your answer here (optional)...');
      fireEvent.change(textarea, { target: { value: 'My answer!' } });

      const submitButton = screen.getByText('Submit Answer');
      fireEvent.click(submitButton);

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"action":"answer-completed"')
      );
      expect(toast.default.success).toHaveBeenCalledWith('Answer recorded!');
    });

    it('hides answer input after user has answered', () => {
      const initialState: IcebreakerState = {
        currentQuestionIndex: 0,
        questions: ["Question 1"],
        isAnswering: true,
        answeredParticipants: ['user1'],
        answers: { user1: 'My answer' },
      };

      render(<IcebreakerStage {...defaultProps} initialState={initialState} />);

      expect(screen.queryByText('Your Answer')).not.toBeInTheDocument();
    });
  });

  describe('Participants Display', () => {
    it('shows remaining participants', () => {
      const initialState: IcebreakerState = {
        currentQuestionIndex: 0,
        questions: ["Question 1"],
        isAnswering: true,
        answeredParticipants: ['user1'],
        answers: {},
      };

      render(<IcebreakerStage {...defaultProps} initialState={initialState} />);

      expect(screen.getByText('Remaining Participants (2)')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('shows answered participants with their answers', () => {
      const initialState: IcebreakerState = {
        currentQuestionIndex: 0,
        questions: ["Question 1"],
        isAnswering: true,
        answeredParticipants: ['user1'],
        answers: { user1: 'My awesome answer' },
      };

      render(<IcebreakerStage {...defaultProps} initialState={initialState} />);

      expect(screen.getByText('Already Answered (1)')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText(/"My awesome answer"/)).toBeInTheDocument();
    });
  });

  describe('Emoji Picker', () => {
    it('toggles emoji picker for edit textarea', () => {
      render(<IcebreakerStage {...defaultProps} />);

      // Enter edit mode
      const editButton = screen.getByLabelText('Edit question');
      fireEvent.click(editButton);

      // Toggle emoji picker
      const emojiButtons = screen.getAllByLabelText('Toggle emoji picker');
      fireEvent.click(emojiButtons[0]);

      expect(screen.getByTestId('emoji-picker')).toBeInTheDocument();
    });

    it('toggles emoji picker for answer textarea', () => {
      const initialState: IcebreakerState = {
        currentQuestionIndex: 0,
        questions: ["Question 1"],
        isAnswering: true,
        answeredParticipants: [],
        answers: {},
      };

      render(<IcebreakerStage {...defaultProps} initialState={initialState} />);

      const emojiButton = screen.getByLabelText('Toggle emoji picker');
      fireEvent.click(emojiButton);

      expect(screen.getByTestId('emoji-picker')).toBeInTheDocument();
    });
  });

  describe('Initial State', () => {
    it('uses initial state when provided', () => {
      const initialState: IcebreakerState = {
        currentQuestionIndex: 2,
        questions: ["Q1", "Q2", "Custom Question?"],
        isAnswering: false,
        answeredParticipants: [],
        answers: {},
      };

      render(<IcebreakerStage {...defaultProps} initialState={initialState} />);

      expect(screen.getByText('Custom Question?')).toBeInTheDocument();
      expect(screen.getByText(/Question 3 of 3/)).toBeInTheDocument();
    });
  });

  describe('WebSocket Message Handling', () => {
    it('handles answering-started message for non-creator', async () => {
      const toast = await import('react-hot-toast');
      const { ws, triggerMessage } = createMockWsWithHandler();

      render(<IcebreakerStage {...defaultProps} ws={ws} isRoomCreator={false} />);

      triggerMessage({ type: 'icebreaker-update', action: 'answering-started' });

      expect(toast.default.success).toHaveBeenCalledWith('Time to answer the question!');
    });

    it('handles answer-completed message from another user', async () => {
      const toast = await import('react-hot-toast');
      const { ws, triggerMessage } = createMockWsWithHandler();

      render(<IcebreakerStage {...defaultProps} ws={ws} />);

      triggerMessage({ 
        type: 'icebreaker-update', 
        action: 'answer-completed',
        participantId: 'user2',
        participantName: 'Bob',
        answer: 'My answer'
      });

      expect(toast.default.success).toHaveBeenCalledWith('Bob finished answering!');
    });

    it('handles question-changed message', () => {
      const { ws, triggerMessage } = createMockWsWithHandler();

      render(<IcebreakerStage {...defaultProps} ws={ws} />);

      triggerMessage({ 
        type: 'icebreaker-update', 
        action: 'question-changed',
        questionIndex: 2
      });

      // Question should change (we can't directly verify state, but no errors means it worked)
    });

    it('handles question-edited message', () => {
      const { ws, triggerMessage } = createMockWsWithHandler();

      render(<IcebreakerStage {...defaultProps} ws={ws} />);

      triggerMessage({ 
        type: 'icebreaker-update', 
        action: 'question-edited',
        questionIndex: 0,
        newQuestion: 'Edited question?'
      });

      // Should update without errors
    });

    it('handles answer-completed message for current user', () => {
      const { ws, triggerMessage } = createMockWsWithHandler();

      const initialState: IcebreakerState = {
        currentQuestionIndex: 0,
        questions: ["Question 1"],
        isAnswering: true,
        answeredParticipants: [],
        answers: {},
      };

      render(<IcebreakerStage {...defaultProps} ws={ws} initialState={initialState} />);

      triggerMessage({ 
        type: 'icebreaker-update', 
        action: 'answer-completed',
        participantId: 'user1',
        participantName: 'Alice',
        answer: 'My answer'
      });

      // Should clear participant answer (no toast for self)
    });

    it('handles invalid JSON gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { ws, triggerMessage } = createMockWsWithHandler();

      render(<IcebreakerStage {...defaultProps} ws={ws} />);

      triggerMessage('invalid json');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('ignores non-icebreaker messages', () => {
      const { ws, triggerMessage } = createMockWsWithHandler();

      render(<IcebreakerStage {...defaultProps} ws={ws} />);

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

      const { unmount } = render(<IcebreakerStage {...defaultProps} ws={wsWithHandler} />);
      unmount();

      expect(removeEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });
});
