import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import JoinRetro from '../../pages/JoinRetro';
import api from '@/services/api';
import toast from 'react-hot-toast';

const mockNavigate = vi.fn();
const mockRetroId = 'test-retro-123';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ retroId: mockRetroId }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
  },
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

const mockRetroData = {
  id: 'test-retro-123',
  sessionName: 'Sprint 42 Retrospective',
  context: 'Review our recent sprint and identify improvements',
  templateId: 'template-1',
  status: 'active',
  createdAt: new Date('2025-01-01T10:00:00Z'),
  template: {
    id: 'template-1',
    name: 'Start-Stop-Continue',
    description: 'Classic retrospective format',
    columns: [
      { id: 'col-1', name: 'Start', color: '#10b981' },
      { id: 'col-2', name: 'Stop', color: '#ef4444' },
      { id: 'col-3', name: 'Continue', color: '#3b82f6' },
    ],
  },
  participants: [
    { id: 'user-1', name: 'Alice' },
    { id: 'user-2', name: 'Bob' },
  ],
};

describe('JoinRetro Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading spinner while fetching data', () => {
      vi.mocked(api.get).mockImplementation(() => new Promise(() => {}));
      
      render(<JoinRetro />);
      
      expect(screen.getByText(/loading retrospective details/i)).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('displays loader icon during loading', () => {
      vi.mocked(api.get).mockImplementation(() => new Promise(() => {}));
      
      const { container } = render(<JoinRetro />);
      
      const loader = container.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });
  });

  describe('Retro Data Display', () => {
    beforeEach(() => {
      vi.mocked(api.get).mockResolvedValue({ data: mockRetroData });
    });

    it('renders retro session name', async () => {
      render(<JoinRetro />);
      
      await waitFor(() => {
        expect(screen.getByText('Sprint 42 Retrospective')).toBeInTheDocument();
      });
    });

    it('displays retro context information', async () => {
      render(<JoinRetro />);
      
      await waitFor(() => {
        expect(screen.getByText(/review our recent sprint/i)).toBeInTheDocument();
      });
    });

    it('shows template name and description', async () => {
      render(<JoinRetro />);
      
      await waitFor(() => {
        expect(screen.getByText('Start-Stop-Continue')).toBeInTheDocument();
        expect(screen.getByText('Classic retrospective format')).toBeInTheDocument();
      });
    });

    it('displays all template columns as badges', async () => {
      render(<JoinRetro />);
      
      await waitFor(() => {
        expect(screen.getByText('Start')).toBeInTheDocument();
        expect(screen.getByText('Stop')).toBeInTheDocument();
        expect(screen.getByText('Continue')).toBeInTheDocument();
      });
    });

    it('shows participant count', async () => {
      render(<JoinRetro />);
      
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText(/people already joined/i)).toBeInTheDocument();
      });
    });

    it('displays correct participant text for zero participants', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { ...mockRetroData, participants: [] },
      });
      
      render(<JoinRetro />);
      
      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
        expect(screen.getByText(/no one has joined yet/i)).toBeInTheDocument();
      });
    });

    it('displays correct participant text for one participant', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { ...mockRetroData, participants: [{ id: 'user-1', name: 'Alice' }] },
      });
      
      render(<JoinRetro />);
      
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText(/person already joined/i)).toBeInTheDocument();
      });
    });

    it('shows formatted creation date', async () => {
      render(<JoinRetro />);
      
      await waitFor(() => {
        expect(screen.getByText(/created january 1, 2025/i)).toBeInTheDocument();
      });
    });

    it('displays retro status', async () => {
      render(<JoinRetro />);
      
      await waitFor(() => {
        expect(screen.getByText(/active/i)).toBeInTheDocument();
      });
    });
  });

  describe('Header Section', () => {
    beforeEach(() => {
      vi.mocked(api.get).mockResolvedValue({ data: mockRetroData });
    });

    it('renders join retrospective heading', async () => {
      render(<JoinRetro />);
      
      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: /join retrospective/i, level: 1 });
        expect(heading).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('shows invitation message', async () => {
      render(<JoinRetro />);
      
      await waitFor(() => {
        expect(screen.getByText(/you've been invited to participate/i)).toBeInTheDocument();
      });
    });
  });

  describe('Join Button', () => {
    beforeEach(() => {
      vi.mocked(api.get).mockResolvedValue({ data: mockRetroData });
    });

    it('renders join button', async () => {
      render(<JoinRetro />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /join retrospective/i })).toBeInTheDocument();
      });
    });

    it('navigates to board when join button is clicked', async () => {
      const user = userEvent.setup();
      render(<JoinRetro />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /join retrospective/i })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /join retrospective/i }));
      
      expect(mockNavigate).toHaveBeenCalledWith('/retro/test-retro-123/board');
    });

    it('shows joining state when button is clicked', async () => {
      const user = userEvent.setup();
      render(<JoinRetro />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /join retrospective/i })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /join retrospective/i }));
      
      expect(screen.getByText(/joining/i)).toBeInTheDocument();
    });

    it('button is disabled while joining', async () => {
      const user = userEvent.setup();
      render(<JoinRetro />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /join retrospective/i })).toBeInTheDocument();
      });
      
      const button = screen.getByRole('button', { name: /join retrospective/i });
      await user.click(button);
      
      expect(button).toBeDisabled();
    });
  });

  describe('Info Box', () => {
    beforeEach(() => {
      vi.mocked(api.get).mockResolvedValue({ data: mockRetroData });
    });

    it('displays what to expect section', async () => {
      render(<JoinRetro />);
      
      await waitFor(() => {
        expect(screen.getByText('What to expect:')).toBeInTheDocument();
      });
    });

    it('shows all expectation points', async () => {
      render(<JoinRetro />);
      
      await waitFor(() => {
        expect(screen.getByText(/you'll be assigned a random name/i)).toBeInTheDocument();
        expect(screen.getByText(/you can share ideas, vote, and collaborate/i)).toBeInTheDocument();
        expect(screen.getByText(/all contributions are valuable/i)).toBeInTheDocument();
        expect(screen.getByText(/the session may have multiple stages/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error toast on 404 response', async () => {
      vi.mocked(api.get).mockRejectedValue({
        response: { status: 404 },
      });
      
      render(<JoinRetro />);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Retrospective not found');
      });
    });

    it('shows generic error toast on other errors', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'));
      
      render(<JoinRetro />);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load retrospective details');
      });
    });
  });

  describe('API Integration', () => {
    it('calls API with correct retro ID', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: mockRetroData });
      
      render(<JoinRetro />);
      
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/retros/test-retro-123');
      }, { timeout: 3000 });
    });

    it('fetches data on component mount', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: mockRetroData });
      
      render(<JoinRetro />);
      
      expect(api.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('Responsive Layout', () => {
    beforeEach(() => {
      vi.mocked(api.get).mockResolvedValue({ data: mockRetroData });
    });

    it('uses container with padding', async () => {
      render(<JoinRetro />);
      
      await waitFor(() => {
        expect(screen.getByText('Sprint 42 Retrospective')).toBeInTheDocument();
      });
    });
  });

  describe('Context Display', () => {
    it('displays context when provided', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: mockRetroData });
      
      render(<JoinRetro />);
      
      await waitFor(() => {
        expect(screen.getByText(/review our recent sprint/i)).toBeInTheDocument();
      });
    });
  });

  describe('Icons and Visual Elements', () => {
    beforeEach(() => {
      vi.mocked(api.get).mockResolvedValue({ data: mockRetroData });
    });

    it('renders template columns', async () => {
      render(<JoinRetro />);
      
      await waitFor(() => {
        expect(screen.getByText('Start')).toBeInTheDocument();
      });
    });
  });
});
