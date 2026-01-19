import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BrainstormStage from '../../../components/retroComponents/BrainstormStage';
import { Template, Card } from '@/types/retroBoard';

describe('BrainstormStage', () => {
  const mockTemplate: Template = {
    id: 'template1',
    name: 'Sprint Retrospective',
    columns: [
      { id: 'col1', name: 'What went well', color: '#22c55e', placeholder: 'Something positive...' },
      { id: 'col2', name: 'What could be improved', color: '#ef4444', placeholder: 'Something to improve...' },
      { id: 'col3', name: 'Action items', color: '#3b82f6', placeholder: 'An action...' },
    ],
  };

  const mockCards: Card[] = [
    { id: 'card1', columnId: 'col1', content: 'Great teamwork!', authorId: 'user1', groupId: null, createdAt: new Date() },
    { id: 'card2', columnId: 'col2', content: 'Need more testing', authorId: 'user2', groupId: null, createdAt: new Date() },
  ];

  const mockSetCards = vi.fn();

  const mockWs = {
    send: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: WebSocket.OPEN,
  } as unknown as WebSocket;

  const defaultProps = {
    template: mockTemplate,
    currentUserId: 'user1',
    ws: mockWs,
    retroId: 'retro-123',
    cards: mockCards,
    setCards: mockSetCards,
    stageId: 'brainstorm',
    isDone: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders columns, buttons, and card counts correctly', () => {
      render(<BrainstormStage {...defaultProps} />);

      expect(screen.getByText('What went well')).toBeInTheDocument();
      expect(screen.getByText('What could be improved')).toBeInTheDocument();
      expect(screen.getByText('Action items')).toBeInTheDocument();
      expect(screen.getAllByText('+ Add Card')).toHaveLength(3);
      expect(screen.getByText('Mark as Done')).toBeInTheDocument();
    });

    it('handles edge cases - empty state and no template', () => {
      // Empty cards state
      const { rerender } = render(<BrainstormStage {...defaultProps} cards={[]} />);
      expect(screen.getAllByText('No cards yet. Add your thoughts!')).toHaveLength(3);

      // No template
      rerender(<BrainstormStage {...defaultProps} template={undefined} />);
      expect(screen.getByText('No template found for this retrospective.')).toBeInTheDocument();
    });

    it('shows Done button when already done', () => {
      render(<BrainstormStage {...defaultProps} isDone={true} />);
      expect(screen.getByText('Done')).toBeInTheDocument();
    });
  });

  describe('Card Display', () => {
    it('shows card content for own cards', () => {
      render(<BrainstormStage {...defaultProps} />);

      expect(screen.getByText('Great teamwork!')).toBeInTheDocument();
    });

    it('hides card content for other users cards', () => {
      render(<BrainstormStage {...defaultProps} />);

      // Card from user2 should be hidden (EyeOff icon shown instead)
      expect(screen.queryByText('Need more testing')).not.toBeInTheDocument();
    });

    it('shows edit and delete buttons for own cards on hover', () => {
      render(<BrainstormStage {...defaultProps} />);

      // Own card should have edit/delete buttons (though hidden by CSS)
      expect(screen.getByTitle('Edit')).toBeInTheDocument();
      expect(screen.getByTitle('Delete')).toBeInTheDocument();
    });
  });

  describe('Adding Cards', () => {
    it('shows input form when Add Card clicked', () => {
      render(<BrainstormStage {...defaultProps} />);

      const addButtons = screen.getAllByText('+ Add Card');
      fireEvent.click(addButtons[0]);

      expect(screen.getByPlaceholderText('Something positive...')).toBeInTheDocument();
      expect(screen.getByText('Add')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('submits new card when Add clicked', () => {
      render(<BrainstormStage {...defaultProps} />);

      const addButtons = screen.getAllByText('+ Add Card');
      fireEvent.click(addButtons[0]);

      const textarea = screen.getByPlaceholderText('Something positive...');
      fireEvent.change(textarea, { target: { value: 'New card content' } });

      const submitButton = screen.getByText('Add');
      fireEvent.click(submitButton);

      expect(mockSetCards).toHaveBeenCalled();
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"card-create"')
      );
    });

    it('cancels adding card when Cancel clicked', () => {
      render(<BrainstormStage {...defaultProps} />);

      const addButtons = screen.getAllByText('+ Add Card');
      fireEvent.click(addButtons[0]);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(screen.queryByPlaceholderText('Something positive...')).not.toBeInTheDocument();
    });

    it('submits card on Enter key', () => {
      render(<BrainstormStage {...defaultProps} />);

      const addButtons = screen.getAllByText('+ Add Card');
      fireEvent.click(addButtons[0]);

      const textarea = screen.getByPlaceholderText('Something positive...');
      fireEvent.change(textarea, { target: { value: 'New card via enter' } });
      fireEvent.keyDown(textarea, { key: 'Enter' });

      expect(mockSetCards).toHaveBeenCalled();
    });

    it('cancels on Escape key', () => {
      render(<BrainstormStage {...defaultProps} />);

      const addButtons = screen.getAllByText('+ Add Card');
      fireEvent.click(addButtons[0]);

      const textarea = screen.getByPlaceholderText('Something positive...');
      fireEvent.keyDown(textarea, { key: 'Escape' });

      expect(screen.queryByPlaceholderText('Something positive...')).not.toBeInTheDocument();
    });

    it('disables Add button when input is empty', () => {
      render(<BrainstormStage {...defaultProps} />);

      const addButtons = screen.getAllByText('+ Add Card');
      fireEvent.click(addButtons[0]);

      const submitButton = screen.getByText('Add');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Editing Cards', () => {
    it('shows edit form, saves changes, and can cancel', () => {
      render(<BrainstormStage {...defaultProps} />);

      const editButton = screen.getByTitle('Edit');
      fireEvent.click(editButton);

      expect(screen.getByDisplayValue('Great teamwork!')).toBeInTheDocument();

      const textarea = screen.getByDisplayValue('Great teamwork!');
      fireEvent.change(textarea, { target: { value: 'Updated content' } });

      const saveButton = screen.getByTitle('Save');
      fireEvent.click(saveButton);

      expect(mockSetCards).toHaveBeenCalled();
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"card-update"')
      );
    });

    it('cancels edit and supports keyboard shortcuts', () => {
      render(<BrainstormStage {...defaultProps} />);

      const editButton = screen.getByTitle('Edit');
      fireEvent.click(editButton);

      // Cancel via button
      const cancelButton = screen.getByTitle('Cancel');
      fireEvent.click(cancelButton);
      expect(screen.getByText('Great teamwork!')).toBeInTheDocument();

      // Re-edit and cancel via Escape
      fireEvent.click(editButton);
      const textarea = screen.getByDisplayValue('Great teamwork!');
      fireEvent.keyDown(textarea, { key: 'Escape' });
      expect(screen.getByText('Great teamwork!')).toBeInTheDocument();
    });
  });

  describe('Deleting Cards', () => {
    it('deletes card when delete button clicked', () => {
      render(<BrainstormStage {...defaultProps} />);

      const deleteButton = screen.getByTitle('Delete');
      fireEvent.click(deleteButton);

      expect(mockSetCards).toHaveBeenCalled();
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"card-delete"')
      );
    });
  });

  describe('Done Status', () => {
    it('toggles done status and sends correct WebSocket messages', () => {
      // Test marking as done
      const { rerender } = render(<BrainstormStage {...defaultProps} isDone={false} />);

      const doneButton = screen.getByText('Mark as Done');
      fireEvent.click(doneButton);

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"isDone":true')
      );

      // Test unmarking done
      vi.clearAllMocks();
      rerender(<BrainstormStage {...defaultProps} isDone={true} />);

      const undoButton = screen.getByText('Done');
      fireEvent.click(undoButton);

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"isDone":false')
      );
    });

    it('handles ws being null gracefully', () => {
      render(<BrainstormStage {...defaultProps} ws={null} />);

      const doneButton = screen.getByText('Mark as Done');
      fireEvent.click(doneButton);

      expect(mockWs.send).not.toHaveBeenCalled();
    });
  });

  describe('WebSocket Null Handling', () => {
    it('handles ws null gracefully for card create', () => {
      render(<BrainstormStage {...defaultProps} ws={null} />);

      const addButtons = screen.getAllByText('+ Add Card');
      fireEvent.click(addButtons[0]);
      const textarea = screen.getByPlaceholderText('Something positive...');
      fireEvent.change(textarea, { target: { value: 'New card' } });
      const submitButton = screen.getByText('Add');
      fireEvent.click(submitButton);
      expect(mockWs.send).not.toHaveBeenCalled();
    });

    it('handles ws null gracefully for card update', () => {
      render(<BrainstormStage {...defaultProps} ws={null} />);

      const editButton = screen.getByTitle('Edit');
      fireEvent.click(editButton);
      const editTextarea = screen.getByDisplayValue('Great teamwork!');
      fireEvent.change(editTextarea, { target: { value: 'Updated' } });
      const saveButton = screen.getByTitle('Save');
      fireEvent.click(saveButton);
      expect(mockWs.send).not.toHaveBeenCalled();
    });
  });
});
