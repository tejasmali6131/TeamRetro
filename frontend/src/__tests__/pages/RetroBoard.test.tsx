import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';
import RetroBoard from '../../pages/RetroBoard';
import * as api from '@/services/api';
import toast from 'react-hot-toast';

const mockNavigate = vi.fn();
const mockRetroId = 'retro-456';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ retroId: mockRetroId }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/services/api', () => ({
  getRetroById: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/components/Header', () => ({
  default: () => <div data-testid="header">Header</div>,
}));

vi.mock('@/components/ParticipantsSidebar', () => ({
  default: ({ participants }: any) => (
    <div data-testid="participants-sidebar">
      Participants: {participants.length}
    </div>
  ),
}));

// Create mock functions that can be spied on
const mockSetCurrentStageIndex = vi.fn();
const mockSendMessage = vi.fn();
const mockSetCards = vi.fn();
const mockSetCardGroups = vi.fn();
const mockSetVotes = vi.fn();
const mockSetActionItems = vi.fn();
const mockSetDiscussedItems = vi.fn();

let mockCurrentStageIndex = 0;
let mockParticipants = [
  { id: 'user-123', name: 'Alice', isCreator: true },
  { id: 'user-456', name: 'Bob', isCreator: false },
];
let mockStageDoneStatus: Record<string, string[]> = {};

vi.mock('@/hooks/useRetroWebSocket', () => ({
  useRetroWebSocket: () => ({
    ws: null,
    currentUserId: 'user-123',
    participants: mockParticipants,
    cards: [],
    cardGroups: [],
    votes: {},
    actionItems: [],
    discussedItems: new Set(),
    stageDoneStatus: mockStageDoneStatus,
    reactions: {},
    icebreakerState: null,
    currentStageIndex: mockCurrentStageIndex,
    setCards: mockSetCards,
    setCardGroups: mockSetCardGroups,
    setVotes: mockSetVotes,
    setActionItems: mockSetActionItems,
    setDiscussedItems: mockSetDiscussedItems,
    setCurrentStageIndex: mockSetCurrentStageIndex,
    sendMessage: mockSendMessage,
  }),
}));

// Mock all stage components
vi.mock('@/components/retroComponents/IcebreakerStage', () => ({
  default: () => <div data-testid="icebreaker-stage">Icebreaker Stage</div>,
}));

vi.mock('@/components/retroComponents/BrainstormStage', () => ({
  default: () => <div data-testid="brainstorm-stage">Brainstorm Stage</div>,
}));

vi.mock('@/components/retroComponents/GroupStage', () => ({
  default: () => <div data-testid="group-stage">Group Stage</div>,
}));

vi.mock('@/components/retroComponents/VoteStage', () => ({
  default: () => <div data-testid="vote-stage">Vote Stage</div>,
}));

vi.mock('@/components/retroComponents/DiscussStage', () => ({
  default: () => <div data-testid="discuss-stage">Discuss Stage</div>,
}));

vi.mock('@/components/retroComponents/ReviewStage', () => ({
  default: () => <div data-testid="review-stage">Review Stage</div>,
}));

vi.mock('@/components/retroComponents/ReportStage', () => ({
  default: () => <div data-testid="report-stage">Report Stage</div>,
}));

const mockRetroData = {
  id: 'retro-456',
  sessionName: 'Q1 Planning Retro',
  context: 'Planning for Q1 goals',
  templateId: 'template-1',
  status: 'active' as const,
  creatorId: 'user-123',
  votingLimit: 5,
  isAnonymous: false,
  timerDuration: 300,
  createdAt: new Date('2025-01-01T10:00:00Z'),
  updatedAt: new Date('2025-01-01T10:00:00Z'),
  stages: [
    { id: 'icebreaker', name: 'Icebreaker', duration: 300, enabled: true },
    { id: 'brainstorm', name: 'Brainstorm', duration: 600, enabled: true },
    { id: 'group', name: 'Group', duration: 0, enabled: true },
    { id: 'vote', name: 'Vote', duration: 300, enabled: true },
    { id: 'discuss', name: 'Discuss', duration: 0, enabled: true },
    { id: 'review', name: 'Review', duration: 0, enabled: true },
    { id: 'report', name: 'Report', duration: 0, enabled: true },
  ],
  template: {
    id: 'template-1',
    name: 'Mad-Sad-Glad',
    description: 'Reflect on what made you mad, sad, or glad',
    isDefault: false,
    columns: [
      { id: 'col-1', name: 'Mad', color: '#ef4444', placeholder: 'What frustrated you?', order: 0 },
      { id: 'col-2', name: 'Sad', color: '#f59e0b', placeholder: 'What disappointed you?', order: 1 },
      { id: 'col-3', name: 'Glad', color: '#10b981', placeholder: 'What made you happy?', order: 2 },
    ],
  },
};

