import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import App from '@/app/home/page';

describe('MarketPulseCard Timeframe badges', () => {
  test('renders timeframe chip when provided on about market pulse page', () => {
    render(<App />);
    // The Market Pulse header contains Market Pulse and a '1D' timeframe chip for mock items
    // Find at least one of the timeframe chips
    expect(screen.getByText('1D')).toBeInTheDocument();
    // Bitcoin's timeframe is '24H' as per mockPulse; assert it is visible
    expect(screen.getByText('24H')).toBeInTheDocument();
    // And the Bitcoin after-hours badge 'AH' should be visible next to 24H
    expect(screen.getByText('AH')).toBeInTheDocument();
  });
});
