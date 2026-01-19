import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { ThemeProvider } from '@/context/ThemeContext';

// Mock the page components
vi.mock('../pages/LandingPage', () => ({
  default: () => <div data-testid="landing-page">Landing Page</div>,
}));

vi.mock('../pages/RetroBoard', () => ({
  default: () => <div data-testid="retro-board">Retro Board</div>,
}));

vi.mock('../pages/JoinRetro', () => ({
  default: () => <div data-testid="join-retro">Join Retro</div>,
}));

describe('App Component', () => {
  const renderApp = (initialRoute: string) => {
    return render(
      <ThemeProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <App />
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  it('renders landing page on default route', () => {
    renderApp('/');
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
  });

  it('renders join retro page on /retro/:retroId/join route', () => {
    renderApp('/retro/123/join');
    expect(screen.getByTestId('join-retro')).toBeInTheDocument();
  });

  it('renders retro board on /retro/:retroId/board route', () => {
    renderApp('/retro/123/board');
    expect(screen.getByTestId('retro-board')).toBeInTheDocument();
  });

  it('redirects legacy /retro/:retroId route to join page', () => {
    renderApp('/retro/123');
    // Should redirect to join page
    expect(screen.getByTestId('join-retro')).toBeInTheDocument();
  });

  it('redirects unknown routes to landing page', () => {
    renderApp('/unknown-route');
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
  });
});
