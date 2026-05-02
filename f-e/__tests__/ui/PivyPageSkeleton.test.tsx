import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import PivyPage from '../../app/pivy/page';
import { MarketStatusProvider } from '@/components/context/MarketStatusContext';

// Mock useSearchParams
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

describe('Pivy page skeletons', () => {
  test('renders chat card skeletons when loading initially', () => {
    jest.useFakeTimers();
    render(<MarketStatusProvider><PivyPage /></MarketStatusProvider>);
    
    // Should show skeleton elements with animate-pulse class
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
    
    // Should show candlestick animation during loading
    expect(screen.getByTestId('candlestick-animation')).toBeInTheDocument();
  });

  test('component renders without crashing', () => {
    render(<MarketStatusProvider><PivyPage /></MarketStatusProvider>);
    
    // Basic smoke test - component should render
    expect(screen.getByTestId('candlestick-animation')).toBeInTheDocument();
  });

  test('skeleton demo toggle was removed', () => {
    render(<MarketStatusProvider><PivyPage /></MarketStatusProvider>);
    // The dev toggle was removed; ensure the toggle is not present
    expect(screen.queryByTestId('skeleton-toggle')).not.toBeInTheDocument();
  });
});
