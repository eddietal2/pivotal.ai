import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import NewsFeedFilters from '@/components/ui/NewsFeedFilters';

describe('NewsFeedFilters', () => {
  const watchlists = ['All Watchlists','Tech Setups'];
  test('calls handlers for watchlist select and search', () => {
    const onWatchlistChange = jest.fn();
    const onQueryChange = jest.fn();
    const onSentimentChange = jest.fn();

    render(<NewsFeedFilters
      watchlists={watchlists}
      selectedWatchlist={watchlists[0]}
      onWatchlistChange={onWatchlistChange}
      sentiment={'all'}
      onSentimentChange={onSentimentChange}
      query={''}
      onQueryChange={onQueryChange}
    />);

    // Change the select
    fireEvent.change(screen.getByLabelText('Watchlist'), { target: { value: watchlists[1] } });
    expect(onWatchlistChange).toHaveBeenCalledWith(watchlists[1]);

    // Search input
    const input = screen.getByPlaceholderText(/Search articles, tickers, keywords/i);
    fireEvent.change(input, { target: { value: 'AMD' } });
    expect(onQueryChange).toHaveBeenCalledWith('AMD');

    // Click sentiment button
    const bullish = screen.getByRole('button', { name: /Bullish/i });
    fireEvent.click(bullish);
    expect(onSentimentChange).toHaveBeenCalledWith('bullish');
  });
});
