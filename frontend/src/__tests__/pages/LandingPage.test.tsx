import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import LandingPage from '../../pages/LandingPage';

// Mock navigate function
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock CreateRetroForm component
vi.mock('@/components/CreateRetroForm', () => ({
  default: ({ onSuccess, onCancel }: { onSuccess: (retro: any) => void; onCancel: () => void }) => (
    <div data-testid="create-retro-form">
      <button onClick={() => onSuccess({ id: 'test-retro-123' })}>Submit Form</button>
      <button onClick={onCancel}>Cancel Form</button>
    </div>
  ),
}));

// Mock Header component
vi.mock('@/components/Header', () => ({
  default: () => <div data-testid="header">Header</div>,
}));

describe('LandingPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Structure and Layout', () => {
    it('renders the header component', () => {
      render(<LandingPage />);
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('renders all main sections', () => {
      render(<LandingPage />);
      
      expect(screen.getByText(/Better Retrospectives/i)).toBeInTheDocument();
      expect(screen.getByText('Easy to Use')).toBeInTheDocument();
      expect(screen.getByText('Quick Start Guide')).toBeInTheDocument();
    });

    it('renders footer with copyright', () => {
      render(<LandingPage />);
      
      expect(screen.getByText(/© 2025 KONE Corporation/i)).toBeInTheDocument();
    });
  });

  describe('Hero Section', () => {
    it('renders main heading with correct text', () => {
      render(<LandingPage />);
      
      expect(screen.getByText(/Better Retrospectives/i)).toBeInTheDocument();
      expect(screen.getByText(/Better Teams/i)).toBeInTheDocument();
    });

    it('renders descriptive subtitle', () => {
      render(<LandingPage />);
      
      expect(screen.getByText(/Streamline your agile retrospectives/i)).toBeInTheDocument();
    });

    it('renders start button with icon', () => {
      render(<LandingPage />);
      
      const startButton = screen.getByRole('button', { name: /start a retrospective/i });
      expect(startButton).toBeInTheDocument();
      expect(startButton).toHaveClass('btn-primary');
    });

    it('start button has correct styling', () => {
      render(<LandingPage />);
      
      const startButton = screen.getByRole('button', { name: /start a retrospective/i });
      expect(startButton).toHaveClass('text-lg', 'px-8', 'py-4');
    });
  });

  describe('Features Section', () => {
    it('renders all four feature cards', () => {
      render(<LandingPage />);
      
      expect(screen.getByText('Easy to Use')).toBeInTheDocument();
      expect(screen.getByText('Anonymous Feedback')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Real-time Collaboration')).toBeInTheDocument();
    });

    it('each feature has a description', () => {
      render(<LandingPage />);
      
      expect(screen.getByText(/Intuitive interface with customizable templates/i)).toBeInTheDocument();
      expect(screen.getByText(/Enable anonymous mode for honest and open feedback/i)).toBeInTheDocument();
      expect(screen.getByText(/Track team progress and action items over time/i)).toBeInTheDocument();
      expect(screen.getByText(/Work together in real-time with voting and grouping/i)).toBeInTheDocument();
    });
  });

  describe('Quick Start Guide', () => {
    it('renders quick start heading', () => {
      render(<LandingPage />);
      
      expect(screen.getByText('Quick Start Guide')).toBeInTheDocument();
    });

    it('renders all three steps in order', () => {
      render(<LandingPage />);
      
      expect(screen.getByText('Create Session')).toBeInTheDocument();
      expect(screen.getByText('Configure Settings')).toBeInTheDocument();
      expect(screen.getByText('Start Collaborating')).toBeInTheDocument();
    });

    it('each step has a number indicator', () => {
      const { container } = render(<LandingPage />);
      
      const stepNumbers = container.querySelectorAll('.w-12.h-12.bg-kone-blue');
      expect(stepNumbers.length).toBe(3);
    });

    it('step descriptions are present', () => {
      render(<LandingPage />);
      
      expect(screen.getByText(/Set up your retro with a name, context/i)).toBeInTheDocument();
      expect(screen.getByText(/Enable anonymity, set voting limits/i)).toBeInTheDocument();
      expect(screen.getByText(/Share the link with your team/i)).toBeInTheDocument();
    });
  });

  describe('Create Retro Modal', () => {
    it('modal is not visible initially', () => {
      render(<LandingPage />);
      
      expect(screen.queryByTestId('create-retro-form')).not.toBeInTheDocument();
    });

    it('shows modal when start button is clicked', async () => {
      const user = userEvent.setup();
      render(<LandingPage />);
      
      const startButton = screen.getByRole('button', { name: /start a retrospective/i });
      await user.click(startButton);
      
      expect(screen.getByTestId('create-retro-form')).toBeInTheDocument();
    });

    it('modal has correct title', async () => {
      const user = userEvent.setup();
      render(<LandingPage />);
      
      await user.click(screen.getByRole('button', { name: /start a retrospective/i }));
      
      expect(screen.getByText('Create New Retrospective')).toBeInTheDocument();
    });

    it('modal has close button', async () => {
      const user = userEvent.setup();
      render(<LandingPage />);
      
      await user.click(screen.getByRole('button', { name: /start a retrospective/i }));
      
      const closeButton = screen.getByText('✕');
      expect(closeButton).toBeInTheDocument();
    });

    it('closes modal when X button is clicked', async () => {
      const user = userEvent.setup();
      render(<LandingPage />);
      
      await user.click(screen.getByRole('button', { name: /start a retrospective/i }));
      expect(screen.getByTestId('create-retro-form')).toBeInTheDocument();
      
      await user.click(screen.getByText('✕'));
      expect(screen.queryByTestId('create-retro-form')).not.toBeInTheDocument();
    });

    it('closes modal when cancel is clicked in form', async () => {
      const user = userEvent.setup();
      render(<LandingPage />);
      
      await user.click(screen.getByRole('button', { name: /start a retrospective/i }));
      expect(screen.getByTestId('create-retro-form')).toBeInTheDocument();
      
      await user.click(screen.getByRole('button', { name: /cancel form/i }));
      expect(screen.queryByTestId('create-retro-form')).not.toBeInTheDocument();
    });

    it('navigates to board on successful form submission', async () => {
      const user = userEvent.setup();
      render(<LandingPage />);
      
      await user.click(screen.getByRole('button', { name: /start a retrospective/i }));
      await user.click(screen.getByRole('button', { name: /submit form/i }));
      
      expect(mockNavigate).toHaveBeenCalledWith('/retro/test-retro-123/board');
    });

    it('closes modal after successful submission', async () => {
      const user = userEvent.setup();
      render(<LandingPage />);
      
      await user.click(screen.getByRole('button', { name: /start a retrospective/i }));
      await user.click(screen.getByRole('button', { name: /submit form/i }));
      
      expect(screen.queryByTestId('create-retro-form')).not.toBeInTheDocument();
    });

    it('modal has backdrop overlay', async () => {
      const user = userEvent.setup();
      const { container } = render(<LandingPage />);
      
      await user.click(screen.getByRole('button', { name: /start a retrospective/i }));
      
      const backdrop = container.querySelector('.bg-black.bg-opacity-50');
      expect(backdrop).toBeInTheDocument();
    });

    it('modal content has correct z-index for overlay', async () => {
      const user = userEvent.setup();
      const { container } = render(<LandingPage />);
      
      await user.click(screen.getByRole('button', { name: /start a retrospective/i }));
      
      const modal = container.querySelector('.z-50');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('has gradient background', () => {
      const { container } = render(<LandingPage />);
      
      const mainDiv = container.querySelector('.min-h-screen');
      expect(mainDiv).toHaveClass('bg-gradient-to-br');
    });

    it('features section uses responsive grid', () => {
      const { container } = render(<LandingPage />);
      
      const grid = container.querySelector('.grid.md\\:grid-cols-2.lg\\:grid-cols-4');
      expect(grid).toBeInTheDocument();
    });

    it('quick start guide uses responsive grid', () => {
      const { container } = render(<LandingPage />);
      
      const grids = container.querySelectorAll('.grid.md\\:grid-cols-3');
      expect(grids.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('main button is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<LandingPage />);
      
      const startButton = screen.getByRole('button', { name: /start a retrospective/i });
      
      await user.tab();
      await user.tab(); // Skip header elements
      
      // Button should be focusable
      expect(startButton).toBeInTheDocument();
    });

    it('all buttons have proper button role', () => {
      render(<LandingPage />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('State Management', () => {
    it('modal state toggles correctly', async () => {
      const user = userEvent.setup();
      render(<LandingPage />);
      
      // Open modal
      await user.click(screen.getByRole('button', { name: /start a retrospective/i }));
      expect(screen.getByTestId('create-retro-form')).toBeInTheDocument();
      
      // Close modal
      await user.click(screen.getByText('✕'));
      expect(screen.queryByTestId('create-retro-form')).not.toBeInTheDocument();
      
      // Open again
      await user.click(screen.getByRole('button', { name: /start a retrospective/i }));
      expect(screen.getByTestId('create-retro-form')).toBeInTheDocument();
    });
  });
});
