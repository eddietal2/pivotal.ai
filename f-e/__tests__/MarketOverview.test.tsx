import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MarketOverview from '@/components/ui/MarketOverview';

const mockPulses = [
  { index: 'S&P 500', value: 5210.45, change: '+0.82%', color: 'text-green-500', trend: [5180, 5190, 5200, 5205, 5210], timeframe: '1D', afterHours: false },
  { index: 'Bitcoin', value: 43250.00, change: '+2.15%', color: 'text-green-500', trend: [41200, 42000, 42500, 43000, 43250], timeframe: '24H', afterHours: true },
];

describe('MarketOverview', () => {
  test('renders and types out overview (typewriter animation)', async () => {
    jest.useFakeTimers();
    render(<MarketOverview pulses={mockPulses} />);
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
    act(() => jest.advanceTimersByTime(200));
    const partial = screen.getByText((content, node) => {
      return node?.textContent?.includes('AI Overview:') || false;
    });
    expect(partial).toBeTruthy();
    // The typewriter caret should be visible while typing
    // Expect cpu indicator to be present and set to typing
    const cpuTyping = screen.getByTestId('cpu-indicator');
    expect(cpuTyping).toBeInTheDocument();
    expect(cpuTyping).toHaveAttribute('data-state', 'typing');
    expect(headerCpu).toHaveAttribute('data-state', 'typing');
    // Finish typing out
    act(() => jest.advanceTimersByTime(2000));
    const full = await screen.findByText(/AI Overview:/, {}, { timeout: 1500 });
    expect(full).toBeInTheDocument();
    jest.useRealTimers();
    // After typing completes, the loading-dot should not be visible
    expect(screen.queryByTestId('loading-dot')).not.toBeInTheDocument();
    expect(headerCpu).toHaveAttribute('data-state', 'idle');
  });

  test('Regenerate button triggers a new overview and typing', async () => {
    jest.useFakeTimers();
    render(<MarketOverview pulses={mockPulses} />);
    const button = screen.getByRole('button', { name: /regenerate market overview/i });
    fireEvent.click(button);
    // Show 'Regenerating' while AI is being generated
    expect(button).toHaveTextContent(/Regenerating/);
    // Advance to complete generation and enough typing
    act(() => jest.advanceTimersByTime(600 + 2000));
    const content = await screen.findByText(/AI Overview:/, {}, { timeout: 1500 });
    expect(content).toBeInTheDocument();
    // After typing completes, caret should not be visible
    expect(screen.queryByTestId('type-caret')).not.toBeInTheDocument();
    // Loading placeholder should be gone after regenerate typing completes
    expect(screen.queryByTestId('loading-dot')).not.toBeInTheDocument();
    jest.useRealTimers();
  });
});
