import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import NewsPage from '@/app/news/page';

describe('News page', () => {
  test('renders and shows articles for the selected day and search filters work', () => {
    render(<NewsPage />);
    // Ensure the calendar heading exists
    expect(screen.getByText(/Upcoming Catalysts/)).toBeInTheDocument();

    // Ensure the feed heading exists
    expect(screen.getByText(/Watchlist News Feed/)).toBeInTheDocument();

    // Should show the AMD article by default
    expect(screen.getByText(/AMD Gains 5%/)).toBeInTheDocument();

    // Search for an unlikely string should show no results
    const input = screen.getByPlaceholderText(/Search articles, tickers, keywords/i);
    fireEvent.change(input, { target: { value: 'NOTFOUND' } });
    expect(screen.getByText(/No articles found for the selected filters/)).toBeInTheDocument();
  });
});
