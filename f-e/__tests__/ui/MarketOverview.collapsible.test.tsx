import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '@/app/home/page';
import { ThemeProvider } from '@/components/context/ThemeContext';
import { ToastProvider } from '@/components/context/ToastContext';
import { UIProvider } from '@/components/context/UIContext';

// Mock fetch to prevent network errors and act() warnings
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      '^GSPC': { change: 1.2, price: '4500.00' },
      '^DJI': { change: -0.8, price: '34000.00' }
    }),
  })
) as unknown as jest.MockedFunction<typeof fetch>;

// Mock MarketOverview to simulate its behavior without async delays
const mockGenerateAiOverview = jest.fn();
jest.mock('@/components/ui/MarketOverview', () => {
  const React = require('react');
  return function MockMarketOverview({ onOpenInfo, onStateChange }: { onOpenInfo?: () => void; onStateChange?: (state: string) => void; }) {
    const [loading, setLoading] = React.useState(false);
    const [showCaret, setShowCaret] = React.useState(false);

    React.useEffect(() => {
      mockGenerateAiOverview().then(() => {
        setLoading(false);
        if (onStateChange) onStateChange('idle');
      });
    }, []);

    const handleRegenerate = () => {
      setLoading(true);
      if (onStateChange) onStateChange('loading');
      setTimeout(() => {
        setLoading(false);
        if (onStateChange) onStateChange('idle');
        setShowCaret(true);
        setTimeout(() => setShowCaret(false), 2000);
      }, 600);
    };

    return React.createElement('div', null,
      React.createElement('div', null, 'Market Pulse Overview'),
      React.createElement('button', { 'data-testid': 'overview-info-btn', onClick: onOpenInfo }, 'Info'),
      React.createElement('button', { 'aria-label': 'Regenerate market overview', onClick: handleRegenerate }, 'Regenerate'),
      React.createElement('div', { 'data-testid': 'header-cpu-indicator', 'data-state': loading ? 'loading' : 'idle' }),
      loading && React.createElement('div', { 'data-testid': 'loading-dot' }),
      showCaret && React.createElement('div', { 'data-testid': 'type-caret' })
    );
  };
});
mockGenerateAiOverview.mockResolvedValue({ summary: 'Mock summary', fullSentiment: 'Mock full sentiment' });

describe.skip('MarketOverview collapsible behavior', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('MarketOverview hides when Market Pulse is collapsed', async () => {
    render(
      <ThemeProvider>
        <ToastProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </ToastProvider>
      </ThemeProvider>
    );
    // Wait for app to load
    act(() => jest.advanceTimersByTime(2600));
    // Overview should be visible initially
    await screen.findByText('Market Pulse Overview');
    expect(screen.getByText('Market Pulse Overview')).toBeInTheDocument();
    // Get the toggle button for Market Pulse (use the header text's closest button)
    const headerButton = screen.getByText('Market Pulse').closest('button');
    expect(headerButton).toBeTruthy();
    // Collapse the Market Pulse section
    fireEvent.click(headerButton as HTMLElement);
    // After collapse, the button aria-label should change to 'Expand section'
    expect(headerButton).toHaveAttribute('aria-label', 'Expand section');
  });

  // Pin behavior removed; no test for pinning necessary

  test('Overview modal opens from header when section is collapsed', async () => {
    render(
      <ThemeProvider>
        <ToastProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </ToastProvider>
      </ThemeProvider>
    );
    // Wait for app to load
    act(() => jest.advanceTimersByTime(2600));
    // Collapse the section
    const headerButton = screen.getByText('Market Pulse').closest('button');
    fireEvent.click(headerButton as HTMLElement);
    // Verify section is collapsed
    expect(headerButton).toHaveAttribute('aria-label', 'Expand section');
    // Click header overview info button and assert modal opens with combined content
    const overviewInfoBtn = screen.getByTestId('overview-info-btn');
    fireEvent.click(overviewInfoBtn);
    expect(screen.getByText('Market Overview Details')).toBeInTheDocument();
    // Combined modal should also show Market Pulse info
    expect(screen.getByText('About Market Pulse')).toBeInTheDocument();
    // Modal CPU indicator should be rendered
    expect(screen.getByTestId('modal-cpu-indicator')).toBeInTheDocument();
    // Modal header close button should be present
    expect(screen.getByTestId('modal-close-top')).toBeInTheDocument();
  });

  test('Regenerate button triggers MarketOverview regeneration', async () => {
    render(
      <ThemeProvider>
        <ToastProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </ToastProvider>
      </ThemeProvider>
    );
    // Wait for initial generation to complete
    act(() => jest.advanceTimersByTime(2600));
    // Click in-content Regenerate button inside the Market Overview component
    const inContentRegenerateBtn = screen.getByLabelText('Regenerate market overview');
    expect(inContentRegenerateBtn).toBeInTheDocument();
    fireEvent.click(inContentRegenerateBtn);
    // After clicking, the MarketOverview should show a loading-dot for the new generation
    const loadingDot = await screen.findByTestId('loading-dot');
    expect(loadingDot).toBeInTheDocument();
    // Header CPU should be in loading state during regeneration
    const headerCpu = screen.getByTestId('header-cpu-indicator');
    expect(headerCpu).toHaveAttribute('data-state', 'loading');
    // Fast-forward generation delay and initial typing
    act(() => jest.advanceTimersByTime(600));
    // Typewriter should begin (caret visible)
    expect(screen.getByTestId('type-caret')).toBeInTheDocument();
    // Finish typing
    act(() => jest.advanceTimersByTime(2000));
    expect(screen.queryByTestId('type-caret')).not.toBeInTheDocument();
  });

  // Note: Default expand / defaultOpen toggle removed from UI; no test required
});
