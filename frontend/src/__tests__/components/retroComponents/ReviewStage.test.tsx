import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReviewStage from '@/components/retroComponents/ReviewStage';
import { Template, Card, CardGroup, VoteData, Participant, ActionItem } from '@/types/retroBoard';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the retroUtils module
vi.mock('@/types/retroUtils', () => ({
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
  getTotalVotes: vi.fn((votes: VoteData) => {
    return Object.values(votes).reduce((sum, arr) => sum + arr.length, 0);
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
  getParticipantStats: vi.fn(() => []),
}));

import toast from 'react-hot-toast';

describe('ReviewStage', () => {
  // Mock WebSocket
  let mockWs: { send: ReturnType<typeof vi.fn>; readyState: number };
  let mockSetActionItems: React.Dispatch<React.SetStateAction<ActionItem[]>>;

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
    { id: 'card1', columnId: 'col1', content: 'Too many bugs', authorId: 'user1', groupId: null, createdAt: new Date() },
    { id: 'card2', columnId: 'col2', content: 'Missed deadline', authorId: 'user2', groupId: null, createdAt: new Date() },
    { id: 'card3', columnId: 'col3', content: 'Great teamwork', authorId: 'user3', groupId: null, createdAt: new Date() },
  ];

  const sampleVotes: VoteData = {
    'card1': ['user1', 'user2', 'user3'],
    'card3': ['user1', 'user2'],
    'card2': ['user3'],
  };

  const sampleParticipants: Participant[] = [
    { id: 'user1', name: 'Alice', joinedAt: new Date() },
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
  ];

  const defaultProps = {
    template: sampleTemplate,
    currentUserId: 'user1',
    ws: null as WebSocket | null,
    retroId: 'retro123',
    cards: sampleCards,
    cardGroups: [] as CardGroup[],
    votes: sampleVotes,
    participants: sampleParticipants,
    isRoomCreator: true,
    actionItems: sampleActionItems,
    setActionItems: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockWs = {
      send: vi.fn(),
      readyState: WebSocket.OPEN,
    };
    mockSetActionItems = vi.fn() as unknown as React.Dispatch<React.SetStateAction<ActionItem[]>>;
  });

  describe('Rendering', () => {
    it('renders main sections and counts', () => {
      render(<ReviewStage {...defaultProps} />);

      expect(screen.getByText('Review & Actions')).toBeInTheDocument();
      expect(screen.getByText(/3 Cards/)).toBeInTheDocument();
      expect(screen.getByText(/6 Votes/)).toBeInTheDocument();
      expect(screen.getByText(/2 Actions/)).toBeInTheDocument();
      expect(screen.getByText('Top Voted Items')).toBeInTheDocument();
      expect(screen.getByText('Action Items')).toBeInTheDocument();
    });

    it('renders no template message when template is undefined', () => {
      render(<ReviewStage {...defaultProps} template={undefined} />);

      expect(screen.getByText(/No template found/)).toBeInTheDocument();
    });
  });

  describe('Top Voted Items', () => {
    it('displays top voted items sorted by votes', () => {
      render(<ReviewStage {...defaultProps} />);

      // card1 has most votes (3)
      expect(screen.getByText('Too many bugs')).toBeInTheDocument();
    });

    it('shows no voted items message when no votes', () => {
      render(<ReviewStage {...defaultProps} votes={{}} cards={[]} />);

      expect(screen.getByText('No voted items yet')).toBeInTheDocument();
    });

    it('shows Add Action button for each top voted item', () => {
      render(<ReviewStage {...defaultProps} />);

      // There should be plus buttons for each item
      const addButtons = screen.getAllByTitle('Create action from this item');
      expect(addButtons.length).toBeGreaterThan(0);
    });

    it('opens add action form when clicking add button on top voted item', () => {
      render(<ReviewStage {...defaultProps} />);

      const addButtons = screen.getAllByTitle('Create action from this item');
      fireEvent.click(addButtons[0]);

      // Form should appear with prefilled title
      expect(screen.getByPlaceholderText('Action title...')).toBeInTheDocument();
    });
  });

  describe('Action Items List', () => {
    it('displays existing action items', () => {
      render(<ReviewStage {...defaultProps} />);

      expect(screen.getByText('Fix critical bugs')).toBeInTheDocument();
      expect(screen.getByText('Review process')).toBeInTheDocument();
    });

    it('shows no action items message when empty', () => {
      render(<ReviewStage {...defaultProps} actionItems={[]} />);

      expect(screen.getByText(/No action items yet/)).toBeInTheDocument();
    });

    it('shows Add Action button', () => {
      render(<ReviewStage {...defaultProps} />);

      expect(screen.getByText('Add Action')).toBeInTheDocument();
    });

    it('shows assignee name for action items', () => {
      render(<ReviewStage {...defaultProps} />);

      // Multiple occurrences of names (in action items and team participation)
      const aliceElements = screen.getAllByText('Alice');
      const bobElements = screen.getAllByText('Bob');
      expect(aliceElements.length).toBeGreaterThan(0);
      expect(bobElements.length).toBeGreaterThan(0);
    });

    it('shows priority for action items', () => {
      render(<ReviewStage {...defaultProps} />);

      // Priority is displayed lowercase in the component
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
    });
  });

  describe('Adding Action Items', () => {
    it('opens add action form when clicking Add Action button', () => {
      render(<ReviewStage {...defaultProps} />);

      const addButton = screen.getByText('Add Action');
      fireEvent.click(addButton);

      expect(screen.getByPlaceholderText('Action title...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Description (optional)...')).toBeInTheDocument();
    });

    it('shows assignee, priority, and due date fields in form', () => {
      render(<ReviewStage {...defaultProps} />);

      fireEvent.click(screen.getByText('Add Action'));

      expect(screen.getByText('Assignee')).toBeInTheDocument();
      expect(screen.getByText('Priority')).toBeInTheDocument();
      expect(screen.getByText('Due Date')).toBeInTheDocument();
    });

    it('shows participants in assignee dropdown', () => {
      render(<ReviewStage {...defaultProps} />);

      fireEvent.click(screen.getByText('Add Action'));

      const assigneeSelect = screen.getByTitle('Assignee');
      expect(assigneeSelect).toBeInTheDocument();
      // Participants should be available as options
      expect(assigneeSelect.innerHTML).toContain('Alice');
      expect(assigneeSelect.innerHTML).toContain('Bob');
    });

    it('shows cancel and save buttons in form', () => {
      render(<ReviewStage {...defaultProps} />);

      fireEvent.click(screen.getByText('Add Action'));

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('shows error when trying to add action without title', () => {
      render(<ReviewStage {...defaultProps} />);

      fireEvent.click(screen.getByText('Add Action'));
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(toast.error).toHaveBeenCalledWith('Please enter an action title');
    });

    it('adds action item and sends WebSocket message', () => {
      render(<ReviewStage {...defaultProps} ws={mockWs as unknown as WebSocket} setActionItems={mockSetActionItems} />);

      fireEvent.click(screen.getByText('Add Action'));

      const titleInput = screen.getByPlaceholderText('Action title...');
      fireEvent.change(titleInput, { target: { value: 'New action item' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(mockSetActionItems).toHaveBeenCalled();
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"action":"action-added"')
      );
      expect(toast.success).toHaveBeenCalledWith('Action item added');
    });

    it('cancels adding action when clicking Cancel', () => {
      render(<ReviewStage {...defaultProps} />);

      fireEvent.click(screen.getByText('Add Action'));
      expect(screen.getByPlaceholderText('Action title...')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Cancel'));

      expect(screen.queryByPlaceholderText('Action title...')).not.toBeInTheDocument();
    });

    it('sets priority correctly', () => {
      render(<ReviewStage {...defaultProps} ws={mockWs as unknown as WebSocket} setActionItems={mockSetActionItems} />);

      fireEvent.click(screen.getByText('Add Action'));

      const titleInput = screen.getByPlaceholderText('Action title...');
      fireEvent.change(titleInput, { target: { value: 'High priority task' } });

      const prioritySelect = screen.getByTitle('Priority');
      fireEvent.change(prioritySelect, { target: { value: 'high' } });

      fireEvent.click(screen.getByText('Save'));

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"priority":"high"')
      );
    });

    it('sets assignee correctly', () => {
      render(<ReviewStage {...defaultProps} ws={mockWs as unknown as WebSocket} setActionItems={mockSetActionItems} />);

      fireEvent.click(screen.getByText('Add Action'));

      const titleInput = screen.getByPlaceholderText('Action title...');
      fireEvent.change(titleInput, { target: { value: 'Assigned task' } });

      const assigneeSelect = screen.getByTitle('Assignee');
      fireEvent.change(assigneeSelect, { target: { value: 'user2' } });

      fireEvent.click(screen.getByText('Save'));

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"assigneeId":"user2"')
      );
    });
  });

  describe('Editing Action Items', () => {
    it('shows edit button for action items', () => {
      render(<ReviewStage {...defaultProps} />);

      const editButtons = screen.getAllByTitle('Edit');
      expect(editButtons.length).toBe(2); // One for each action item
    });

    it('opens edit form when clicking edit button', () => {
      render(<ReviewStage {...defaultProps} />);

      const editButtons = screen.getAllByTitle('Edit');
      fireEvent.click(editButtons[0]);

      // Should show save button in the form
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('updates action item when saving edit', () => {
      render(<ReviewStage {...defaultProps} ws={mockWs as unknown as WebSocket} setActionItems={mockSetActionItems} />);

      const editButtons = screen.getAllByTitle('Edit');
      fireEvent.click(editButtons[0]);

      // Click save
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(mockSetActionItems).toHaveBeenCalled();
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"action":"action-updated"')
      );
      expect(toast.success).toHaveBeenCalledWith('Action item updated');
    });
  });

  describe('Deleting Action Items', () => {
    it('shows delete button for action items', () => {
      render(<ReviewStage {...defaultProps} />);

      const deleteButtons = screen.getAllByTitle('Delete');
      expect(deleteButtons.length).toBe(2); // One for each action item
    });

    it('deletes action item and sends WebSocket message', () => {
      render(<ReviewStage {...defaultProps} ws={mockWs as unknown as WebSocket} setActionItems={mockSetActionItems} />);

      const deleteButtons = screen.getAllByTitle('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(mockSetActionItems).toHaveBeenCalled();
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"action":"action-deleted"')
      );
      expect(toast.success).toHaveBeenCalledWith('Action item deleted');
    });
  });

  describe('Status Icons', () => {
    it('shows action items with different statuses', () => {
      render(<ReviewStage {...defaultProps} />);

      expect(screen.getByText('Fix critical bugs')).toBeInTheDocument();
      expect(screen.getByText('Review process')).toBeInTheDocument();
    });
  });

  describe('WebSocket Handling', () => {
    it('handles ws being null gracefully when adding action', () => {
      render(<ReviewStage {...defaultProps} ws={null} setActionItems={mockSetActionItems} />);

      fireEvent.click(screen.getByText('Add Action'));

      const titleInput = screen.getByPlaceholderText('Action title...');
      fireEvent.change(titleInput, { target: { value: 'New action' } });

      fireEvent.click(screen.getByText('Save'));

      // Should still update local state
      expect(mockSetActionItems).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Action item added');
    });

    it('handles ws being null gracefully when deleting action', () => {
      render(<ReviewStage {...defaultProps} ws={null} setActionItems={mockSetActionItems} />);

      const deleteButtons = screen.getAllByTitle('Delete');
      fireEvent.click(deleteButtons[0]);

      // Should still update local state
      expect(mockSetActionItems).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Action item deleted');
    });

    it('handles closed WebSocket gracefully', () => {
      const closedWs = {
        send: vi.fn(),
        readyState: WebSocket.CLOSED,
      };
      render(<ReviewStage {...defaultProps} ws={closedWs as unknown as WebSocket} setActionItems={mockSetActionItems} />);

      fireEvent.click(screen.getByText('Add Action'));

      const titleInput = screen.getByPlaceholderText('Action title...');
      fireEvent.change(titleInput, { target: { value: 'New action' } });

      fireEvent.click(screen.getByText('Save'));

      // Should update local state but not send message
      expect(mockSetActionItems).toHaveBeenCalled();
      expect(closedWs.send).not.toHaveBeenCalled();
    });
  });

  describe('Team Participation Section', () => {
    it('renders team participation with participant names', () => {
      render(<ReviewStage {...defaultProps} />);

      expect(screen.getByText('Team Participation')).toBeInTheDocument();
      expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty data gracefully', () => {
      render(<ReviewStage {...defaultProps} participants={[]} cards={[]} votes={{}} />);

      expect(screen.getByText('Review & Actions')).toBeInTheDocument();
      expect(screen.getByText('0 Cards')).toBeInTheDocument();
      expect(screen.getByText('0 Votes')).toBeInTheDocument();
    });

    it('handles action item with missing assignee', () => {
      const actionWithNoAssignee: ActionItem = {
        id: 'action3',
        title: 'Unassigned task',
        description: '',
        assigneeId: '',
        priority: 'low',
        dueDate: '',
        status: 'pending',
      };
      render(<ReviewStage {...defaultProps} actionItems={[actionWithNoAssignee]} />);

      expect(screen.getByText('Unassigned task')).toBeInTheDocument();
    });
  });



  describe('Action Item Editing', () => {
    it('shows edit form with prefilled values and can cancel', () => {
      render(<ReviewStage {...defaultProps} setActionItems={mockSetActionItems} />);

      const editButtons = screen.getAllByTitle('Edit');
      fireEvent.click(editButtons[0]);

      // Should show the title in an input
      expect(screen.getByDisplayValue('Fix critical bugs')).toBeInTheDocument();

      // Cancel edit
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByDisplayValue('Fix critical bugs')).not.toBeInTheDocument();
    });

    it('saves edited action item with all field changes', () => {
      render(<ReviewStage {...defaultProps} ws={mockWs as unknown as WebSocket} setActionItems={mockSetActionItems} />);

      const editButtons = screen.getAllByTitle('Edit');
      fireEvent.click(editButtons[0]);

      // Change multiple fields
      const titleInput = screen.getByDisplayValue('Fix critical bugs');
      fireEvent.change(titleInput, { target: { value: 'Updated title' } });

      const descriptionTextarea = screen.getByPlaceholderText('Description (optional)...');
      fireEvent.change(descriptionTextarea, { target: { value: 'New description' } });

      const prioritySelect = screen.getByTitle('Priority');
      fireEvent.change(prioritySelect, { target: { value: 'low' } });

      const statusSelect = screen.getByTitle('Status');
      fireEvent.change(statusSelect, { target: { value: 'in_progress' } });

      // Save
      fireEvent.click(screen.getByText('Save'));

      expect(mockSetActionItems).toHaveBeenCalled();
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"action":"action-updated"')
      );
    });
  });

  describe('Additional Features', () => {
    it('prefills form with content from top voted item', () => {
      render(<ReviewStage {...defaultProps} setActionItems={mockSetActionItems} />);

      const addButtons = screen.getAllByTitle('Create action from this item');
      fireEvent.click(addButtons[0]);

      const titleInput = screen.getByPlaceholderText('Action title...') as HTMLInputElement;
      expect(titleInput.value).toContain('Action for:');
    });

    it('renders completed action items', () => {
      const completedAction: ActionItem = {
        id: 'action-completed',
        title: 'Completed task',
        description: '',
        assigneeId: 'user1',
        priority: 'low',
        dueDate: '',
        status: 'completed',
      };
      render(<ReviewStage {...defaultProps} actionItems={[completedAction]} />);

      expect(screen.getByText('Completed task')).toBeInTheDocument();
    });
  });
});
