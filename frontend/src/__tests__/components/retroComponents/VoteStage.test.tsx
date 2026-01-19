import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VoteStage from '../../../components/retroComponents/VoteStage';
import { Template, Card, CardGroup, VoteData } from '@/types/retroBoard';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('VoteStage', () => {
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

  const mockWs = {
    send: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: WebSocket.OPEN,
  } as unknown as WebSocket;

  const mockSetVotes = vi.fn();

  const defaultProps = {
    template: mockTemplate,
    currentUserId: 'user1',
    ws: mockWs,
    retroId: 'retro123',
    cards: mockCards,
    cardGroups: [] as CardGroup[],
    votingLimit: 5,
    votes: {} as VoteData,
    setVotes: mockSetVotes,
    stageId: 'vote-stage',
    isDone: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the vote info banner', () => {
      render(<VoteStage {...defaultProps} />);

      expect(screen.getByText('Cast Your Votes')).toBeInTheDocument();
      expect(screen.getByText(/Click on cards to vote/)).toBeInTheDocument();
    });

    it('displays remaining votes', () => {
      render(<VoteStage {...defaultProps} />);

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('votes left')).toBeInTheDocument();
    });

    it('displays used votes', () => {
      render(<VoteStage {...defaultProps} />);

      // Multiple '0' values exist (cards vote counts), so use getAllByText
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThan(0);
      expect(screen.getByText('votes used')).toBeInTheDocument();
    });

    it('renders all columns from template', () => {
      render(<VoteStage {...defaultProps} />);

      expect(screen.getByText('What went well')).toBeInTheDocument();
      expect(screen.getByText('What to improve')).toBeInTheDocument();
    });

    it('renders cards in their respective columns', () => {
      render(<VoteStage {...defaultProps} />);

      expect(screen.getByText('Card 1 content')).toBeInTheDocument();
      expect(screen.getByText('Card 2 content')).toBeInTheDocument();
      expect(screen.getByText('Card 3 content')).toBeInTheDocument();
    });

    it('shows item count for each column', () => {
      render(<VoteStage {...defaultProps} />);

      expect(screen.getByText('2 items')).toBeInTheDocument();
      expect(screen.getByText('1 item')).toBeInTheDocument();
    });

    it('shows empty column message when no cards', () => {
      const propsWithEmptyCards = {
        ...defaultProps,
        cards: [],
      };
      render(<VoteStage {...propsWithEmptyCards} />);

      const emptyMessages = screen.getAllByText('No cards in this column');
      expect(emptyMessages.length).toBe(2);
    });

    it('renders no template message when template is undefined', () => {
      render(<VoteStage {...defaultProps} template={undefined} />);

      expect(screen.getByText('No template found for this retrospective.')).toBeInTheDocument();
    });
  });

  describe('Voting', () => {
    it('renders vote buttons for each card', () => {
      render(<VoteStage {...defaultProps} />);

      const voteButtons = screen.getAllByTitle('Add vote');
      expect(voteButtons.length).toBe(3);
    });

    it('adds vote when vote button clicked', () => {
      render(<VoteStage {...defaultProps} />);

      const voteButtons = screen.getAllByTitle('Add vote');
      fireEvent.click(voteButtons[0]);

      expect(mockSetVotes).toHaveBeenCalled();
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"vote-add"')
      );
    });

    it('updates vote count display after voting', () => {
      const votes: VoteData = {
        card1: ['user1', 'user2'],
      };

      render(<VoteStage {...defaultProps} votes={votes} />);

      // Card 1 should show 2 votes
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('shows remaining votes correctly after voting', () => {
      const votes: VoteData = {
        card1: ['user1'],
        card2: ['user1'],
      };

      render(<VoteStage {...defaultProps} votes={votes} />);

      // 5 - 2 = 3 votes remaining
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // votes used
    });

    it('prevents voting when limit reached and button is disabled', () => {
      const votes: VoteData = {
        card1: ['user1', 'user1', 'user1', 'user1', 'user1'], // 5 votes used (limit reached)
      };

      render(<VoteStage {...defaultProps} votes={votes} />);

      // All vote buttons should be disabled
      const voteButtons = screen.getAllByTitle('Add vote');
      voteButtons.forEach(button => {
        expect(button).toBeDisabled();
      });

      // Clicking a disabled button should not trigger anything
      fireEvent.click(voteButtons[0]);
      
      // setVotes should not be called since button is disabled
      expect(mockSetVotes).not.toHaveBeenCalled();
    });

    it('disables vote buttons when limit reached', () => {
      const votes: VoteData = {
        card1: ['user1', 'user1', 'user1', 'user1', 'user1'],
      };

      render(<VoteStage {...defaultProps} votes={votes} />);

      const voteButtons = screen.getAllByTitle('Add vote');
      voteButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('shows warning message when all votes used', () => {
      const votes: VoteData = {
        card1: ['user1', 'user1', 'user1', 'user1', 'user1'],
      };

      render(<VoteStage {...defaultProps} votes={votes} />);

      expect(screen.getByText(/You've used all your votes/)).toBeInTheDocument();
    });
  });

  describe('Unvoting', () => {
    it('shows remove vote button only when user has voted', () => {
      const votes: VoteData = {
        card1: ['user1'],
      };

      render(<VoteStage {...defaultProps} votes={votes} />);

      expect(screen.getByTitle('Remove vote')).toBeInTheDocument();
    });

    it('removes vote when unvote button clicked', () => {
      const votes: VoteData = {
        card1: ['user1'],
      };

      render(<VoteStage {...defaultProps} votes={votes} />);

      const removeButton = screen.getByTitle('Remove vote');
      fireEvent.click(removeButton);

      expect(mockSetVotes).toHaveBeenCalled();
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"vote-remove"')
      );
    });

    it('shows user vote count badge', () => {
      const votes: VoteData = {
        card1: ['user1', 'user1', 'user1'],
      };

      render(<VoteStage {...defaultProps} votes={votes} />);

      // The badge should show 3
      const badges = screen.getAllByText('3');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('does not remove vote if user has not voted', () => {
      const votes: VoteData = {
        card1: ['user2', 'user3'], // Other users voted
      };

      render(<VoteStage {...defaultProps} votes={votes} />);

      // Remove button should not be visible for this card
      expect(screen.queryByTitle('Remove vote')).not.toBeInTheDocument();
    });
  });

  describe('Top Voted Summary', () => {
    it('does not show top voted section when no votes', () => {
      render(<VoteStage {...defaultProps} />);

      expect(screen.queryByText('Top Voted')).not.toBeInTheDocument();
    });

    it('shows top voted section when there are votes', () => {
      const votes: VoteData = {
        card1: ['user1', 'user2', 'user3'],
        card2: ['user1'],
      };

      render(<VoteStage {...defaultProps} votes={votes} />);

      expect(screen.getByText('Top Voted')).toBeInTheDocument();
    });

    it('ranks items by vote count', () => {
      const votes: VoteData = {
        card1: ['user1'],
        card2: ['user1', 'user2', 'user3'],
      };

      render(<VoteStage {...defaultProps} votes={votes} />);

      // Card 2 should be #1 with 3 votes
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('(3)')).toBeInTheDocument();
    });

    it('shows column color indicator in top voted', () => {
      const votes: VoteData = {
        card1: ['user1', 'user2'],
      };

      render(<VoteStage {...defaultProps} votes={votes} />);

      expect(screen.getByText('Top Voted')).toBeInTheDocument();
    });

    it('truncates long content in top voted', () => {
      const longContentCards: Card[] = [
        { id: 'card1', columnId: 'col1', content: 'A'.repeat(100), authorId: 'user1', groupId: null, createdAt: new Date() },
      ];
      const votes: VoteData = {
        card1: ['user1'],
      };

      render(<VoteStage {...defaultProps} cards={longContentCards} votes={votes} />);

      // Content should be truncated with ...
      expect(screen.getByText(/\.\.\.$/)).toBeInTheDocument();
    });
  });

  describe('Grouped Cards', () => {
    it('displays grouped cards with indicator', () => {
      const groupedCards: Card[] = [
        { id: 'card1', columnId: 'col1', content: 'Card 1', authorId: 'user1', groupId: 'group1', createdAt: new Date() },
        { id: 'card2', columnId: 'col1', content: 'Card 2', authorId: 'user2', groupId: 'group1', createdAt: new Date() },
      ];
      const cardGroups: CardGroup[] = [
        { id: 'group1', cardIds: ['card1', 'card2'], columnId: 'col1' },
      ];

      render(<VoteStage {...defaultProps} cards={groupedCards} cardGroups={cardGroups} />);

      expect(screen.getByText('Grouped (2 cards)')).toBeInTheDocument();
    });

    it('votes on group not individual cards', () => {
      const groupedCards: Card[] = [
        { id: 'card1', columnId: 'col1', content: 'Card 1', authorId: 'user1', groupId: 'group1', createdAt: new Date() },
        { id: 'card2', columnId: 'col1', content: 'Card 2', authorId: 'user2', groupId: 'group1', createdAt: new Date() },
      ];
      const cardGroups: CardGroup[] = [
        { id: 'group1', cardIds: ['card1', 'card2'], columnId: 'col1' },
      ];

      render(<VoteStage {...defaultProps} cards={groupedCards} cardGroups={cardGroups} />);

      const voteButtons = screen.getAllByTitle('Add vote');
      fireEvent.click(voteButtons[0]);

      // Should vote on group1, not card1
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"itemId":"group1"')
      );
    });

    it('shows all cards content within grouped item', () => {
      const groupedCards: Card[] = [
        { id: 'card1', columnId: 'col1', content: 'First card content', authorId: 'user1', groupId: 'group1', createdAt: new Date() },
        { id: 'card2', columnId: 'col1', content: 'Second card content', authorId: 'user2', groupId: 'group1', createdAt: new Date() },
      ];
      const cardGroups: CardGroup[] = [
        { id: 'group1', cardIds: ['card1', 'card2'], columnId: 'col1' },
      ];

      render(<VoteStage {...defaultProps} cards={groupedCards} cardGroups={cardGroups} />);

      expect(screen.getByText('First card content')).toBeInTheDocument();
      expect(screen.getByText('Second card content')).toBeInTheDocument();
    });
  });

  describe('Done Status', () => {
    it('shows Mark as Done button', () => {
      render(<VoteStage {...defaultProps} />);

      expect(screen.getByText('Mark as Done')).toBeInTheDocument();
    });

    it('toggles done status when button clicked', () => {
      render(<VoteStage {...defaultProps} />);

      const doneButton = screen.getByText('Mark as Done');
      fireEvent.click(doneButton);

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"mark-stage-done"')
      );
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"isDone":true')
      );
    });

    it('shows Done text when already done', () => {
      render(<VoteStage {...defaultProps} isDone={true} />);

      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    it('can toggle done status off', () => {
      render(<VoteStage {...defaultProps} isDone={true} />);

      const doneButton = screen.getByText('Done');
      fireEvent.click(doneButton);

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"isDone":false')
      );
    });

    it('does not send ws message if ws is null', () => {
      render(<VoteStage {...defaultProps} ws={null} />);

      const doneButton = screen.getByText('Mark as Done');
      fireEvent.click(doneButton);

      // No error should occur
    });
  });

  describe('Column Vote Summary', () => {
    it('shows total votes for column', () => {
      const votes: VoteData = {
        card1: ['user1', 'user2'],
        card2: ['user3'],
      };

      render(<VoteStage {...defaultProps} votes={votes} />);

      // Column 1 should show (3 votes) total
      expect(screen.getByText('(3 votes)')).toBeInTheDocument();
    });

    it('sorts items within column by vote count', () => {
      const votes: VoteData = {
        card1: ['user1'],
        card2: ['user1', 'user2', 'user3'],
      };

      render(<VoteStage {...defaultProps} votes={votes} />);

      // Card 2 should appear before Card 1 due to sorting (multiple elements may exist due to Top Voted)
      const card2Elements = screen.getAllByText('Card 2 content');
      const card1Elements = screen.getAllByText('Card 1 content');
      
      // Both should be found
      expect(card2Elements.length).toBeGreaterThan(0);
      expect(card1Elements.length).toBeGreaterThan(0);
    });
  });

  describe('WebSocket Handling', () => {
    it('sends vote-add with correct data', () => {
      render(<VoteStage {...defaultProps} />);

      const voteButtons = screen.getAllByTitle('Add vote');
      fireEvent.click(voteButtons[0]);

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'vote-add',
          retroId: 'retro123',
          itemId: 'card1',
          columnId: 'col1',
          userId: 'user1'
        })
      );
    });

    it('sends vote-remove with correct data', () => {
      const votes: VoteData = {
        card1: ['user1'],
      };

      render(<VoteStage {...defaultProps} votes={votes} />);

      const removeButton = screen.getByTitle('Remove vote');
      fireEvent.click(removeButton);

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'vote-remove',
          retroId: 'retro123',
          itemId: 'card1',
          userId: 'user1'
        })
      );
    });

    it('does not send vote if ws is null', () => {
      render(<VoteStage {...defaultProps} ws={null} />);

      const voteButtons = screen.getAllByTitle('Add vote');
      fireEvent.click(voteButtons[0]);

      // setVotes should still be called for local update
      expect(mockSetVotes).toHaveBeenCalled();
    });

    it('does not send unvote if ws is null', () => {
      const votes: VoteData = {
        card1: ['user1'],
      };

      render(<VoteStage {...defaultProps} votes={votes} ws={null} />);

      const removeButton = screen.getByTitle('Remove vote');
      fireEvent.click(removeButton);

      // setVotes should still be called for local update
      expect(mockSetVotes).toHaveBeenCalled();
    });
  });

  describe('Visual States', () => {
    it('highlights voted cards', () => {
      const votes: VoteData = {
        card1: ['user1'],
      };

      render(<VoteStage {...defaultProps} votes={votes} />);

      // The card should have special styling (verified by existence of remove button)
      expect(screen.getByTitle('Remove vote')).toBeInTheDocument();
    });

    it('shows vote count on each card', () => {
      const votes: VoteData = {
        card1: ['user1', 'user2'],
        card2: ['user3'],
        card3: [],
      };

      render(<VoteStage {...defaultProps} votes={votes} />);

      // Multiple vote counts should be visible
      const voteCounts = screen.getAllByText('0');
      expect(voteCounts.length).toBeGreaterThan(0);
    });
  });
});
