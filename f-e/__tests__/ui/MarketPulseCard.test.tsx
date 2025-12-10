import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
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
    // Change chart timeframe to 1W to test the timeline filter in modal
    const filterBtn = getByText('1W');
    fireEvent.click(filterBtn);
    const chartPlaceholder = getByText(/Stock Chart Placeholder/);
    expect(chartPlaceholder.textContent).toContain('1W');

    // Additionally, verify the price and change update for the 1W timeframe for S&P 500
    expect(screen.getByText('5185.32')).toBeInTheDocument();
    expect(screen.getByText('+2.45%')).toBeInTheDocument();
    // Verify the human-friendly timeframe pill is present
    expect(screen.getByText(/in the last week/i)).toBeInTheDocument();

    // Close using the top-close button
    const closeBtn = getByLabelText('Close modal');
    fireEvent.click(closeBtn);
    // Advance timers to allow fallback to trigger
    jest.advanceTimersByTime(500);
    expect(document.body.dataset.modalCount).toBe('0');
    jest.useRealTimers();
  });

  test('toggle between slider and list view updates container layout', async () => {
    jest.useFakeTimers();
    const { getByTestId } = render(<App />);
    const container = getByTestId('market-pulse-container');
    // Default should be slider (overflow-x-auto present)
    expect(container.className).toMatch(/overflow-x-auto/);
    // Click to switch to list view
    const listToggle = getByTestId('pulse-view-toggle-list');
    fireEvent.click(listToggle);
    // Advance timers for the animation and final mode switch
    jest.advanceTimersByTime(350);
    // Wait for class to update
    await waitFor(() => expect(container.className).toMatch(/flex-col/));
    // Switch back to slider to verify toggle is reversible
    const sliderToggle = getByTestId('pulse-view-toggle-slider');
    fireEvent.click(sliderToggle);
    jest.advanceTimersByTime(350);
    await waitFor(() => expect(container.className).toMatch(/overflow-x-auto/));
    jest.useRealTimers();
  });
});
