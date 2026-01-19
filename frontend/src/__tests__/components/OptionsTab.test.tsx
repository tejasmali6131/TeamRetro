import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OptionsTab from '../../components/OptionsTab';

describe('OptionsTab', () => {
  const mockSetReactionsEnabled = vi.fn();
  const mockSetCommentsEnabled = vi.fn();
  const mockSetCommentReactionsEnabled = vi.fn();
  const mockSetNameDeck = vi.fn();

  const defaultProps = {
    reactionsEnabled: true,
    setReactionsEnabled: mockSetReactionsEnabled,
    commentsEnabled: true,
    setCommentsEnabled: mockSetCommentsEnabled,
    commentReactionsEnabled: true,
    setCommentReactionsEnabled: mockSetCommentReactionsEnabled,
    nameDeck: 'random',
    setNameDeck: mockSetNameDeck,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all option sections', () => {
      render(<OptionsTab {...defaultProps} />);

      expect(screen.getByText('Participant Name Theme')).toBeInTheDocument();
      expect(screen.getByText('Reactions')).toBeInTheDocument();
      expect(screen.getByText('Comments')).toBeInTheDocument();
      expect(screen.getByText('Comment Reactions')).toBeInTheDocument();
    });

    it('renders description text', () => {
      render(<OptionsTab {...defaultProps} />);

      expect(screen.getByText(/customize additional settings/i)).toBeInTheDocument();
    });

    it('renders name deck dropdown with all options', () => {
      render(<OptionsTab {...defaultProps} />);

      const select = screen.getByRole('combobox', { name: /select participant name theme/i });
      expect(select).toBeInTheDocument();
      expect(select).toHaveValue('random');

      expect(screen.getByText('Random (All Themes)')).toBeInTheDocument();
      expect(screen.getByText('Animals')).toBeInTheDocument();
      expect(screen.getByText('Plants')).toBeInTheDocument();
      expect(screen.getByText('Colors')).toBeInTheDocument();
      expect(screen.getByText('Celestial Bodies')).toBeInTheDocument();
      expect(screen.getByText('Elements')).toBeInTheDocument();
    });
  });

  describe('Name Deck Selection', () => {
    it('calls setNameDeck when selecting a different theme', () => {
      render(<OptionsTab {...defaultProps} />);

      const select = screen.getByRole('combobox', { name: /select participant name theme/i });
      fireEvent.change(select, { target: { value: 'animals' } });

      expect(mockSetNameDeck).toHaveBeenCalledWith('animals');
    });

    it('displays the current name deck value', () => {
      render(<OptionsTab {...defaultProps} nameDeck="celestial" />);

      const select = screen.getByRole('combobox', { name: /select participant name theme/i });
      expect(select).toHaveValue('celestial');
    });
  });

  describe('Toggle Functionality', () => {
    it('toggles reactions when clicked', () => {
      render(<OptionsTab {...defaultProps} />);

      const reactionsToggle = screen.getByRole('button', { name: /disable reactions/i });
      fireEvent.click(reactionsToggle);

      expect(mockSetReactionsEnabled).toHaveBeenCalledWith(false);
    });

    it('toggles comments when clicked', () => {
      render(<OptionsTab {...defaultProps} />);

      const commentsToggle = screen.getByRole('button', { name: /disable comments$/i });
      fireEvent.click(commentsToggle);

      expect(mockSetCommentsEnabled).toHaveBeenCalledWith(false);
    });

    it('toggles comment reactions when clicked', () => {
      render(<OptionsTab {...defaultProps} />);

      const commentReactionsToggle = screen.getByRole('button', { name: /disable comment reactions/i });
      fireEvent.click(commentReactionsToggle);

      expect(mockSetCommentReactionsEnabled).toHaveBeenCalledWith(false);
    });

    it('shows enable button when feature is disabled', () => {
      render(<OptionsTab {...defaultProps} reactionsEnabled={false} />);

      expect(screen.getByRole('button', { name: /enable reactions/i })).toBeInTheDocument();
    });

    it('enables reactions when toggle clicked while disabled', () => {
      render(<OptionsTab {...defaultProps} reactionsEnabled={false} />);

      const reactionsToggle = screen.getByRole('button', { name: /enable reactions/i });
      fireEvent.click(reactionsToggle);

      expect(mockSetReactionsEnabled).toHaveBeenCalledWith(true);
    });

    it('enables comments when toggle clicked while disabled', () => {
      render(<OptionsTab {...defaultProps} commentsEnabled={false} />);

      const commentsToggle = screen.getByRole('button', { name: /enable comments$/i });
      fireEvent.click(commentsToggle);

      expect(mockSetCommentsEnabled).toHaveBeenCalledWith(true);
    });

    it('enables comment reactions when toggle clicked while disabled', () => {
      render(<OptionsTab {...defaultProps} commentReactionsEnabled={false} />);

      const commentReactionsToggle = screen.getByRole('button', { name: /enable comment reactions/i });
      fireEvent.click(commentReactionsToggle);

      expect(mockSetCommentReactionsEnabled).toHaveBeenCalledWith(true);
    });
  });

  describe('Accessibility', () => {
    it('has accessible toggle buttons with proper aria-labels', () => {
      render(<OptionsTab {...defaultProps} />);

      // Use exact match to avoid multiple matches
      expect(screen.getByRole('button', { name: /disable reactions$/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /select participant name theme/i })).toBeInTheDocument();
    });

    it('updates aria-labels based on toggle state', () => {
      const { rerender } = render(<OptionsTab {...defaultProps} reactionsEnabled={true} />);
      expect(screen.getByRole('button', { name: /disable reactions/i })).toBeInTheDocument();

      rerender(<OptionsTab {...defaultProps} reactionsEnabled={false} />);
      expect(screen.getByRole('button', { name: /enable reactions/i })).toBeInTheDocument();
    });
  });
});
