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

    // The calendar event (FOMC Rate Decision) should be present inside the modal
    await waitFor(() => expect(screen.getByText(/FOMC Rate Decision/)).toBeInTheDocument());
    // Legend shows all colors: Bullish (green), Bearish (red), Neutral (orange)
    const legend = screen.getByTestId('calendar-legend');
    expect(legend).toBeInTheDocument();
    expect(screen.getByTestId('legend-dot-bullish')).toHaveClass('bg-green-500');
    expect(screen.getByTestId('legend-dot-bearish')).toHaveClass('bg-red-500');
    expect(screen.getByTestId('legend-dot-neutral')).toHaveClass('bg-orange-400');
    // The modal should show sentiment dot for the event and it should be red (bearish)
    const modalDot = screen.getByTestId('calendar-modal-dot-c1');
    expect(modalDot).toHaveClass('bg-red-500');

    // The feed should still contain articles from other days (e.g., AAPL)
    expect(screen.getByText(/Apple Files New Patent/)).toBeInTheDocument();
  });

  test('the second day modal shows mixed (orange) for catalyst event', async () => {
    render(<NewsPage />);
    const dayBtns = screen.getAllByRole('button', { name: /Show events for/i });
    expect(dayBtns.length).toBeGreaterThan(1);
    fireEvent.click(dayBtns[1]);
    await waitFor(() => expect(screen.getByText(/Earnings Call: AMD/)).toBeInTheDocument());
    // c3 is catalyst (mixed), c2 is bullish
    const modalDotC2 = screen.getByTestId('calendar-modal-dot-c2');
    const modalDotC3 = screen.getByTestId('calendar-modal-dot-c3');
    expect(modalDotC2).toHaveClass('bg-green-500');
    expect(modalDotC3).toHaveClass('bg-orange-400');
  });

  test('clicking on an article opens the article modal', async () => {
    render(<NewsPage />);
    // click the AMD article (outer card should have testid)
    const articleCard = screen.getByTestId('news-article-1');
    expect(articleCard).toBeInTheDocument();
    articleCard.click();
    // modal should open with headline
    const closeTop = await screen.findByTestId('modal-close-top');
    expect(screen.getByText(/AMD Gains 5%/)).toBeInTheDocument();
    fireEvent.click(closeTop);
    await waitFor(() => expect(screen.queryByTestId('modal-close-top')).not.toBeInTheDocument());
  });

  test('calendar header shows calendar-specific events (not news feed)', () => {
    render(<NewsPage />);
    // header should show the calendar event title for the selected day (FOMC Rate Decision)
    expect(screen.getByText(/FOMC Rate Decision/)).toBeInTheDocument();
    // feed still contains AMD article
    expect(screen.getByText(/AMD Gains 5%/)).toBeInTheDocument();
  });
});
