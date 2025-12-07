import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import App from '@/app/home/page';
import { fireEvent } from '@testing-library/react';

jest.useRealTimers();

describe('MarketPulseCard Timeframe badges', () => {
  test('renders timeframe chip when provided on about market pulse page', () => {
    render(<App />);
    // The Market Pulse header contains Market Pulse and a '1D' timeframe chip for mock items
    // Find at least one of the timeframe chips
    expect(screen.getByText('1D')).toBeInTheDocument();
    // Bitcoin's timeframe is '24H' as per mockPulse; assert it is visible
    expect(screen.getByText('24H')).toBeInTheDocument();
    // And the Bitcoin after-hours badge 'AH' should be visible next to 24H
    expect(screen.getByText('AH')).toBeInTheDocument();
  });

  test('opens and closes selected pulse modal and restores scroll lock', () => {
    // Ensure timers start in modern mode so fallback runs predictably
    jest.useFakeTimers();
    document.body.dataset.modalCount = '0';
    const { getByText, getByLabelText } = render(<App />);
    // Click first MarketPulseCard (S&P 500) to open modal
    const spCard = getByText('S&P 500');
    fireEvent.click(spCard);
    // lock count should be increased
    expect(document.body.dataset.modalCount).toBe('1');
    // Close using the top-close button
    const closeBtn = getByLabelText('Close info modal');
    fireEvent.click(closeBtn);
    // Advance timers to allow fallback to trigger
    jest.advanceTimersByTime(500);
    expect(document.body.dataset.modalCount).toBe('0');
    jest.useRealTimers();
  });
});
