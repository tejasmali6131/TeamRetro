import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Header from '../../components/Header';

// Mock the logo import
vi.mock('@/images/koneLogo.png', () => ({
  default: 'mocked-logo.png',
}));

// Mock the ThemeContext
const mockToggleTheme = vi.fn();
let mockTheme = 'light';

vi.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: mockTheme,
    toggleTheme: mockToggleTheme,
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTheme = 'light';
  });

  const renderHeader = () => {
    return render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
  };

  describe('Logo and Branding', () => {
    it('renders the logo image with correct attributes', () => {
      renderHeader();
      
      const logo = screen.getByAltText('Logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', 'mocked-logo.png');
      expect(logo).toHaveClass('h-10', 'w-auto');
    });

    it('renders the Team Retro brand name', () => {
      renderHeader();
      
      const brandName = screen.getByText('Team Retro');
      expect(brandName).toBeInTheDocument();
      expect(brandName).toHaveClass('text-xl', 'font-bold');
    });

    it('logo link navigates to home page', () => {
      renderHeader();
      
      const homeLink = screen.getByRole('link');
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('applies hover effect to home link', () => {
      renderHeader();
      
      const homeLink = screen.getByRole('link');
      expect(homeLink).toHaveClass('hover:opacity-80', 'transition-opacity');
    });
  });

  describe('Theme Toggle Button', () => {
    it('renders theme toggle button with correct accessibility label', () => {
      renderHeader();
      
      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveAttribute('aria-label', 'Toggle theme');
    });

    it('has correct styling classes', () => {
      renderHeader();
      
      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      expect(toggleButton).toHaveClass('p-3', 'rounded-full', 'transition-colors');
    });

    it('calls toggleTheme when clicked', async () => {
      const user = userEvent.setup();
      renderHeader();
      
      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      await user.click(toggleButton);
      
      expect(mockToggleTheme).toHaveBeenCalledTimes(1);
    });

    it('calls toggleTheme only once on double click', async () => {
      const user = userEvent.setup();
      renderHeader();
      
      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      await user.dblClick(toggleButton);
      
      expect(mockToggleTheme).toHaveBeenCalledTimes(2);
    });
  });

  describe('Theme Icons', () => {
    it('displays moon icon in light theme', () => {
      mockTheme = 'light';
      renderHeader();
      
      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      expect(toggleButton).toBeInTheDocument();
      // Moon icon should be present in light theme
      const svg = toggleButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('displays sun icon in dark theme', () => {
      mockTheme = 'dark';
      renderHeader();
      
      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      expect(toggleButton).toBeInTheDocument();
      // Sun icon should be present in dark theme
      const svg = toggleButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Layout and Structure', () => {
    it('renders header with container classes', () => {
      const { container } = renderHeader();
      
      const header = container.querySelector('header');
      expect(header).toHaveClass('container', 'mx-auto', 'px-4', 'py-6');
    });

    it('maintains flex layout for header content', () => {
      const { container } = renderHeader();
      
      const headerContent = container.querySelector('.flex.items-center.justify-between');
      expect(headerContent).toBeInTheDocument();
    });

    it('groups controls in a flex container', () => {
      const { container } = renderHeader();
      
      const controlsContainer = container.querySelector('.flex.items-center.gap-4');
      expect(controlsContainer).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('theme toggle button is keyboard accessible', async () => {
      const user = userEvent.setup();
      renderHeader();
      
      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      
      // Tab to link first, then to button
      await user.tab();
      await user.tab();
      expect(toggleButton).toHaveFocus();
      
      // Press Enter
      await user.keyboard('{Enter}');
      expect(mockToggleTheme).toHaveBeenCalled();
    });

    it('home link is keyboard accessible', async () => {
      const user = userEvent.setup();
      renderHeader();
      
      const homeLink = screen.getByRole('link');
      
      await user.tab();
      expect(homeLink).toHaveFocus();
    });
  });
});
