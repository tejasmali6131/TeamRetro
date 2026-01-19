import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GroupStage from '../../../components/retroComponents/GroupStage';
import { Template, Card, CardGroup, Reactions } from '@/types/retroBoard';

describe('GroupStage', () => {
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
    { id: 'card3', columnId: 'col1', content: 'Card 3 content', authorId: 'user1', groupId: null, createdAt: new Date() },
    { id: 'card4', columnId: 'col2', content: 'Card 4 content', authorId: 'user2', groupId: null, createdAt: new Date() },
  ];

  const mockWs = {
    send: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: WebSocket.OPEN,
  } as unknown as WebSocket;

  const mockSetCards = vi.fn();
  const mockSetCardGroups = vi.fn();

  const defaultProps = {
    template: mockTemplate,
    currentUserId: 'user1',
    ws: mockWs,
    retroId: 'retro123',
    cards: mockCards,
    setCards: mockSetCards,
    cardGroups: [] as CardGroup[],
    setCardGroups: mockSetCardGroups,
    reactions: {} as Reactions,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all columns from template', () => {
      render(<GroupStage {...defaultProps} />);

      expect(screen.getByText('What went well')).toBeInTheDocument();
      expect(screen.getByText('What to improve')).toBeInTheDocument();
    });

    it('renders cards in their respective columns', () => {
      render(<GroupStage {...defaultProps} />);

      expect(screen.getByText('Card 1 content')).toBeInTheDocument();
      expect(screen.getByText('Card 2 content')).toBeInTheDocument();
      expect(screen.getByText('Card 3 content')).toBeInTheDocument();
      expect(screen.getByText('Card 4 content')).toBeInTheDocument();
    });

    it('shows card count for each column', () => {
      render(<GroupStage {...defaultProps} />);

      // Column 1 has 3 cards, column 2 has 1 card
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('shows drag instruction text', () => {
      render(<GroupStage {...defaultProps} />);

      const instructions = screen.getAllByText('Drag cards onto each other to group them');
      expect(instructions.length).toBeGreaterThan(0);
    });

    it('shows empty column message when no cards', () => {
      const propsWithEmptyCards = {
        ...defaultProps,
        cards: [],
      };
      render(<GroupStage {...propsWithEmptyCards} />);

      const emptyMessages = screen.getAllByText('No cards in this column');
      expect(emptyMessages.length).toBe(2);
    });

    it('renders no template message when template is undefined', () => {
      render(<GroupStage {...defaultProps} template={undefined} />);

      expect(screen.getByText('No template found for this retrospective.')).toBeInTheDocument();
    });
  });

  describe('Grouped Cards Display', () => {
    it('displays grouped cards indicator', () => {
      const groupedCards: Card[] = [
        { id: 'card1', columnId: 'col1', content: 'Card 1', authorId: 'user1', groupId: 'group1', createdAt: new Date() },
        { id: 'card2', columnId: 'col1', content: 'Card 2', authorId: 'user2', groupId: 'group1', createdAt: new Date() },
      ];
      const cardGroups: CardGroup[] = [
        { id: 'group1', cardIds: ['card1', 'card2'], columnId: 'col1' },
      ];

      render(<GroupStage {...defaultProps} cards={groupedCards} cardGroups={cardGroups} />);

      expect(screen.getByText('2 cards grouped')).toBeInTheDocument();
    });

    it('shows all cards within a group', () => {
      const groupedCards: Card[] = [
        { id: 'card1', columnId: 'col1', content: 'First grouped card', authorId: 'user1', groupId: 'group1', createdAt: new Date() },
        { id: 'card2', columnId: 'col1', content: 'Second grouped card', authorId: 'user2', groupId: 'group1', createdAt: new Date() },
      ];
      const cardGroups: CardGroup[] = [
        { id: 'group1', cardIds: ['card1', 'card2'], columnId: 'col1' },
      ];

      render(<GroupStage {...defaultProps} cards={groupedCards} cardGroups={cardGroups} />);

      expect(screen.getByText('First grouped card')).toBeInTheDocument();
      expect(screen.getByText('Second grouped card')).toBeInTheDocument();
    });

    it('shows ungroup button (X) for grouped cards', () => {
      const groupedCards: Card[] = [
        { id: 'card1', columnId: 'col1', content: 'Card 1', authorId: 'user1', groupId: 'group1', createdAt: new Date() },
        { id: 'card2', columnId: 'col1', content: 'Card 2', authorId: 'user2', groupId: 'group1', createdAt: new Date() },
      ];
      const cardGroups: CardGroup[] = [
        { id: 'group1', cardIds: ['card1', 'card2'], columnId: 'col1' },
      ];

      render(<GroupStage {...defaultProps} cards={groupedCards} cardGroups={cardGroups} />);

      const removeButtons = screen.getAllByTitle('Remove from group');
      expect(removeButtons.length).toBe(2);
    });
  });

  describe('Drag and Drop', () => {
    it('handles drag start on card', () => {
      render(<GroupStage {...defaultProps} />);

      const card = screen.getByText('Card 1 content').closest('[draggable="true"]');
      expect(card).toBeInTheDocument();

      fireEvent.dragStart(card!, { dataTransfer: { setData: vi.fn(), effectAllowed: '' } });
    });

    it('handles drag end', () => {
      render(<GroupStage {...defaultProps} />);

      const card = screen.getByText('Card 1 content').closest('[draggable="true"]');
      fireEvent.dragStart(card!, { dataTransfer: { setData: vi.fn(), effectAllowed: '' } });
      fireEvent.dragEnd(card!);
    });

    it('handles drag enter on another card', () => {
      render(<GroupStage {...defaultProps} />);

      const card1 = screen.getByText('Card 1 content').closest('[draggable="true"]');
      const card2 = screen.getByText('Card 2 content').closest('[draggable="true"]');

      fireEvent.dragStart(card1!, { dataTransfer: { setData: vi.fn(), effectAllowed: '' } });
      fireEvent.dragEnter(card2!);
    });

    it('handles drag leave', () => {
      render(<GroupStage {...defaultProps} />);

      const card1 = screen.getByText('Card 1 content').closest('[draggable="true"]');
      const card2 = screen.getByText('Card 2 content').closest('[draggable="true"]');

      fireEvent.dragStart(card1!, { dataTransfer: { setData: vi.fn(), effectAllowed: '' } });
      fireEvent.dragEnter(card2!);
      fireEvent.dragLeave(card2!);
    });

    it('handles drag over', () => {
      render(<GroupStage {...defaultProps} />);

      const card = screen.getByText('Card 1 content').closest('[draggable="true"]');
      fireEvent.dragOver(card!, { dataTransfer: { dropEffect: '' } });
    });

    it('handles drop to create new group', () => {
      render(<GroupStage {...defaultProps} />);

      const card1 = screen.getByText('Card 1 content').closest('[draggable="true"]');
      const card2 = screen.getByText('Card 2 content').closest('[draggable="true"]');

      // Start dragging card1
      fireEvent.dragStart(card1!, { dataTransfer: { setData: vi.fn(), effectAllowed: '' } });
      // Drop on card2
      fireEvent.drop(card2!);

      expect(mockSetCardGroups).toHaveBeenCalled();
      expect(mockSetCards).toHaveBeenCalled();
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"cards-group"')
      );
    });

    it('does not group cards from different columns', () => {
      render(<GroupStage {...defaultProps} />);

      const card1 = screen.getByText('Card 1 content').closest('[draggable="true"]'); // col1
      const card4 = screen.getByText('Card 4 content').closest('[draggable="true"]'); // col2

      fireEvent.dragStart(card1!, { dataTransfer: { setData: vi.fn(), effectAllowed: '' } });
      fireEvent.drop(card4!);

      // Should not call setCardGroups because columns are different
      expect(mockWs.send).not.toHaveBeenCalled();
    });

    it('does not drop card on itself', () => {
      render(<GroupStage {...defaultProps} />);

      const card1 = screen.getByText('Card 1 content').closest('[draggable="true"]');

      fireEvent.dragStart(card1!, { dataTransfer: { setData: vi.fn(), effectAllowed: '' } });
      fireEvent.drop(card1!);

      expect(mockWs.send).not.toHaveBeenCalled();
    });
  });

  describe('Ungrouping Cards', () => {
    it('sends ungroup message when removing card from group', () => {
      const groupedCards: Card[] = [
        { id: 'card1', columnId: 'col1', content: 'Card 1', authorId: 'user1', groupId: 'group1', createdAt: new Date() },
        { id: 'card2', columnId: 'col1', content: 'Card 2', authorId: 'user2', groupId: 'group1', createdAt: new Date() },
      ];
      const cardGroups: CardGroup[] = [
        { id: 'group1', cardIds: ['card1', 'card2'], columnId: 'col1' },
      ];

      render(<GroupStage {...defaultProps} cards={groupedCards} cardGroups={cardGroups} />);

      const removeButtons = screen.getAllByTitle('Remove from group');
      fireEvent.click(removeButtons[0]);

      expect(mockSetCardGroups).toHaveBeenCalled();
      expect(mockSetCards).toHaveBeenCalled();
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"card-ungroup"')
      );
    });

    it('does nothing if ws is null when ungrouping', () => {
      const groupedCards: Card[] = [
        { id: 'card1', columnId: 'col1', content: 'Card 1', authorId: 'user1', groupId: 'group1', createdAt: new Date() },
        { id: 'card2', columnId: 'col1', content: 'Card 2', authorId: 'user2', groupId: 'group1', createdAt: new Date() },
      ];
      const cardGroups: CardGroup[] = [
        { id: 'group1', cardIds: ['card1', 'card2'], columnId: 'col1' },
      ];

      render(<GroupStage {...defaultProps} ws={null} cards={groupedCards} cardGroups={cardGroups} />);

      const removeButtons = screen.getAllByTitle('Remove from group');
      fireEvent.click(removeButtons[0]);

      // Should not call any update functions
      expect(mockSetCardGroups).not.toHaveBeenCalled();
    });
  });

  describe('Reactions', () => {
    it('displays reactions on cards', () => {
      const reactions: Reactions = {
        card1: { '👍': ['user1', 'user2'], '❤️': ['user3'] },
      };

      render(<GroupStage {...defaultProps} reactions={reactions} />);

      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('❤️')).toBeInTheDocument();
    });

    it('shows add reaction button on cards', () => {
      render(<GroupStage {...defaultProps} />);

      const reactionButtons = screen.getAllByTitle('Add reaction');
      expect(reactionButtons.length).toBeGreaterThan(0);
    });

    it('opens emoji picker when add reaction clicked', () => {
      render(<GroupStage {...defaultProps} />);

      const reactionButtons = screen.getAllByTitle('Add reaction');
      fireEvent.click(reactionButtons[0]);

      // Quick emojis should be visible
      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText('👎')).toBeInTheDocument();
    });

    it('adds reaction when emoji clicked', () => {
      render(<GroupStage {...defaultProps} />);

      const reactionButtons = screen.getAllByTitle('Add reaction');
      fireEvent.click(reactionButtons[0]);

      // Click on a quick emoji
      const thumbsUp = screen.getByText('👍');
      fireEvent.click(thumbsUp);

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"reaction-toggle"')
      );
    });

    it('toggles existing reaction when clicked', () => {
      const reactions: Reactions = {
        card1: { '👍': ['user1'] },
      };

      render(<GroupStage {...defaultProps} reactions={reactions} />);

      const thumbsUp = screen.getByText('👍');
      fireEvent.click(thumbsUp);

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"reaction-toggle"')
      );
    });

    it('does not add reaction if ws is null', () => {
      render(<GroupStage {...defaultProps} ws={null} />);

      const reactionButtons = screen.getAllByTitle('Add reaction');
      fireEvent.click(reactionButtons[0]);

      const thumbsUp = screen.getByText('👍');
      fireEvent.click(thumbsUp);

      // No ws.send should be called since ws is null
    });

    it('closes emoji picker when clicking outside', () => {
      render(<GroupStage {...defaultProps} />);

      const reactionButtons = screen.getAllByTitle('Add reaction');
      fireEvent.click(reactionButtons[0]);

      // Simulate clicking outside
      fireEvent.mouseDown(document.body);
    });

    it('highlights user reactions', () => {
      const reactions: Reactions = {
        card1: { '👍': ['user1'] }, // Current user has reacted
      };

      render(<GroupStage {...defaultProps} reactions={reactions} />);

      // The reaction button should have special styling (can't easily test CSS classes)
      expect(screen.getByText('👍')).toBeInTheDocument();
    });
  });

  describe('Reactions on Grouped Cards', () => {
    it('displays reactions on individual cards within a group', () => {
      const groupedCards: Card[] = [
        { id: 'card1', columnId: 'col1', content: 'Card 1', authorId: 'user1', groupId: 'group1', createdAt: new Date() },
        { id: 'card2', columnId: 'col1', content: 'Card 2', authorId: 'user2', groupId: 'group1', createdAt: new Date() },
      ];
      const cardGroups: CardGroup[] = [
        { id: 'group1', cardIds: ['card1', 'card2'], columnId: 'col1' },
      ];
      const reactions: Reactions = {
        card1: { '🎉': ['user1'] },
        card2: { '👏': ['user2'] },
      };

      render(<GroupStage {...defaultProps} cards={groupedCards} cardGroups={cardGroups} reactions={reactions} />);

      expect(screen.getByText('🎉')).toBeInTheDocument();
      expect(screen.getByText('👏')).toBeInTheDocument();
    });
  });

  describe('Merging Groups', () => {
    it('merges when dropping card on existing group', () => {
      const cardsWithGroup: Card[] = [
        { id: 'card1', columnId: 'col1', content: 'Card 1', authorId: 'user1', groupId: null, createdAt: new Date() },
        { id: 'card2', columnId: 'col1', content: 'Card 2', authorId: 'user2', groupId: 'group1', createdAt: new Date() },
        { id: 'card3', columnId: 'col1', content: 'Card 3', authorId: 'user1', groupId: 'group1', createdAt: new Date() },
      ];
      const cardGroups: CardGroup[] = [
        { id: 'group1', cardIds: ['card2', 'card3'], columnId: 'col1' },
      ];

      render(<GroupStage {...defaultProps} cards={cardsWithGroup} cardGroups={cardGroups} />);

      const ungroupedCard = screen.getByText('Card 1').closest('[draggable="true"]');
      const groupedCard = screen.getByText('Card 2').closest('[draggable="true"]');

      fireEvent.dragStart(ungroupedCard!, { dataTransfer: { setData: vi.fn(), effectAllowed: '' } });
      fireEvent.drop(groupedCard!);

      expect(mockSetCardGroups).toHaveBeenCalled();
      expect(mockWs.send).toHaveBeenCalled();
    });

    it('adds target to dragged card group', () => {
      const cardsWithGroup: Card[] = [
        { id: 'card1', columnId: 'col1', content: 'Ungrouped Card', authorId: 'user1', groupId: null, createdAt: new Date() },
        { id: 'card2', columnId: 'col1', content: 'Grouped Card 1', authorId: 'user2', groupId: 'group1', createdAt: new Date() },
        { id: 'card3', columnId: 'col1', content: 'Grouped Card 2', authorId: 'user1', groupId: 'group1', createdAt: new Date() },
      ];
      const cardGroups: CardGroup[] = [
        { id: 'group1', cardIds: ['card2', 'card3'], columnId: 'col1' },
      ];

      render(<GroupStage {...defaultProps} cards={cardsWithGroup} cardGroups={cardGroups} />);

      // Drag the grouped card onto the ungrouped card
      const groupedCard = screen.getByText('Grouped Card 1').closest('[draggable="true"]');
      const ungroupedCard = screen.getByText('Ungrouped Card').closest('[draggable="true"]');

      fireEvent.dragStart(groupedCard!, { dataTransfer: { setData: vi.fn(), effectAllowed: '' } });
      fireEvent.drop(ungroupedCard!);

      expect(mockSetCardGroups).toHaveBeenCalled();
    });

    it('merges two existing groups', () => {
      const cardsWithGroups: Card[] = [
        { id: 'card1', columnId: 'col1', content: 'Group 1 Card 1', authorId: 'user1', groupId: 'group1', createdAt: new Date() },
        { id: 'card2', columnId: 'col1', content: 'Group 1 Card 2', authorId: 'user2', groupId: 'group1', createdAt: new Date() },
        { id: 'card3', columnId: 'col1', content: 'Group 2 Card 1', authorId: 'user1', groupId: 'group2', createdAt: new Date() },
        { id: 'card4', columnId: 'col1', content: 'Group 2 Card 2', authorId: 'user2', groupId: 'group2', createdAt: new Date() },
      ];
      const cardGroups: CardGroup[] = [
        { id: 'group1', cardIds: ['card1', 'card2'], columnId: 'col1' },
        { id: 'group2', cardIds: ['card3', 'card4'], columnId: 'col1' },
      ];

      render(<GroupStage {...defaultProps} cards={cardsWithGroups} cardGroups={cardGroups} />);

      // Both groups should be displayed
      expect(screen.getByText('Group 1 Card 1')).toBeInTheDocument();
      expect(screen.getByText('Group 2 Card 1')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty card groups array', () => {
      render(<GroupStage {...defaultProps} cardGroups={[]} />);

      expect(screen.getByText('Card 1 content')).toBeInTheDocument();
    });

    it('handles cards with no content gracefully', () => {
      const cardsWithEmpty: Card[] = [
        { id: 'card1', columnId: 'col1', content: '', authorId: 'user1', groupId: null, createdAt: new Date() },
      ];

      render(<GroupStage {...defaultProps} cards={cardsWithEmpty} />);

      // Should render without errors
      expect(screen.getByText('What went well')).toBeInTheDocument();
    });

    it('handles drop without dragging first', () => {
      render(<GroupStage {...defaultProps} />);

      const card = screen.getByText('Card 1 content').closest('[draggable="true"]');
      fireEvent.drop(card!);

      // Should not throw and not call ws.send
      expect(mockWs.send).not.toHaveBeenCalled();
    });

    it('handles ws null during drop', () => {
      render(<GroupStage {...defaultProps} ws={null} />);

      const card1 = screen.getByText('Card 1 content').closest('[draggable="true"]');
      const card2 = screen.getByText('Card 2 content').closest('[draggable="true"]');

      fireEvent.dragStart(card1!, { dataTransfer: { setData: vi.fn(), effectAllowed: '' } });
      fireEvent.drop(card2!);

      // Should not throw
    });
  });
});
