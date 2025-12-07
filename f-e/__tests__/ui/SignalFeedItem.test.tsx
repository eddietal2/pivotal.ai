import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import SignalFeedItem from '@/components/ui/SignalFeedItem';

// Mock useToast from ToastContext
const mockShowToast = jest.fn();
jest.mock('@/components/context/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast, hideToast: jest.fn() }),
}));

describe('SignalFeedItem', () => {
  test('clicking Add to Watchlist triggers a success toast', () => {
    render(
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
  });
});
