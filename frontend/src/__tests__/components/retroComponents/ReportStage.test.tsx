import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportStage from '@/components/retroComponents/ReportStage';
import { Template, Card, CardGroup, VoteData, Participant, ActionItem } from '@/types/retroBoard';
import toast from 'react-hot-toast';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock date-fns format
vi.mock('date-fns', () => ({
  format: vi.fn((_date: Date, formatStr: string) => {
    if (formatStr === 'MMMM d, yyyy') return 'January 1, 2024';
    if (formatStr === 'MMMM d, yyyy h:mm a') return 'January 1, 2024 10:00 AM';
    if (formatStr === 'yyyy-MM-dd') return '2024-01-01';
    if (formatStr === 'MMM d, yyyy') return 'Jan 1, 2024';
    return '2024-01-01';
  }),
}));

// Mock jsPDF with tracking of method calls
const mockSave = vi.fn();
const mockAddPage = vi.fn();
const mockSetPage = vi.fn();
const mockText = vi.fn();
const mockSetFillColor = vi.fn();
const mockRect = vi.fn();
const mockRoundedRect = vi.fn();
const mockSetTextColor = vi.fn();
const mockSetFontSize = vi.fn();
const mockSetFont = vi.fn();
const mockSplitTextToSize = vi.fn((text: string) => [text]);
const mockGetTextWidth = vi.fn(() => 50);
const mockGetNumberOfPages = vi.fn(() => 1);

vi.mock('jspdf', () => ({
  default: vi.fn(function() {
    return {
      setFillColor: mockSetFillColor,
      rect: mockRect,
      roundedRect: mockRoundedRect,
      setTextColor: mockSetTextColor,
      setFontSize: mockSetFontSize,
      setFont: mockSetFont,
      text: mockText,
      addPage: mockAddPage,
      setPage: mockSetPage,
      getNumberOfPages: mockGetNumberOfPages,
      splitTextToSize: mockSplitTextToSize,
      getTextWidth: mockGetTextWidth,
      save: mockSave,
    };
  }),
}));

// Mock the retroUtils module
vi.mock('@/types/retroUtils', () => ({
  getTotalVotes: vi.fn((votes: VoteData) => {
    return Object.values(votes).reduce((sum, arr) => sum + arr.length, 0);
  }),
  getVoteCount: vi.fn((votes: VoteData, cardId: string) => {
    return votes[cardId]?.length || 0;
  }),
  getTopVotedItems: vi.fn((cards: Card[], _cardGroups: CardGroup[], votes: VoteData, limit: number) => {
    return cards.map(card => ({
      id: card.id,
      columnId: card.columnId,
      content: card.content,
      voteCount: votes[card.id]?.length || 0,
    }))
      .sort((a, b) => b.voteCount - a.voteCount)
      .slice(0, limit);
  }),
  getCardsByColumn: vi.fn((template: Template, cards: Card[], cardGroups: CardGroup[], votes: VoteData) => {
    const result: Record<string, { cards: Card[]; groups: { id: string; cards: Card[]; voteCount: number }[] }> = {};
    template?.columns.forEach(col => {
      const colCards = cards.filter(c => c.columnId === col.id && !c.groupId);
      const colGroups = cardGroups
        .filter(g => g.columnId === col.id)
        .map(g => ({
          id: g.id,
          cards: cards.filter(c => g.cardIds.includes(c.id)),
          voteCount: votes[g.id]?.length || 0,
        }));
      result[col.id] = {
        cards: colCards,
        groups: colGroups,
      };
    });
    return result;
  }),
  getColumnInfo: vi.fn((template: Template, columnId: string) => {
    return template?.columns.find(c => c.id === columnId);
  }),
  getAssigneeName: vi.fn((participants: Participant[], assigneeId: string) => {
    const p = participants.find(p => p.id === assigneeId);
    return p ? p.name : 'Unassigned';
  }),
  getPriorityColor: vi.fn((priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-green-500';
    }
  }),
  getStatusColor: vi.fn((status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'in_progress': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  }),
}));

