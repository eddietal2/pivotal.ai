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

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor, act } from '@testing-library/react';
import App from '@/app/home/page';
import { fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@/components/context/ThemeContext';
import { ToastProvider } from '@/components/context/ToastContext';
import { UIProvider } from '@/components/context/UIContext';

jest.useFakeTimers();

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock as any
});

describe.skip('MarketPulseCard Timeframe badges', () => {
  beforeEach(() => {
    localStorage.clear();
    (localStorage.getItem as jest.MockedFunction<typeof localStorage.getItem>).mockReturnValue(null);
  });
  test('renders timeframe chip when provided on about market pulse page', async () => {
    render(
      <ThemeProvider>
        <ToastProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </ToastProvider>
      </ThemeProvider>
    );
    act(() => jest.advanceTimersByTime(2000));
    // The Market Pulse header contains Market Pulse and a '1D' timeframe chip for mock items
    // Find at least one of the timeframe chips
    const elements = await screen.findAllByText('1D');
    expect(elements.length).toBeGreaterThan(0);
    // Bitcoin's timeframe is '24H' as per mockPulse; assert it is visible
    expect(screen.getByText('24H')).toBeInTheDocument();
    // And the Bitcoin after-hours badge 'AH' should be visible next to 24H
    expect(screen.getByText('AH')).toBeInTheDocument();
  });

  test('opens and closes selected pulse modal and restores scroll lock', async () => {
    // Ensure timers start in modern mode so fallback runs predictably
    jest.useFakeTimers();
    document.body.dataset.modalCount = '0';
    const { getByText, getByLabelText, getByTestId } = render(
      <ThemeProvider>
        <ToastProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </ToastProvider>
      </ThemeProvider>
    );
    act(() => jest.advanceTimersByTime(2000));
    // Click first MarketPulseCard (S&P 500) to open modal
    const spCard = await screen.findByText('S&P 500');
    fireEvent.click(spCard);
    // lock count should be increased
    expect(document.body.dataset.modalCount).toBe('2');
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
    const closeBtn = getByTestId('modal-close-top');
    fireEvent.click(closeBtn);
    // Advance timers to allow fallback to trigger
    jest.advanceTimersByTime(500);
    expect(document.body.dataset.modalCount).toBe('1');
    jest.useRealTimers();
  });

  test('toggle between slider and list view updates container layout', async () => {
    jest.useFakeTimers();
    const { getByTestId } = render(
      <ThemeProvider>
        <ToastProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </ToastProvider>
      </ThemeProvider>
    );
    act(() => jest.advanceTimersByTime(2000));
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

  test('persists selected view mode to localStorage', async () => {
    jest.useFakeTimers();
    const { getByTestId } = render(
      <ThemeProvider>
        <ToastProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </ToastProvider>
      </ThemeProvider>
    );
    act(() => jest.advanceTimersByTime(2000));
    // Switch to list view
    const listToggle = getByTestId('pulse-view-toggle-list');
    fireEvent.click(listToggle);
    jest.advanceTimersByTime(350);
    await waitFor(() => expect(localStorage.setItem).toHaveBeenCalledWith('pulse_view_mode', 'list'));
    // Switch back to slider
    const sliderToggle = getByTestId('pulse-view-toggle-slider');
    fireEvent.click(sliderToggle);
    jest.advanceTimersByTime(350);
    await waitFor(() => expect(localStorage.setItem).toHaveBeenCalledWith('pulse_view_mode', 'slider'));
    jest.useRealTimers();
  });

  test('displays correct price and change for different timeframes in modal', async () => {
    jest.useFakeTimers();
    const { getByText } = render(
      <ThemeProvider>
        <ToastProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </ToastProvider>
      </ThemeProvider>
    );
    act(() => jest.advanceTimersByTime(2000));
    const spCard = await screen.findByText('S&P 500');
    fireEvent.click(spCard);
    // Default 1D timeframe
    expect(screen.getByText('5210.45')).toBeInTheDocument();
    expect(screen.getByText('+0.82%')).toBeInTheDocument();
    // Switch to 1M
    const monthBtn = getByText('1M');
    fireEvent.click(monthBtn);
    expect(screen.getByText('5120.78')).toBeInTheDocument();
    expect(screen.getByText('+4.12%')).toBeInTheDocument();
    expect(screen.getByText(/in the last month/i)).toBeInTheDocument();
    jest.useRealTimers();
  });

  test('handles modal close via escape key', async () => {
    jest.useFakeTimers();
    document.body.dataset.modalCount = '0';
    render(
      <ThemeProvider>
        <ToastProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </ToastProvider>
      </ThemeProvider>
    );
    act(() => jest.advanceTimersByTime(2000));
    const spCard = await screen.findByText('S&P 500');
    fireEvent.click(spCard);
    expect(document.body.dataset.modalCount).toBe('2');
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    jest.advanceTimersByTime(500);
    expect(document.body.dataset.modalCount).toBe('1');
    jest.useRealTimers();
  });

  test('renders loading state initially', async () => {
    jest.useFakeTimers();
    render(
      <ThemeProvider>
        <ToastProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </ToastProvider>
      </ThemeProvider>
    );
    // Before advancing timers, check for loading skeleton
    expect(screen.getByTestId('signal-feed-skeleton')).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(2000));
    // After loading, skeleton should not be present
    expect(screen.queryByTestId('signal-feed-skeleton')).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  test('loads persisted view mode from localStorage on mount', async () => {
    (localStorage.getItem as jest.MockedFunction<typeof localStorage.getItem>).mockReturnValue('list');
    jest.useFakeTimers();
    const { getByTestId } = render(
      <ThemeProvider>
        <ToastProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </ToastProvider>
      </ThemeProvider>
    );
    act(() => jest.advanceTimersByTime(2000));
    const container = getByTestId('market-pulse-container');
    // Should load in list view (flex-col)
    await waitFor(() => expect(container.className).toMatch(/flex-col/));
    jest.useRealTimers();
  });

  test('opens modal for Bitcoin pulse and displays correct timeframe and badge', async () => {
    jest.useFakeTimers();
    render(
      <ThemeProvider>
        <ToastProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </ToastProvider>
      </ThemeProvider>
    );
    act(() => jest.advanceTimersByTime(2000));
    const bitcoinCard = await screen.findByText('Bitcoin');
    fireEvent.click(bitcoinCard);
    expect(screen.getByText('24H')).toBeInTheDocument();
    expect(screen.getByText('AH')).toBeInTheDocument();
    // Verify modal content for Bitcoin
    expect(screen.getByText(/Bitcoin/i)).toBeInTheDocument();
    jest.useRealTimers();
  });

  test('displays AI overview in modal after loading', async () => {
    jest.useFakeTimers();
    render(
      <ThemeProvider>
        <ToastProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </ToastProvider>
      </ThemeProvider>
    );
    act(() => jest.advanceTimersByTime(2000));
    const spCard = await screen.findByText('S&P 500');
    fireEvent.click(spCard);
    // Wait for AI overview to load (mocked)
    await waitFor(() => expect(screen.getByText('Mock summary')).toBeInTheDocument());
    expect(screen.getByText('Mock full sentiment')).toBeInTheDocument();
    jest.useRealTimers();
  });

  test('chart placeholder updates for different timeframes in modal', async () => {
    jest.useFakeTimers();
    const { getByText } = render(
      <ThemeProvider>
        <ToastProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </ToastProvider>
      </ThemeProvider>
    );
    act(() => jest.advanceTimersByTime(2000));
    const spCard = await screen.findByText('S&P 500');
    fireEvent.click(spCard);
    // Default 1D
    expect(screen.getByText(/Stock Chart Placeholder/).textContent).toContain('1D');
    // Switch to 3M
    const threeMonthBtn = getByText('3M');
    fireEvent.click(threeMonthBtn);
    expect(screen.getByText(/Stock Chart Placeholder/).textContent).toContain('3M');
    jest.useRealTimers();
  });

  test('modal does not open if already open', async () => {
    jest.useFakeTimers();
    document.body.dataset.modalCount = '1';
    render(
      <ThemeProvider>
        <ToastProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </ToastProvider>
      </ThemeProvider>
    );
    act(() => jest.advanceTimersByTime(2000));
    const spCard = await screen.findByText('S&P 500');
    fireEvent.click(spCard);
    // Modal count should not increase if already open
    expect(document.body.dataset.modalCount).toBe('1');
    jest.useRealTimers();
  });
});
