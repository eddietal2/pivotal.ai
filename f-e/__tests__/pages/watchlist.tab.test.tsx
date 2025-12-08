import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import WatchlistPage from '@/app/watchlist/page';

describe('Watchlist tabs', () => {
  test('tablist exists and Watchlist selected by default and shows panel', () => {
    render(<WatchlistPage />);
    const tablist = screen.getByRole('tablist', { name: /watchlist segments/i });
    expect(tablist).toBeInTheDocument();

    const watchlistTab = screen.getByRole('tab', { name: /Watchlist/i });
    expect(watchlistTab).toHaveAttribute('aria-selected', 'true');

    const watchlistPanel = screen.getByRole('tabpanel', { name: /Watchlist/i });
    expect(watchlistPanel).toBeInTheDocument();
    expect(watchlistPanel).not.toHaveAttribute('hidden');

    const strategyPanel = screen.getByRole('tabpanel', { name: /Strategy Builder/i });
    expect(strategyPanel).toHaveAttribute('hidden');
  });

  test('toggling tabs switches panels', () => {
    render(<WatchlistPage />);
    const strategyTab = screen.getByRole('tab', { name: /Strategy Builder/i });
    fireEvent.click(strategyTab);
    expect(strategyTab).toHaveAttribute('aria-selected', 'true');
    const strategyPanel = screen.getByRole('tabpanel', { name: /Strategy Builder/i });
    expect(strategyPanel).not.toHaveAttribute('hidden');
  });
});
