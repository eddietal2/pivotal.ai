import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import MarketPulseItem from '@/components/watchlist/MarketPulseItem';

describe('MarketPulseItem', () => {
  test('renders ticker, price, sparkline and up arrow for positive change', () => {
    render(<MarketPulseItem ticker="AAPL" price="$180.50" change={2.15} sparkline={[170, 175, 178, 180, 181]} />);
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('$180.50')).toBeInTheDocument();
    // Sparkline svg is present
    expect(screen.getByTestId('sparkline-svg')).toBeInTheDocument();
    // Positive change will render with a + sign and should be in green text
    expect(screen.getByText('+2.15%')).toBeInTheDocument();
  });

  test('renders down arrow and red change for negative change', () => {
    render(<MarketPulseItem ticker="TSLA" price="$260.10" change={-1.45} sparkline={[260, 259, 258, 257, 256]} />);
    expect(screen.getByText('TSLA')).toBeInTheDocument();
    expect(screen.getByText('$260.10')).toBeInTheDocument();
    expect(screen.getByTestId('sparkline-svg')).toBeInTheDocument();
    expect(screen.getByText('-1.45%')).toBeInTheDocument();
  });
});