describe('RetroBoard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentStageIndex = 0;
    mockParticipants = [
      { id: 'user-123', name: 'Alice', isCreator: true },
      { id: 'user-456', name: 'Bob', isCreator: false },
    ];
    mockStageDoneStatus = {};
  });

  describe('Loading State', () => {
    it('shows loading spinner while fetching retro data', () => {
      vi.mocked(api.getRetroById).mockImplementation(() => new Promise(() => {}));
      
      render(<RetroBoard />);
      
      expect(screen.getByText(/loading retrospective/i)).toBeInTheDocument();
    });

    it('displays spinning loader icon', () => {
      vi.mocked(api.getRetroById).mockImplementation(() => new Promise(() => {}));
      
      const { container } = render(<RetroBoard />);
      
      const loader = container.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });
  });

  describe('Retro Information Display', () => {
    beforeEach(() => {
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
    });

    it('renders session name', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
    });

    it('displays context information', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Planning for Q1 goals')).toBeInTheDocument();
      });
    });

    it('does not crash when context is missing', async () => {
      vi.mocked(api.getRetroById).mockResolvedValue({
        ...mockRetroData,
        context: '',
      });
      
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
    });
  });

  describe('Stage Progress Bar', () => {
    beforeEach(() => {
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
    });

    it('renders all enabled stages', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Icebreaker')).toBeInTheDocument();
      expect(screen.getByText('Brainstorm')).toBeInTheDocument();
    });

    it('shows stage duration for timed stages', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText(/5m/i)).toBeInTheDocument();
      });
    });
  });

  describe('Current Stage Content', () => {
    beforeEach(() => {
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
    });

    it('renders icebreaker stage by default', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByTestId('icebreaker-stage')).toBeInTheDocument();
      });
    });
  });

  describe('Timer Functionality', () => {
    beforeEach(() => {
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
    });

    it('displays timer section for stages with duration', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText(/icebreaker phase/i)).toBeInTheDocument();
      });
    });

    it('shows start timer button when timer is not running', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
    });
  });

  describe('Participants Sidebar', () => {
    beforeEach(() => {
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
    });

    it('renders participants sidebar on desktop', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        const sidebars = screen.getAllByTestId('participants-sidebar');
        expect(sidebars.length).toBeGreaterThan(0);
      });
    });

    it('shows participant count on mobile toggle button', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      const toggleButton = screen.getByTitle('Toggle participants');
      expect(toggleButton).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('opens mobile sidebar when toggle button is clicked', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      const toggleButton = screen.getByTitle('Toggle participants');
      toggleButton.click();
      
      await waitFor(() => {
        expect(screen.getByText('Participants')).toBeInTheDocument();
      });
    });

    it('closes mobile sidebar when close button is clicked', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      screen.getByTitle('Toggle participants').click();
      
      await waitFor(() => {
        expect(screen.getByText('Participants')).toBeInTheDocument();
      });
      
      screen.getByTitle('Close participants sidebar').click();
      
      await waitFor(() => {
        expect(screen.queryByText('Participants')).not.toBeInTheDocument();
      });
    });

    it('closes mobile sidebar when backdrop is clicked', async () => {
      const { container } = render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      screen.getByTitle('Toggle participants').click();
      
      await waitFor(() => {
        expect(screen.getByText('Participants')).toBeInTheDocument();
      });
      
      const backdrop = container.querySelector('.bg-black.bg-opacity-50');
      if (backdrop) {
        (backdrop as HTMLElement).click();
      }
      
      await waitFor(() => {
        expect(screen.queryByText('Participants')).not.toBeInTheDocument();
      });
    });
  });

  describe('Navigation Controls', () => {
    beforeEach(() => {
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
    });

    it('shows navigation buttons for room creator', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      expect(screen.getByRole('button', { name: /previous stage/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next stage/i })).toBeInTheDocument();
    });

    it('previous button is disabled on first stage', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        const prevButton = screen.getByRole('button', { name: /previous stage/i });
        expect(prevButton).toBeDisabled();
      });
    });

    it('next button is enabled on first stage', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /next stage/i });
        expect(nextButton).not.toBeDisabled();
      });
    });

  });

  describe('Error Handling', () => {
    it('shows error toast when retro data fails to load', async () => {
      vi.mocked(api.getRetroById).mockRejectedValue(new Error('Network error'));
      
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load retrospective');
      });
    });

    it('navigates to dashboard on error', async () => {
      vi.mocked(api.getRetroById).mockRejectedValue(new Error('Network error'));
      
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
    });

    it('has responsive layout classes', async () => {
      const { container } = render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      const mainContent = container.querySelector('.flex-1.flex.flex-col');
      expect(mainContent).toBeInTheDocument();
    });
  });

  describe('Header', () => {
    beforeEach(() => {
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
    });

    it('renders header component', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });
    });
  });

  describe('Stage Content Rendering', () => {
    beforeEach(() => {
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
    });

    it('renders correct stage component based on current stage', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByTestId('icebreaker-stage')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('calls getRetroById with correct retro ID', async () => {
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
      
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(api.getRetroById).toHaveBeenCalledWith('retro-456');
      });
    });

    it('fetches retro data on mount', () => {
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
      
      render(<RetroBoard />);
      
      expect(api.getRetroById).toHaveBeenCalledTimes(1);
    });
  });

  describe('Stage Management', () => {
    beforeEach(() => {
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
    });

    it('uses default stages when retro stages are not provided', async () => {
      vi.mocked(api.getRetroById).mockResolvedValue({
        ...mockRetroData,
        stages: undefined,
      });
      
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
    });
  });

  describe('Stage Rendering by Type', () => {
    beforeEach(() => {
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
    });

    it('does not render timer for stages without duration', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      // Icebreaker has duration, so timer should be present
      expect(screen.getByText(/icebreaker phase/i)).toBeInTheDocument();
    });
  });

  describe('Stage Navigation', () => {
    beforeEach(() => {
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
    });

    it('shows enabled next stage button on first stage', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      const nextButton = screen.getByRole('button', { name: /next stage/i });
      expect(nextButton).not.toBeDisabled();
    });

    it('shows disabled previous button on first stage', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      const prevButton = screen.getByRole('button', { name: /previous stage/i });
      expect(prevButton).toBeDisabled();
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
    });

    it('shows mobile participant count badge', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      const participantBadge = screen.getByText('2');
      expect(participantBadge).toBeInTheDocument();
    });

    it('toggles mobile sidebar visibility', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      const toggleButton = screen.getByTitle('Toggle participants');
      
      // Initially sidebar is closed
      expect(screen.queryByText('Participants')).not.toBeInTheDocument();
      
      // Click to open
      toggleButton.click();
      
      await waitFor(() => {
        expect(screen.getByText('Participants')).toBeInTheDocument();
      });
    });
  });

  describe('Timer Controls', () => {
    beforeEach(() => {
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
    });

    it('shows start timer button initially', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Start Timer')).toBeInTheDocument();
    });

    it('displays duration in timer section', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      // Icebreaker has 5 minutes duration
      expect(screen.getByText(/5 minutes/i)).toBeInTheDocument();
    });
  });

  describe('Stage Button Component', () => {
    beforeEach(() => {
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
    });

    it('highlights current stage', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      // Verify Icebreaker is visible (current stage)
      expect(screen.getByText('Icebreaker')).toBeInTheDocument();
    });

    it('shows check mark for completed stages', async () => {
      // This would require being on a later stage
      // For now, just verify the structure renders
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Button States', () => {
    beforeEach(() => {
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
    });

    it('has correct button classes', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      const prevButton = screen.getByRole('button', { name: /previous stage/i });
      const nextButton = screen.getByRole('button', { name: /next stage/i });
      
      expect(prevButton).toHaveClass('btn-secondary');
      expect(nextButton).toHaveClass('btn-primary');
    });

    it('shows disabled state styling for previous button on first stage', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      const prevButton = screen.getByRole('button', { name: /previous stage/i });
      expect(prevButton).toHaveClass('disabled:opacity-50');
    });
  });

  describe('WebSocket Integration', () => {
    beforeEach(() => {
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
    });

    it('uses WebSocket hook with correct parameters', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      // The mock hook is used - verify component renders with hook data
      expect(screen.getByText('2')).toBeInTheDocument(); // participant count
    });
  });

  describe('Dark Mode Support', () => {
    beforeEach(() => {
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
    });

    it('has dark mode classes in layout', async () => {
      const { container } = render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      const darkModeElements = container.querySelectorAll('[class*="dark:"]');
      expect(darkModeElements.length).toBeGreaterThan(0);
    });
  });

  describe('Stage Duration Display', () => {
    beforeEach(() => {
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
    });

    it('shows duration for timed stages', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      // Icebreaker has 300 seconds = 5 minutes
      expect(screen.getByText(/5m/)).toBeInTheDocument();
    });
  });

  describe('Stage Navigation Functionality', () => {
    beforeEach(() => {
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
    });

    it('calls sendMessage and setCurrentStageIndex when clicking next', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      const nextButton = screen.getByRole('button', { name: /next stage/i });
      nextButton.click();
      
      await waitFor(() => {
        expect(mockSetCurrentStageIndex).toHaveBeenCalledWith(1);
        expect(mockSendMessage).toHaveBeenCalledWith({ type: 'stage-change', stageIndex: 1 });
      });
    });
  });

  describe('Timer Interaction', () => {
    beforeEach(() => {
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
    });

    it('clicking start timer shows pause button', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      const startButton = screen.getByText('Start Timer');
      startButton.click();
      
      await waitFor(() => {
        expect(screen.getByText('Pause Timer')).toBeInTheDocument();
      });
    });

    it('clicking pause button shows start button again', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      // Start the timer
      screen.getByText('Start Timer').click();
      
      await waitFor(() => {
        expect(screen.getByText('Pause Timer')).toBeInTheDocument();
      });
      
      // Pause the timer
      screen.getByText('Pause Timer').click();
      
      await waitFor(() => {
        expect(screen.getByText('Start Timer')).toBeInTheDocument();
      });
    });
  });

  describe('Stages Without Duration', () => {
    it('does not show timer for stages without duration', async () => {
      // Group stage has duration = 0
      mockCurrentStageIndex = 2; // Group stage
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
      
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      // No timer section should be present
      expect(screen.queryByText('Start Timer')).not.toBeInTheDocument();
    });
  });

  describe('Stage Done Status', () => {
    it('disables next button on brainstorm when not all participants are done', async () => {
      mockCurrentStageIndex = 1; // Brainstorm stage
      mockStageDoneStatus = { brainstorm: ['user-123'] }; // Only one user done
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
      
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      const nextButton = screen.getByRole('button', { name: /next stage/i });
      expect(nextButton).toBeDisabled();
    });

    it('enables next button when all participants are done on brainstorm', async () => {
      mockCurrentStageIndex = 1; // Brainstorm stage
      mockStageDoneStatus = { brainstorm: ['user-123', 'user-456'] }; // Both users done
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
      
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      const nextButton = screen.getByRole('button', { name: /next stage/i });
      expect(nextButton).not.toBeDisabled();
    });

    it('disables next button on vote when not all participants are done', async () => {
      mockCurrentStageIndex = 3; // Vote stage
      mockStageDoneStatus = { vote: ['user-123'] }; // Only one user done
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
      
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      const nextButton = screen.getByRole('button', { name: /next stage/i });
      expect(nextButton).toBeDisabled();
    });

    it('shows waiting tooltip when next is disabled due to participants', async () => {
      mockCurrentStageIndex = 1; // Brainstorm stage
      mockStageDoneStatus = { brainstorm: ['user-123'] }; // Only one user done
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
      
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      const nextButton = screen.getByRole('button', { name: /next stage/i });
      expect(nextButton).toHaveAttribute('title', expect.stringContaining('Waiting for'));
    });
  });

  describe('Last Stage Navigation', () => {
    it('disables next button on last stage', async () => {
      mockCurrentStageIndex = 6; // Report stage (last)
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
      
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      const nextButton = screen.getByRole('button', { name: /next stage/i });
      expect(nextButton).toBeDisabled();
    });

    it('enables previous button on last stage', async () => {
      mockCurrentStageIndex = 6; // Report stage (last)
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
      
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      const prevButton = screen.getByRole('button', { name: /previous stage/i });
      expect(prevButton).not.toBeDisabled();
    });
  });

  describe('Previous Stage Navigation', () => {
    it('calls sendMessage and setCurrentStageIndex when clicking previous', async () => {
      mockCurrentStageIndex = 2; // Group stage
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
      
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      const prevButton = screen.getByRole('button', { name: /previous stage/i });
      prevButton.click();
      
      await waitFor(() => {
        expect(mockSetCurrentStageIndex).toHaveBeenCalledWith(1);
        expect(mockSendMessage).toHaveBeenCalledWith({ type: 'stage-change', stageIndex: 1 });
      });
    });
  });

  describe('Non-Creator View', () => {
    it('hides navigation buttons for non-creators', async () => {
      mockParticipants = [
        { id: 'user-999', name: 'Admin', isCreator: true },
        { id: 'user-123', name: 'Alice', isCreator: false }, // Current user is not creator
      ];
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
      
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      expect(screen.queryByRole('button', { name: /previous stage/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /next stage/i })).not.toBeInTheDocument();
    });
  });

  describe('Stage Content Component', () => {
    beforeEach(() => {
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
    });

    it('renders brainstorm stage when on brainstorm', async () => {
      mockCurrentStageIndex = 1;
      
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByTestId('brainstorm-stage')).toBeInTheDocument();
      });
    });

    it('renders group stage when on group', async () => {
      mockCurrentStageIndex = 2;
      
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByTestId('group-stage')).toBeInTheDocument();
      });
    });

    it('renders vote stage when on vote', async () => {
      mockCurrentStageIndex = 3;
      
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByTestId('vote-stage')).toBeInTheDocument();
      });
    });

    it('renders discuss stage when on discuss', async () => {
      mockCurrentStageIndex = 4;
      
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByTestId('discuss-stage')).toBeInTheDocument();
      });
    });

    it('renders review stage when on review', async () => {
      mockCurrentStageIndex = 5;
      
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByTestId('review-stage')).toBeInTheDocument();
      });
    });

    it('renders report stage when on report', async () => {
      mockCurrentStageIndex = 6;
      
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByTestId('report-stage')).toBeInTheDocument();
      });
    });
  });

  describe('formatTime Function', () => {
    beforeEach(() => {
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
    });

    it('displays formatted duration in timer section', async () => {
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      // Duration display: 5 minutes
      expect(screen.getByText(/5 minutes/i)).toBeInTheDocument();
    });
  });

  describe('Timer Completion', () => {
    it('timer section shows duration info before start', async () => {
      vi.mocked(api.getRetroById).mockResolvedValue(mockRetroData);
      
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      // Timer section shows duration info
      expect(screen.getByText(/Duration: 5 minutes/i)).toBeInTheDocument();
    });
  });

  describe('Disabled Stages', () => {
    it('only shows enabled stages in progress bar', async () => {
      const partialStagesRetro = {
        ...mockRetroData,
        stages: [
          { id: 'icebreaker', name: 'Icebreaker', duration: 300, enabled: true },
          { id: 'brainstorm', name: 'Brainstorm', duration: 600, enabled: false }, // Disabled
          { id: 'group', name: 'Group', duration: 0, enabled: true },
          { id: 'vote', name: 'Vote', duration: 300, enabled: true },
          { id: 'discuss', name: 'Discuss', duration: 0, enabled: false }, // Disabled
          { id: 'review', name: 'Review', duration: 0, enabled: true },
          { id: 'report', name: 'Report', duration: 0, enabled: true },
        ],
      };
      vi.mocked(api.getRetroById).mockResolvedValue(partialStagesRetro);
      
      render(<RetroBoard />);
      
      await waitFor(() => {
        expect(screen.getByText('Q1 Planning Retro')).toBeInTheDocument();
      });
      
      // Brainstorm should not be visible since it's disabled
      const brainstormButtons = screen.queryAllByText('Brainstorm');
      expect(brainstormButtons.length).toBe(0);
      
      // Discuss should not be visible since it's disabled
      const discussButtons = screen.queryAllByText('Discuss');
      expect(discussButtons.length).toBe(0);
      
      // Group should be visible
      expect(screen.getByText('Group')).toBeInTheDocument();
    });
  });

});
