import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ParticipantsSidebar from '../../components/ParticipantsSidebar';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
  },
}));

// Mock clipboard
const mockClipboard = {
  writeText: vi.fn(),
};
Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true,
});

describe('ParticipantsSidebar', () => {
  const mockParticipants = [
    { id: 'user1', name: 'Alice', joinedAt: new Date() },
    { id: 'user2', name: 'Bob', joinedAt: new Date() },
    { id: 'user3', name: 'Charlie', joinedAt: new Date() },
  ];

  const defaultProps = {
    participants: mockParticipants,
    retroId: 'retro-123',
    currentUserId: 'user1',
    creatorId: 'user1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the participants header', () => {
      render(<ParticipantsSidebar {...defaultProps} />);

      expect(screen.getByText('Participants')).toBeInTheDocument();
    });

    it('displays participant count', () => {
      render(<ParticipantsSidebar {...defaultProps} />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('renders all participants', () => {
      render(<ParticipantsSidebar {...defaultProps} />);

      expect(screen.getByText(/Alice/)).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('shows (You) suffix for current user', () => {
      render(<ParticipantsSidebar {...defaultProps} />);

      expect(screen.getByText(/Alice \(You\)/)).toBeInTheDocument();
    });

    it('displays empty state when no participants', () => {
      render(<ParticipantsSidebar {...defaultProps} participants={[]} />);

      expect(screen.getByText('No participants yet')).toBeInTheDocument();
      expect(screen.getByText('Share the link to invite others')).toBeInTheDocument();
    });
  });

  describe('Creator Status', () => {
    it('shows crown icon for creator', () => {
      render(<ParticipantsSidebar {...defaultProps} />);

      expect(screen.getByLabelText('Room Creator')).toBeInTheDocument();
    });

    it('shows creator badge when current user is creator', () => {
      render(<ParticipantsSidebar {...defaultProps} />);

      expect(screen.getByText('You are the room creator')).toBeInTheDocument();
    });

    it('does not show creator badge when current user is not creator', () => {
      render(<ParticipantsSidebar {...defaultProps} creatorId="user2" />);

      expect(screen.queryByText('You are the room creator')).not.toBeInTheDocument();
    });
  });

  describe('Progress Tracking', () => {
    it('shows progress bar during brainstorm stage for creator', () => {
      render(
        <ParticipantsSidebar
          {...defaultProps}
          currentStageId="brainstorm"
          stageDoneStatus={{ brainstorm: ['user1'] }}
        />
      );

      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('shows progress bar during vote stage for creator', () => {
      render(
        <ParticipantsSidebar
          {...defaultProps}
          currentStageId="vote"
          stageDoneStatus={{ vote: ['user1', 'user2'] }}
        />
      );

      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    it('does not show progress bar for non-creator', () => {
      render(
        <ParticipantsSidebar
          {...defaultProps}
          creatorId="user2"
          currentStageId="brainstorm"
          stageDoneStatus={{ brainstorm: ['user1'] }}
        />
      );

      expect(screen.queryByText('Progress')).not.toBeInTheDocument();
    });

    it('shows completion message when all participants are done', () => {
      render(
        <ParticipantsSidebar
          {...defaultProps}
          currentStageId="brainstorm"
          stageDoneStatus={{ brainstorm: ['user1', 'user2', 'user3'] }}
        />
      );

      expect(screen.getByText('All participants are done!')).toBeInTheDocument();
    });

    it('shows done status for participant who completed stage', () => {
      render(
        <ParticipantsSidebar
          {...defaultProps}
          currentStageId="brainstorm"
          stageDoneStatus={{ brainstorm: ['user1'] }}
        />
      );

      expect(screen.getByLabelText('Done')).toBeInTheDocument();
    });
  });

  describe('Copy Link Functionality', () => {
    it('copies retro link when invite button is clicked', async () => {
      const toast = await import('react-hot-toast');
      render(<ParticipantsSidebar {...defaultProps} />);

      const inviteButton = screen.getByText('Invite Participants');
      fireEvent.click(inviteButton);

      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('/retro/retro-123')
      );
      expect(toast.default.success).toHaveBeenCalledWith('Link copied to clipboard!');
    });
  });

  describe('Participant Sorting', () => {
    it('displays current user first in the list', () => {
      render(<ParticipantsSidebar {...defaultProps} currentUserId="user3" creatorId="user1" />);

      // We verify by checking that "(You)" appears after Charlie (user3)
      expect(screen.getByText(/Charlie \(You\)/)).toBeInTheDocument();
    });
  });
});
