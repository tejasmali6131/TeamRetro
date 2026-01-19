import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateRetroForm from '../../components/CreateRetroForm';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the API module
vi.mock('@/services/api', () => ({
  getTemplates: vi.fn(),
  createRetro: vi.fn(),
}));

describe('CreateRetroForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  const mockTemplates = [
    { id: 'template1', name: 'Sprint Retrospective', description: 'For sprint retros', columns: [], isDefault: true },
    { id: 'template2', name: 'Project Review', description: 'For project reviews', columns: [], isDefault: false },
  ];

  const mockRetro = {
    id: 'retro-123',
    sessionName: 'Test Retro',
    context: 'Test context',
    templateId: 'template1',
    isAnonymous: false,
    votingLimit: 5,
    timerDuration: 15,
    status: 'active' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const api = await import('@/services/api');
    vi.mocked(api.getTemplates).mockResolvedValue(mockTemplates);
    vi.mocked(api.createRetro).mockResolvedValue(mockRetro);
  });

  // Helper function to fill in required form fields
  const fillRequiredFields = async () => {
    const sessionNameInput = screen.getByPlaceholderText('e.g., Sprint 42 Retrospective');
    fireEvent.change(sessionNameInput, { target: { value: 'Test Session' } });
    
    const templateSelect = screen.getByRole('combobox');
    fireEvent.change(templateSelect, { target: { value: 'template1' } });
  };

  describe('Rendering', () => {
    it('renders the form with three tabs', async () => {
      render(<CreateRetroForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByText('Basic Info')).toBeInTheDocument();
      });
      expect(screen.getByText('Process')).toBeInTheDocument();
      expect(screen.getByText('Options')).toBeInTheDocument();
    });

    it('displays Basic Info tab by default', async () => {
      render(<CreateRetroForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByText(/Session Name/)).toBeInTheDocument();
      });
    });

    it('shows Start Instantly and Customize More buttons on basic tab', async () => {
      render(<CreateRetroForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByText('Start Instantly')).toBeInTheDocument();
      });
      expect(screen.getByText('Customize More')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('switches to Process tab when clicking Customize More from Basic', async () => {
      render(<CreateRetroForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByText('Customize More')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Customize More'));

      await waitFor(() => {
        expect(screen.getByText('Icebreaker')).toBeInTheDocument();
      });
    });

    it('switches to Options tab when clicking Customize More from Process', async () => {
      render(<CreateRetroForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      // Go to Process tab
      await waitFor(() => {
        expect(screen.getByText('Customize More')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Customize More'));

      // Then go to Options tab
      await waitFor(() => {
        expect(screen.getByText('Customize More')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Customize More'));

      await waitFor(() => {
        expect(screen.getByText('Participant Name Theme')).toBeInTheDocument();
      });
    });

    it('switches tabs when clicking tab buttons directly', async () => {
      render(<CreateRetroForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByText('Process')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Process'));

      await waitFor(() => {
        expect(screen.getByText('Icebreaker')).toBeInTheDocument();
      });
    });

    it('shows Cancel and Start Retrospective buttons on Options tab', async () => {
      render(<CreateRetroForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByText('Options')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Options'));

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
      expect(screen.getByText('Start Retrospective')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('calls onCancel when Cancel button is clicked', async () => {
      render(<CreateRetroForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByText('Options')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Options'));

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Cancel'));

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('submits form via Start Instantly button with valid data', async () => {
      const api = await import('@/services/api');
      render(<CreateRetroForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByText('Start Instantly')).toBeInTheDocument();
      });

      // Fill in required fields
      await fillRequiredFields();

      fireEvent.click(screen.getByText('Start Instantly'));

      await waitFor(() => {
        expect(api.createRetro).toHaveBeenCalled();
      });
    });

    it('submits form via Start Retrospective button on Options tab', async () => {
      const api = await import('@/services/api');
      render(<CreateRetroForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Sprint 42 Retrospective')).toBeInTheDocument();
      });

      // Fill in required fields first
      await fillRequiredFields();

      // Navigate to Options tab
      fireEvent.click(screen.getByText('Options'));

      await waitFor(() => {
        expect(screen.getByText('Start Retrospective')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Start Retrospective'));

      await waitFor(() => {
        expect(api.createRetro).toHaveBeenCalled();
      });
    });

    it('calls onSuccess after successful submission', async () => {
      render(<CreateRetroForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByText('Start Instantly')).toBeInTheDocument();
      });

      // Fill in required fields
      await fillRequiredFields();

      fireEvent.click(screen.getByText('Start Instantly'));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockRetro);
      });
    });

    it('shows success toast after successful submission', async () => {
      const toast = await import('react-hot-toast');
      render(<CreateRetroForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByText('Start Instantly')).toBeInTheDocument();
      });

      // Fill in required fields
      await fillRequiredFields();

      fireEvent.click(screen.getByText('Start Instantly'));

      await waitFor(() => {
        expect(toast.default.success).toHaveBeenCalledWith('Retrospective created successfully!');
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error toast when template fetch fails', async () => {
      const api = await import('@/services/api');
      const toast = await import('react-hot-toast');
      vi.mocked(api.getTemplates).mockRejectedValue(new Error('Network error'));

      render(<CreateRetroForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(toast.default.error).toHaveBeenCalledWith('Failed to load templates');
      });
    });

    it('shows error toast when form submission fails', async () => {
      const api = await import('@/services/api');
      const toast = await import('react-hot-toast');
      vi.mocked(api.createRetro).mockRejectedValue(new Error('Network error'));

      render(<CreateRetroForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByText('Start Instantly')).toBeInTheDocument();
      });

      // Fill in required fields
      await fillRequiredFields();

      fireEvent.click(screen.getByText('Start Instantly'));

      await waitFor(() => {
        expect(toast.default.error).toHaveBeenCalledWith('Failed to create retrospective');
      });
    });
  });

  describe('Templates Loading', () => {
    it('fetches templates on mount', async () => {
      const api = await import('@/services/api');
      render(<CreateRetroForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(api.getTemplates).toHaveBeenCalled();
      });
    });
  });
});
