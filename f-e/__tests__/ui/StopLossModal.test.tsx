// Mock MarketOverview to render immediately without delay
jest.mock('@/components/ui/MarketOverview', () => {
  return function MockMarketOverview() {
    return <div data-testid="market-overview">Market Pulse Overview</div>;
  };
});

// Mock fetch to prevent network errors and act() warnings
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      '^GSPC': { change: 1.2, price: '4500.00' },
      '^DJI': { change: -0.8, price: '34000.00' }
    }),
  })
) as unknown as jest.MockedFunction<typeof fetch>;

// Mock the fetchMarketData function to prevent state updates
jest.mock('@/app/home/page', () => {
  const actual = jest.requireActual('@/app/home/page');
  const MockedApp = () => {
    // Mock the component without the useEffect that causes state updates
    return actual.default();
  };
  // Prevent the useEffect from running
  MockedApp.fetchMarketData = jest.fn();
  return MockedApp;
});

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '@/app/home/page';
import { ThemeProvider } from '@/components/context/ThemeContext';
import { ToastProvider } from '@/components/context/ToastContext';
import { UIProvider } from '@/components/context/UIContext';

describe('Stop Loss modal flow', () => {
  test('clicking stop loss opens modal and shows content', async () => {
    render(
      <ThemeProvider>
        <ToastProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </ToastProvider>
      </ThemeProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Disclaimers & Risk Notices')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    const stopLossBtn = await screen.findByRole('button', { name: /learn more/i });
    expect(stopLossBtn).toBeInTheDocument();
    fireEvent.click(stopLossBtn);
    await waitFor(() => {
      expect(screen.getByText('Stop Loss Reminder')).toBeInTheDocument();
    });
    // Check that modal opens (title should be visible)
    expect(screen.getByText(/Stop Loss Reminder/)).toBeInTheDocument();
    // Close modal
    fireEvent.click(screen.getByTestId('modal-close-bottom'));
    await waitFor(() => {
      // Modal should be closed (data-modal-count should be 0)
      expect(document.body).toHaveAttribute('data-modal-count', '0');
    });
  });

  test('modal is not visible initially', async () => {
    render(
      <ThemeProvider>
        <ToastProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </ToastProvider>
      </ThemeProvider>
    );
    expect(screen.queryByText('Stop Loss Reminder')).not.toBeInTheDocument();
  });

  test('closing modal removes it from DOM', async () => {
    render(
      <ThemeProvider>
        <ToastProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </ToastProvider>
      </ThemeProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Disclaimers & Risk Notices')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    const stopLossBtn = await screen.findByRole('button', { name: /learn more/i });
    fireEvent.click(stopLossBtn);
    await waitFor(() => {
      expect(screen.getByText('Stop Loss Reminder')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('modal-close-bottom'));
    await waitFor(() => {
      // Modal should be closed (data-modal-count should be 0)
      expect(document.body).toHaveAttribute('data-modal-count', '0');
    });
  });
});