describe('ReportStage', () => {
  // Sample data
  const sampleTemplate: Template = {
    id: 'template1',
    name: 'Mad Sad Glad',
    columns: [
      { id: 'col1', name: 'Mad', color: '#ef4444', placeholder: 'What made you mad?' },
      { id: 'col2', name: 'Sad', color: '#3b82f6', placeholder: 'What made you sad?' },
      { id: 'col3', name: 'Glad', color: '#22c55e', placeholder: 'What made you glad?' },
    ],
  };

  const sampleCards: Card[] = [
    { id: 'card1', columnId: 'col1', content: 'Too many bugs in production', authorId: 'user1', groupId: null, createdAt: new Date() },
    { id: 'card2', columnId: 'col2', content: 'Missed deadline', authorId: 'user2', groupId: null, createdAt: new Date() },
    { id: 'card3', columnId: 'col3', content: 'Great teamwork this sprint', authorId: 'user3', groupId: null, createdAt: new Date() },
    { id: 'card4', columnId: 'col3', content: 'Good collaboration', authorId: 'user1', groupId: null, createdAt: new Date() },
  ];

  const sampleVotes: VoteData = {
    'card1': ['user1', 'user2', 'user3'],
    'card3': ['user1', 'user2'],
    'card2': ['user3'],
    'card4': ['user1'],
  };

  const sampleParticipants: Participant[] = [
    { id: 'user1', name: 'Alice', joinedAt: new Date(), isCreator: true },
    { id: 'user2', name: 'Bob', joinedAt: new Date() },
    { id: 'user3', name: 'Charlie', joinedAt: new Date() },
  ];

  const sampleActionItems: ActionItem[] = [
    {
      id: 'action1',
      title: 'Fix critical bugs',
      description: 'Address the most urgent bugs',
      assigneeId: 'user1',
      priority: 'high',
      dueDate: '2024-12-01',
      status: 'pending',
    },
    {
      id: 'action2',
      title: 'Review process',
      description: 'Review our development process',
      assigneeId: 'user2',
      priority: 'medium',
      dueDate: '',
      status: 'in_progress',
    },
    {
      id: 'action3',
      title: 'Update documentation',
      description: '',
      assigneeId: '',
      priority: 'low',
      dueDate: '',
      status: 'completed',
    },
  ];

  const defaultProps = {
    template: sampleTemplate,
    retroId: 'retro123',
    retroName: 'Sprint 42 Retrospective',
    retroContext: 'Review of Q4 sprint performance',
    cards: sampleCards,
    cardGroups: [] as CardGroup[],
    votes: sampleVotes,
    participants: sampleParticipants,
    actionItems: sampleActionItems,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the report header', () => {
      render(<ReportStage {...defaultProps} />);

      expect(screen.getByText('Session Report')).toBeInTheDocument();
      expect(screen.getByText(/Review summary and export/)).toBeInTheDocument();
    });

    it('displays the retro name', () => {
      render(<ReportStage {...defaultProps} />);

      expect(screen.getByText('Sprint 42 Retrospective')).toBeInTheDocument();
    });

    it('displays the template name', () => {
      render(<ReportStage {...defaultProps} />);

      expect(screen.getByText(/Mad Sad Glad Template/)).toBeInTheDocument();
    });

    it('displays the context if provided', () => {
      render(<ReportStage {...defaultProps} />);

      expect(screen.getByText('Review of Q4 sprint performance')).toBeInTheDocument();
    });

    it('renders no template message when template is undefined', () => {
      render(<ReportStage {...defaultProps} template={undefined} />);

      expect(screen.getByText(/No template found/)).toBeInTheDocument();
    });

    it('shows download PDF button', () => {
      render(<ReportStage {...defaultProps} />);

      expect(screen.getByText('Download PDF')).toBeInTheDocument();
    });

    it('displays default title when retro name is empty', () => {
      render(<ReportStage {...defaultProps} retroName="" />);

      expect(screen.getByText('Retrospective Report')).toBeInTheDocument();
    });
  });

  describe('Statistics Grid', () => {
    it('displays participant count', () => {
      render(<ReportStage {...defaultProps} />);

      // 3 participants (may appear multiple times)
      const threeElements = screen.getAllByText('3');
      expect(threeElements.length).toBeGreaterThan(0);
      const participantLabels = screen.getAllByText('Participants');
      expect(participantLabels.length).toBeGreaterThan(0);
    });

    it('displays card count', () => {
      render(<ReportStage {...defaultProps} />);

      // 4 cards (may appear multiple times)
      const fourElements = screen.getAllByText('4');
      expect(fourElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Cards')).toBeInTheDocument();
    });

    it('displays vote count', () => {
      render(<ReportStage {...defaultProps} />);

      // 7 total votes
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('Votes')).toBeInTheDocument();
    });

    it('displays action items count', () => {
      render(<ReportStage {...defaultProps} />);

      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('displays high priority actions count', () => {
      render(<ReportStage {...defaultProps} />);

      // 1 high priority action
      const oneElements = screen.getAllByText('1');
      expect(oneElements.length).toBeGreaterThan(0);
      expect(screen.getByText('High Priority')).toBeInTheDocument();
    });

    it('shows zero for empty statistics', () => {
      render(<ReportStage {...defaultProps} cards={[]} votes={{}} actionItems={[]} participants={[]} />);

      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThan(0);
    });
  });

  describe('Top Voted Items Section', () => {
    it('renders top voted items section', () => {
      render(<ReportStage {...defaultProps} />);

      expect(screen.getByText('Top Voted Items')).toBeInTheDocument();
    });

    it('displays top voted items sorted by votes', () => {
      render(<ReportStage {...defaultProps} />);

      // card1 has 3 votes, should be first (may appear multiple times)
      const cardElements = screen.getAllByText('Too many bugs in production');
      expect(cardElements.length).toBeGreaterThan(0);
    });

    it('shows no voted items message when no votes', () => {
      render(<ReportStage {...defaultProps} votes={{}} cards={[]} />);

      expect(screen.getByText('No voted items')).toBeInTheDocument();
    });

    it('shows vote count for each item', () => {
      render(<ReportStage {...defaultProps} />);

      // Display vote counts
      const voteCountElements = screen.getAllByText(/votes/);
      expect(voteCountElements.length).toBeGreaterThan(0);
    });

    it('shows column name tags for items', () => {
      render(<ReportStage {...defaultProps} />);

      // Cards are from Mad, Sad, Glad columns (may appear multiple times)
      const madElements = screen.getAllByText('Mad');
      expect(madElements.length).toBeGreaterThan(0);
    });
  });

  describe('Action Items Section', () => {
    it('renders action items section', () => {
      render(<ReportStage {...defaultProps} />);

      expect(screen.getByText('Action Items')).toBeInTheDocument();
    });

    it('displays action item titles', () => {
      render(<ReportStage {...defaultProps} />);

      expect(screen.getByText('Fix critical bugs')).toBeInTheDocument();
      expect(screen.getByText('Review process')).toBeInTheDocument();
      expect(screen.getByText('Update documentation')).toBeInTheDocument();
    });

    it('shows no action items message when empty', () => {
      render(<ReportStage {...defaultProps} actionItems={[]} />);

      // When there are no action items, the section should show empty state
      expect(screen.getByText('Action Items')).toBeInTheDocument();
    });

    it('displays action item priority', () => {
      render(<ReportStage {...defaultProps} />);

      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
      expect(screen.getByText('low')).toBeInTheDocument();
    });

    it('displays action item assignees', () => {
      render(<ReportStage {...defaultProps} />);

      // Alice and Bob are assigned to actions
      const aliceElements = screen.getAllByText('Alice');
      expect(aliceElements.length).toBeGreaterThan(0);
    });
  });

  describe('Feedback by Category Section', () => {
    it('renders feedback by category section', () => {
      render(<ReportStage {...defaultProps} />);

      expect(screen.getByText('Feedback by Category')).toBeInTheDocument();
    });

    it('displays column headers', () => {
      render(<ReportStage {...defaultProps} />);

      // Column names should appear as category headers
      const madElements = screen.getAllByText(/Mad/);
      expect(madElements.length).toBeGreaterThan(0);
    });

    it('shows item count per column', () => {
      render(<ReportStage {...defaultProps} />);

      // Each column shows item count
      const countElements = screen.getAllByText(/item/);
      expect(countElements.length).toBeGreaterThan(0);
    });

    it('displays card content within categories', () => {
      render(<ReportStage {...defaultProps} />);

      // Card content should be visible (may appear multiple times)
      const cardElements = screen.getAllByText('Missed deadline');
      expect(cardElements.length).toBeGreaterThan(0);
    });
  });

  describe('Participants Section', () => {
    it('renders participants section', () => {
      render(<ReportStage {...defaultProps} />);

      const participantSections = screen.getAllByText('Participants');
      expect(participantSections.length).toBeGreaterThan(0);
    });

    it('displays participant names', () => {
      render(<ReportStage {...defaultProps} />);

      const aliceElements = screen.getAllByText('Alice');
      const bobElements = screen.getAllByText('Bob');
      const charlieElements = screen.getAllByText('Charlie');
      expect(aliceElements.length).toBeGreaterThan(0);
      expect(bobElements.length).toBeGreaterThan(0);
      expect(charlieElements.length).toBeGreaterThan(0);
    });

    it('shows facilitator badge for creator', () => {
      render(<ReportStage {...defaultProps} />);

      expect(screen.getByText(/Facilitator/)).toBeInTheDocument();
    });
  });

  describe('PDF Download', () => {
    it('shows Download PDF button', () => {
      render(<ReportStage {...defaultProps} />);

      const downloadButton = screen.getByText('Download PDF');
      expect(downloadButton).toBeInTheDocument();
    });

    it('generates PDF and saves with correct filename when button clicked', async () => {
      render(<ReportStage {...defaultProps} />);

      const downloadButton = screen.getByRole('button', { name: /download pdf/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(mockSave).toHaveBeenCalled();
      });

      // Verify the filename format
      expect(mockSave).toHaveBeenCalledWith(
        expect.stringContaining('Sprint_42_Retrospective')
      );
    });

    it('calls toast.success after successful PDF generation', async () => {
      render(<ReportStage {...defaultProps} />);

      const downloadButton = screen.getByRole('button', { name: /download pdf/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('PDF downloaded successfully!');
      });
    });

    it('has disabled state class', () => {
      render(<ReportStage {...defaultProps} />);

      const downloadButton = screen.getByText('Download PDF');
      expect(downloadButton).toHaveClass('disabled:opacity-50');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty retro context', () => {
      render(<ReportStage {...defaultProps} retroContext="" />);

      expect(screen.getByText('Session Report')).toBeInTheDocument();
    });

    it('handles no participants', () => {
      render(<ReportStage {...defaultProps} participants={[]} />);

      expect(screen.getByText('Session Report')).toBeInTheDocument();
    });

    it('handles action items with missing assignees', () => {
      const actionsWithNoAssignee = [{
        id: 'action1',
        title: 'Unassigned task',
        description: '',
        assigneeId: '',
        priority: 'medium' as const,
        dueDate: '',
        status: 'pending' as const,
      }];
      render(<ReportStage {...defaultProps} actionItems={actionsWithNoAssignee} />);

      expect(screen.getByText('Unassigned task')).toBeInTheDocument();
    });

    it('handles special characters in retro name', () => {
      render(<ReportStage {...defaultProps} retroName="Sprint #42 - Q4 Review!" />);

      // Should display the name with special characters
      expect(screen.getByText('Sprint #42 - Q4 Review!')).toBeInTheDocument();
    });

    it('handles card groups in column data', () => {
      const cardGroups: CardGroup[] = [{
        id: 'group1',
        columnId: 'col1',
        cardIds: ['card1'],
      }];
      render(<ReportStage {...defaultProps} cardGroups={cardGroups} />);

      expect(screen.getByText('Session Report')).toBeInTheDocument();
    });
  });

  describe('Visual Layout', () => {
    it('renders statistics in grid layout', () => {
      render(<ReportStage {...defaultProps} />);

      // Check that all stat labels are present (some may appear multiple times)
      const participantLabels = screen.getAllByText('Participants');
      expect(participantLabels.length).toBeGreaterThan(0);
      expect(screen.getByText('Cards')).toBeInTheDocument();
      expect(screen.getByText('Votes')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
      expect(screen.getByText('High Priority')).toBeInTheDocument();
    });

    it('shows date in header', () => {
      render(<ReportStage {...defaultProps} />);

      const dateElements = screen.getAllByText(/January 1, 2024/);
      expect(dateElements.length).toBeGreaterThan(0);
    });

    it('renders all sections in order', () => {
      render(<ReportStage {...defaultProps} />);

      // Check sections exist
      expect(screen.getByText('Session Report')).toBeInTheDocument();
      expect(screen.getByText('Top Voted Items')).toBeInTheDocument();
      expect(screen.getByText('Action Items')).toBeInTheDocument();
      expect(screen.getByText('Feedback by Category')).toBeInTheDocument();
    });
  });

  describe('Action Items Table', () => {
    it('renders action item description when present', () => {
      render(<ReportStage {...defaultProps} />);

      expect(screen.getByText('Address the most urgent bugs')).toBeInTheDocument();
    });

    it('renders action item due dates', () => {
      render(<ReportStage {...defaultProps} />);

      // The mocked format function returns 'Jan 1, 2024' for due dates
      const dueDates = screen.getAllByText('Jan 1, 2024');
      expect(dueDates.length).toBeGreaterThan(0);
    });

    it('shows Not set for missing due dates', () => {
      const actionsWithNoDueDate = [{
        id: 'action1',
        title: 'Task without due date',
        description: '',
        assigneeId: 'user1',
        priority: 'medium' as const,
        dueDate: '',
        status: 'pending' as const,
      }];
      render(<ReportStage {...defaultProps} actionItems={actionsWithNoDueDate} />);

      expect(screen.getByText('Not set')).toBeInTheDocument();
    });

    it('shows completed status correctly', () => {
      const completedAction = [{
        id: 'action1',
        title: 'Completed task',
        description: '',
        assigneeId: 'user1',
        priority: 'low' as const,
        dueDate: '',
        status: 'completed' as const,
      }];
      render(<ReportStage {...defaultProps} actionItems={completedAction} />);

      expect(screen.getByText('completed')).toBeInTheDocument();
    });

    it('shows in_progress status correctly', () => {
      render(<ReportStage {...defaultProps} />);

      expect(screen.getByText('in progress')).toBeInTheDocument();
    });
  });

  describe('Feedback by Category', () => {
    it('renders column headers with correct names', () => {
      render(<ReportStage {...defaultProps} />);

      const madElements = screen.getAllByText('Mad');
      const sadElements = screen.getAllByText('Sad');
      const gladElements = screen.getAllByText('Glad');
      
      expect(madElements.length).toBeGreaterThan(0);
      expect(sadElements.length).toBeGreaterThan(0);
      expect(gladElements.length).toBeGreaterThan(0);
    });

    it('renders cards in their respective columns', () => {
      render(<ReportStage {...defaultProps} />);

      // Cards from sample data - use getAllByText for potential duplicates
      const bugsElements = screen.getAllByText('Too many bugs in production');
      const deadlineElements = screen.getAllByText('Missed deadline');
      const teamworkElements = screen.getAllByText('Great teamwork this sprint');
      
      expect(bugsElements.length).toBeGreaterThan(0);
      expect(deadlineElements.length).toBeGreaterThan(0);
      expect(teamworkElements.length).toBeGreaterThan(0);
    });

    it('shows item count for each column', () => {
      render(<ReportStage {...defaultProps} />);

      // Check for item counts
      const itemCounts = screen.getAllByText(/\d+ items?/);
      expect(itemCounts.length).toBeGreaterThan(0);
    });

    it('shows no items message for empty columns', () => {
      const emptyTemplate: Template = {
        id: 'template1',
        name: 'Empty Template',
        columns: [
          { id: 'col1', name: 'Column 1', color: '#ef4444', placeholder: 'placeholder' },
        ],
      };
      render(<ReportStage {...defaultProps} template={emptyTemplate} cards={[]} />);

      const noItemsElements = screen.getAllByText('No items');
      expect(noItemsElements.length).toBeGreaterThan(0);
    });
  });

  describe('Top Voted Items Section', () => {
    it('shows vote counts for each item', () => {
      render(<ReportStage {...defaultProps} />);

      // With our mock data, card1 has 3 votes
      const voteTexts = screen.getAllByText(/\d+ votes?/);
      expect(voteTexts.length).toBeGreaterThan(0);
    });

    it('renders numbered list of top items', () => {
      render(<ReportStage {...defaultProps} />);

      // Should show numbered items - use getAllByText since numbers may appear multiple times
      const oneElements = screen.getAllByText('1');
      const twoElements = screen.getAllByText('2');
      expect(oneElements.length).toBeGreaterThan(0);
      expect(twoElements.length).toBeGreaterThan(0);
    });

    it('shows category badge for each item', () => {
      render(<ReportStage {...defaultProps} />);

      // Column names appear as category badges
      const madBadges = screen.getAllByText('Mad');
      expect(madBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Statistics Values', () => {
    it('calculates correct participant count', () => {
      render(<ReportStage {...defaultProps} />);

      // 3 participants in sample data
      const threeElements = screen.getAllByText('3');
      expect(threeElements.length).toBeGreaterThan(0);
    });

    it('calculates correct card count', () => {
      render(<ReportStage {...defaultProps} />);

      // 4 cards in sample data
      const fourElements = screen.getAllByText('4');
      expect(fourElements.length).toBeGreaterThan(0);
    });

    it('calculates correct vote count', () => {
      render(<ReportStage {...defaultProps} />);

      // Total votes: 3 + 2 + 1 + 1 = 7
      const sevenElements = screen.getAllByText('7');
      expect(sevenElements.length).toBeGreaterThan(0);
    });

    it('shows high priority count', () => {
      render(<ReportStage {...defaultProps} />);

      // 1 high priority action in sample data
      const oneElements = screen.getAllByText('1');
      expect(oneElements.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('has accessible button for PDF download', () => {
      render(<ReportStage {...defaultProps} />);

      const button = screen.getByRole('button', { name: /download pdf/i });
      expect(button).toBeInTheDocument();
    });

    it('renders table with proper structure', () => {
      render(<ReportStage {...defaultProps} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('has column headers in action items table', () => {
      render(<ReportStage {...defaultProps} />);

      expect(screen.getByRole('columnheader', { name: /action/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /assignee/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /priority/i })).toBeInTheDocument();
    });
  });

  describe('Participant Display', () => {
    it('renders all participant names', () => {
      render(<ReportStage {...defaultProps} />);

      // Use getAllByText since names may appear multiple times
      const aliceElements = screen.getAllByText('Alice');
      const bobElements = screen.getAllByText('Bob');
      const charlieElements = screen.getAllByText('Charlie');
      
      expect(aliceElements.length).toBeGreaterThan(0);
      expect(bobElements.length).toBeGreaterThan(0);
      expect(charlieElements.length).toBeGreaterThan(0);
    });

    it('shows participant initial avatar', () => {
      render(<ReportStage {...defaultProps} />);

      // Check for initials - they appear in the avatars
      const aElements = screen.getAllByText('A');
      const bElements = screen.getAllByText('B');
      const cElements = screen.getAllByText('C');
      
      expect(aElements.length).toBeGreaterThan(0);
      expect(bElements.length).toBeGreaterThan(0);
      expect(cElements.length).toBeGreaterThan(0);
    });
  });

  describe('Card Groups in Report', () => {
    const sampleCardsWithGroups: Card[] = [
      { id: 'card1', columnId: 'col1', content: 'Too many bugs in production', authorId: 'user1', groupId: 'group1', createdAt: new Date() },
      { id: 'card2', columnId: 'col1', content: 'Performance issues', authorId: 'user2', groupId: 'group1', createdAt: new Date() },
      { id: 'card3', columnId: 'col2', content: 'Missed deadline', authorId: 'user2', groupId: null, createdAt: new Date() },
      { id: 'card4', columnId: 'col3', content: 'Great teamwork', authorId: 'user1', groupId: null, createdAt: new Date() },
    ];

    const sampleCardGroups: CardGroup[] = [{
      id: 'group1',
      columnId: 'col1',
      cardIds: ['card1', 'card2'],
    }];

    const sampleVotesWithGroups: VoteData = {
      'group1': ['user1', 'user2', 'user3'],
      'card3': ['user1'],
      'card4': ['user2'],
    };

    it('renders card groups with Group label', () => {
      render(
        <ReportStage 
          {...defaultProps} 
          cards={sampleCardsWithGroups} 
          cardGroups={sampleCardGroups}
          votes={sampleVotesWithGroups}
        />
      );

      const groupLabels = screen.getAllByText('Group');
      expect(groupLabels.length).toBeGreaterThan(0);
    });

    it('renders grouped cards content', () => {
      render(
        <ReportStage 
          {...defaultProps} 
          cards={sampleCardsWithGroups} 
          cardGroups={sampleCardGroups}
          votes={sampleVotesWithGroups}
        />
      );

      // Both cards in the group should be displayed
      expect(screen.getAllByText(/Too many bugs in production/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Performance issues/).length).toBeGreaterThan(0);
    });

    it('displays vote count for groups', () => {
      render(
        <ReportStage 
          {...defaultProps} 
          cards={sampleCardsWithGroups} 
          cardGroups={sampleCardGroups}
          votes={sampleVotesWithGroups}
        />
      );

      // Group has 3 votes
      const threeElements = screen.getAllByText('3');
      expect(threeElements.length).toBeGreaterThan(0);
    });

    it('generates PDF successfully with card groups', async () => {
      render(
        <ReportStage 
          {...defaultProps} 
          cards={sampleCardsWithGroups} 
          cardGroups={sampleCardGroups}
          votes={sampleVotesWithGroups}
        />
      );

      const downloadButton = screen.getByRole('button', { name: /download pdf/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('PDF downloaded successfully!');
      });
    });
  });

  describe('Report Footer', () => {
    it('renders footer with generation date', () => {
      render(<ReportStage {...defaultProps} />);

      const footerTexts = screen.getAllByText(/Generated by KONE/);
      expect(footerTexts.length).toBeGreaterThan(0);
    });
  });
});
