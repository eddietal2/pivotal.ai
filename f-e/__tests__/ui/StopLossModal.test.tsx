// Mock MarketOverview to render immediately without delay
jest.mock('@/components/ui/MarketOverview', () => {
  return function MockMarketOverview() {
    return <div data-testid="market-overview">Market Pulse Overview</div>;
  };
});

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    const stopLossBtn = await screen.findByRole('button', { name: /stop loss/i });
    expect(stopLossBtn).toBeInTheDocument();
    fireEvent.click(stopLossBtn);
    await waitFor(() => {
      expect(screen.getByText('Stop Loss Reminder')).toBeInTheDocument();
    });
    expect(screen.getByText(/A stop loss is an order designed to limit an investor’s loss/i)).toBeInTheDocument();
    // Close modal
    fireEvent.click(screen.getByLabelText('Close modal'));
    await waitFor(() => {
      expect(screen.queryByText('Stop Loss Reminder')).not.toBeInTheDocument();
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
    const stopLossBtn = await screen.findByRole('button', { name: /stop loss/i });
    fireEvent.click(stopLossBtn);
    await waitFor(() => {
      expect(screen.getByText('Stop Loss Reminder')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('Close modal'));
    await waitFor(() => {
      expect(screen.queryByText('Stop Loss Reminder')).not.toBeInTheDocument();
    });
  });
});
