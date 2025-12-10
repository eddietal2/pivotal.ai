import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import SignalFeedItem from '@/components/ui/SignalFeedItem';
import { SignalFeedSkeleton } from '@/components/ui/skeletons';

// Mock useToast from ToastContext
const mockShowToast = jest.fn();
jest.mock('@/components/context/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast, hideToast: jest.fn() }),
}));

describe('SignalFeedItem', () => {
  test('clicking Add to Watchlist triggers a success toast', () => {
    const { container } = render(
      <SignalFeedItem
        ticker="TSLA"
        signal="Test signal"
        confluence={["Test1"]}
        timeframe="1D"
        change={"-1.2%"}
        type={"Bearish"}
      />
    );

    const btn = screen.getByRole('button', { name: /Add to Watchlist|Added/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(mockShowToast).toHaveBeenCalledWith('Added to watchlist', 'success');

    // signal feed item should have a mobile min-height set
    const root = screen.getByTestId('signal-feed-item');
    expect(root).toBeInTheDocument();
    expect(root.className).toContain('min-h-[170px]');
  });
});

test('renders the sentiment pill (top-right) with the correct label', () => {
  render(
    <SignalFeedItem
      ticker="TSLA"
      signal="Test signal"
      confluence={["Test1"]}
      timeframe="1D"
      change={'-1.2%'}
      type={'Bullish'}
    />
  );

  const pill = screen.getByText(/Bullish/i);
  expect(pill).toBeInTheDocument();
  // Ensure it's near the top-right by checking style class exists (not exact layout test)
  expect(pill.closest('div')).toHaveClass('rounded-full');
});

test('Chart modal contains a timeline filter and updates timeframe', () => {
  const { container } = render(
    <SignalFeedItem
      ticker="TSLA"
      signal="Test signal"
      confluence={["Test1"]}
      timeframe="1D"
      change={"-1.2%"}
      type={"Bearish"}
    />
  );

  // Open the chart modal
  const viewChartBtn = screen.getByRole('button', { name: /View Chart/i });
  fireEvent.click(viewChartBtn);

  // Chart placeholder shows default timeframe (1D) in the label
  const chartPlaceholder = screen.getByTestId('chart-modal-placeholder');
  expect(chartPlaceholder).toBeInTheDocument();
  expect(chartPlaceholder).toHaveTextContent(/1D/);

  // The human-readable timeframe pill under the chart should be visible
  const timeframePill = screen.getByTestId('chart-modal-timeframe-pill');
  expect(timeframePill).toBeInTheDocument();
  expect(timeframePill).toHaveTextContent(/In the Last Day/);
  // The human-readable timeframe pill near the price should also be visible
  const timeframePillHeader = screen.getByTestId('chart-modal-timeframe-pill-header');
  expect(timeframePillHeader).toBeInTheDocument();
  expect(timeframePillHeader).toHaveTextContent(/In the Last Day/);

  // root element should have min-height class on mobile
  expect(container.firstChild).toHaveClass('min-h-[220px]');

  // Timeline filter buttons should be present and affect the timeframe text
  const weekFilter = screen.getByTestId('modal-chart-filter-1W');
  expect(weekFilter).toBeInTheDocument();
  expect(weekFilter).toHaveAttribute('aria-pressed', 'false');
  fireEvent.click(weekFilter);
  expect(weekFilter).toHaveAttribute('aria-pressed', 'true');
  expect(chartPlaceholder).toHaveTextContent(/1W/);
  expect(timeframePill).toHaveTextContent(/In the Last Week/);
  expect(timeframePillHeader).toHaveTextContent(/In the Last Week/);
});

test('SignalFeedSkeleton has the same min-height class used by SignalFeedItem to ensure consistent mobile heights', () => {
  const { container } = render(<SignalFeedSkeleton />);
  expect(container.firstChild).toHaveClass('min-h-[220px]');
});
