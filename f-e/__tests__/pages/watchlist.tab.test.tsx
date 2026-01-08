import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import WatchlistPage from '@/app/watchlist/page';

describe('Watchlist page (Market Pulse)', () => {
  test('renders Market Pulse and timeframe filters', () => {
    render(<WatchlistPage />);
    // Ensure the Market Pulse header is present
    expect(screen.getByText(/Market Pulse/i)).toBeInTheDocument();
    // Timeframe filter D should be present and selected by default
    const dFilter = screen.getByTestId('pulse-filter-D');
    expect(dFilter).toBeInTheDocument();
    expect(dFilter).toHaveAttribute('aria-pressed', 'true');
    // Market pulse container should render items
    expect(screen.getByTestId('market-pulse-container')).toBeInTheDocument();
  });

  test('changing timeframe updates selected filter', () => {
    render(<WatchlistPage />);
    const wFilter = screen.getByTestId('pulse-filter-W');
    expect(wFilter).toBeInTheDocument();
    expect(wFilter).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(wFilter);
    expect(wFilter).toHaveAttribute('aria-pressed', 'true');
  });
});
