// Mock MarketOverview to render immediately without delay
jest.mock('@/components/ui/MarketOverview', () => {
  return function MockMarketOverview() {
    return <div data-testid="market-overview">Market Pulse Overview</div>;
  };
});

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '@/app/home/page';
import { ThemeProvider } from '@/components/context/ThemeContext';
import { ToastProvider } from '@/components/context/ToastContext';
import { UIProvider } from '@/components/context/UIContext';

describe('Disclaimer modal flow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('clicking disclaimer alert opens disclaimer modal and content is present', async () => {
    render(
      <ThemeProvider>
        <ToastProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </ToastProvider>
      </ThemeProvider>
    );
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    // The interactive disclaimer alert should exist
    const disclaimerAlert = await screen.findByLabelText('Open disclaimer details');
    expect(disclaimerAlert).toBeInTheDocument();
    // Click the alert to open the modal
    fireEvent.click(disclaimerAlert);
    // The modal title should be visible
    expect(screen.getByRole('heading', { name: 'Legal Disclaimer' })).toBeInTheDocument();
    // Expect content sections to be present (one sample check)
    expect(screen.getByText(/does not constitute financial advice/i)).toBeInTheDocument();
    // Close the modal using the close button
    fireEvent.click(screen.getByTestId('modal-close-bottom'));
  });
});
