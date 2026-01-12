import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import WatchListItem from '@/components/watchlist/WatchListItem';

describe('WatchListItem', () => {
  test('renders ticker, price, sparkline and up arrow for positive change', () => {
    render(<WatchListItem name="Apple Inc." symbol="AAPL" price="$180.50" change={2.15} sparkline={[170, 175, 178, 180, 181]} />);
    expect(screen.getByText('Apple Inc. (AAPL)')).toBeInTheDocument();
    expect(screen.getByText('$180.50')).toBeInTheDocument();
    // Sparkline svg is present
    expect(screen.getByTestId('sparkline-svg')).toBeInTheDocument();
    // Positive change will render with a + sign and should be in green text
    expect(screen.getByText('+2.15%')).toBeInTheDocument();
    // The button should have watchlist-item data-testid
    expect(screen.getByTestId('watchlist-item-AAPL')).toBeInTheDocument();
  });

  test('renders down arrow and red change for negative change', () => {
    render(<WatchListItem name="Tesla Inc." symbol="TSLA" price="$260.10" change={-1.45} sparkline={[260, 259, 258, 257, 256]} />);
    expect(screen.getByText('Tesla Inc. (TSLA)')).toBeInTheDocument();
    expect(screen.getByText('$260.10')).toBeInTheDocument();
    expect(screen.getByTestId('sparkline-svg')).toBeInTheDocument();
    expect(screen.getByText('-1.45%')).toBeInTheDocument();
    expect(screen.getByTestId('watchlist-item-TSLA')).toBeInTheDocument();
  });

  test('renders RV (Relative Volume) when provided', () => {
    render(<WatchListItem name="Bitcoin" symbol="BTC-USD" price="$45,000" change={1.2} rv={1.5} />);
    expect(screen.getByText('RV: 1.50x')).toBeInTheDocument();
  });

  test('renders value change when provided', () => {
    render(<WatchListItem name="Gold" symbol="GC=F" price="$1,950" change={0.8} valueChange={15.6} />);
    expect(screen.getByText((content, element) => element?.textContent === '$+15.60')).toBeInTheDocument();
  });

  test('renders timeframe chip when provided', () => {
    render(<WatchListItem name="S&P 500" symbol="^GSPC" price="4,500" change={-0.5} timeframe="1D" />);
    expect(screen.getByText('1D')).toBeInTheDocument();
  });

  test('renders after hours indicator when afterHours is true', () => {
    render(<WatchListItem name="Apple Inc." symbol="AAPL" price="$180.50" change={2.15} timeframe="1D" afterHours={true} />);
    expect(screen.getByText('AH')).toBeInTheDocument();
  });

  test('handles zero change correctly', () => {
    render(<WatchListItem name="Stable Coin" symbol="USDC" price="$1.00" change={0} />);
    expect(screen.getByText('+0.00%')).toBeInTheDocument();
  });

  test('renders without sparkline when sparkline is empty', () => {
    render(<WatchListItem name="No Data" symbol="NODATA" price="$0.00" change={0} sparkline={[]} />);
    expect(screen.queryByTestId('sparkline-svg')).not.toBeInTheDocument();
  });

  test('applies correct aria-label for accessibility', () => {
    render(<WatchListItem name="Test Stock" symbol="TEST" price="$100" change={1.0} timeframe="1W" afterHours={true} />);
    const button = screen.getByTestId('watchlist-item-TEST');
    expect(button).toHaveAttribute('aria-label', 'More info about Test Stock (TEST), timeframe 1W, after hours');
  });
});
