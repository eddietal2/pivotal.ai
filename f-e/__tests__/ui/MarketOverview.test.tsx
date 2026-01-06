import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MarketOverview from '@/components/ui/MarketOverview';
import { ThemeProvider } from '@/components/context/ThemeContext';
import { ToastProvider } from '@/components/context/ToastContext';

// Mock generateAiOverview to return consistent text for testing
jest.mock('@/components/ui/MarketOverview', () => {
  const actual = jest.requireActual('@/components/ui/MarketOverview');
  actual.generateAiOverview = jest.fn().mockResolvedValue({
    summary: 'Market sentiment shows mixed signals with tech stocks leading gains while traditional indices remain cautious. Key drivers include AI developments and interest rate expectations. (Based on daily data)',
    fullSentiment: 'Market sentiment shows mixed signals with tech stocks leading gains while traditional indices remain cautious. Key drivers include AI developments and interest rate expectations. (Based on daily data)'
  });
  return actual;
});

const mockPulses = [
  { index: 'S&P 500', value: 5210.45, change: '+0.82%', color: 'text-green-500', trend: [5180, 5190, 5200, 5205, 5210], timeframe: '1D', afterHours: false },
  { index: 'Bitcoin', value: 43250.00, change: '+2.15%', color: 'text-green-500', trend: [41200, 42000, 42500, 43000, 43250], timeframe: '24H', afterHours: true },
];

describe('MarketOverview', () => {
  test('renders and types out overview (typewriter animation)', async () => {
    jest.useFakeTimers();
    render(
      <ThemeProvider>
        <ToastProvider>
          <MarketOverview pulses={mockPulses} timeframe={'D'} />
        </ToastProvider>
      </ThemeProvider>
    );
    expect(screen.getByText('Market Pulse Overview')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /regenerate market overview/i })).toBeInTheDocument();
    // Initially show header CPU and generating text with the original gray loading dot
    const headerCpu = screen.getByTestId('header-cpu-indicator');
    expect(headerCpu).toBeInTheDocument();
    expect(headerCpu).toHaveAttribute('data-state', 'loading');
    expect(screen.getByText('Generating Market Overview…')).toBeInTheDocument();
    const loadingDot = screen.getByTestId('loading-dot');
    expect(loadingDot).toBeInTheDocument();
    // Advance to let generation complete (simulate 600ms delay)
    act(() => jest.advanceTimersByTime(600));
    // Now typing starts; advance some typing time and ensure partial text visible; cpu indicator should show typing
    act(() => jest.advanceTimersByTime(2000));
    const partials = screen.getAllByText((content, node) => {
      return node?.textContent?.includes('Market sentiment') || false;
    });
    expect(partials.length).toBeGreaterThan(0);
    // The typewriter caret should be visible while typing
    // Expect header CPU indicator to be present and set to typing
    expect(headerCpu).toHaveAttribute('data-state', 'typing');
    expect(headerCpu).toHaveAttribute('data-state', 'typing');
    // Finish typing out
    act(() => jest.advanceTimersByTime(2000));
    const full = await screen.findByText(/Market sentiment/, {}, { timeout: 1500 });
    expect(full).toBeInTheDocument();
    jest.useRealTimers();
    // Last generated timestamp label should be present and non-empty and include a date in parentheses
    const label = screen.getByTestId('last-generated-label');
    expect(label).toBeInTheDocument();
    expect(label.textContent).not.toBe('');
    // It should contain parens with a weekday and a date format like mm/dd/yy
    expect(label.textContent).toMatch(/\(\w+, \d{2}\/\d{2}\/\d{2}\)/);
    // After typing completes, the loading-dot should not be visible
    expect(screen.queryByTestId('loading-dot')).not.toBeInTheDocument();
    expect(headerCpu).toHaveAttribute('data-state', 'idle');
  });

  test('Regenerate button triggers a new overview and typing', async () => {
    jest.useFakeTimers();
    render(
      <ThemeProvider>
        <ToastProvider>
          <MarketOverview pulses={mockPulses} timeframe={'D'} />
        </ToastProvider>
      </ThemeProvider>
    );
    const button = screen.getByRole('button', { name: /regenerate market overview/i });
    fireEvent.click(button);
    // Show 'Regenerating' while AI is being generated
    expect(button).toHaveTextContent(/Regenerating/);
    // Advance to complete generation and enough typing
    act(() => jest.advanceTimersByTime(600 + 20000));
    const contents = await screen.findAllByText((content, node) => node?.textContent?.includes('Market sentiment') || false, {}, { timeout: 2000 });
    expect(contents.length).toBeGreaterThan(0);
    // After typing completes, caret should not be visible
    expect(screen.queryByTestId('type-caret')).not.toBeInTheDocument();
    // Loading placeholder should be gone after regenerate typing completes
    expect(screen.queryByTestId('loading-dot')).not.toBeInTheDocument();
    jest.useRealTimers();
    // Label should be present after regenerate and include the date
    const label2 = screen.getByTestId('last-generated-label');
    expect(label2).toBeInTheDocument();
    expect(label2.textContent).not.toBe('');
    expect(label2.textContent).toMatch(/\(\w+, \d{2}\/\d{2}\/\d{2}\)/);
  });
});
