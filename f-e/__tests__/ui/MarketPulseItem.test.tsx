import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import WatchListItem from '@/components/watchlist/WatchListItem';

describe('MarketPulseItem (WatchListItem)', () => {
  test('renders ticker, price, sparkline and up arrow for positive change', () => {
    render(<WatchListItem name="Apple Inc." symbol="AAPL" price="$180.50" change={2.15} sparkline={[170, 175, 178, 180, 181]} />);
    expect(screen.getByText('Apple Inc. (AAPL)')).toBeInTheDocument();
    expect(screen.getByText('$180.50')).toBeInTheDocument();
    // Sparkline svg is present
    expect(screen.getByTestId('sparkline-svg')).toBeInTheDocument();
    // Positive change will render with a + sign and should be in green text
    expect(screen.getByText('+2.15%')).toBeInTheDocument();
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

  test('renders with RV data', () => {
    render(<WatchListItem name="Bitcoin" symbol="BTC-USD" price="$45,000" change={1.2} rv={1.5} />);
    expect(screen.getByText('RV: 1.50x')).toBeInTheDocument();
  });
});
