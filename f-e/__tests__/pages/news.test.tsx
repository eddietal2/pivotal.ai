import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  test('clicking a calendar day opens a modal with that day catalysts and feed is not filtered', async () => {
    render(<NewsPage />);
    const dayBtns = screen.getAllByRole('button', { name: /Show events for/i });
    expect(dayBtns.length).toBeGreaterThan(0);
    fireEvent.click(dayBtns[0]);

    // Wait for modal to open (close top button present)
    const closeTop = await screen.findByTestId('modal-close-top');
    expect(closeTop).toBeInTheDocument();

    // The AMD article should be present inside the modal
    await waitFor(() => expect(screen.getByText(/AMD Gains 5%/)).toBeInTheDocument());

    // The feed should still contain articles from other days (e.g., AAPL)
    expect(screen.getByText(/Apple Files New Patent/)).toBeInTheDocument();
  });
});
