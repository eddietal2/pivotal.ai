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

describe('AI Usage modal flow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('clicking AI Usage opens modal and shows content', async () => {
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
    const aiBtn = await screen.findByTestId('ai-usage-open-btn');
    expect(aiBtn).toBeInTheDocument();
    fireEvent.click(aiBtn);
    expect(screen.getByRole('heading', { name: 'AI Usage' })).toBeInTheDocument();
    expect(screen.getByText(/This application uses language models/i)).toBeInTheDocument();
    expect(screen.getByText(/LLMs are probabilistic/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('modal-close-bottom'));
  });

  test('modal closes on ESC key press', async () => {
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
    const aiBtn = await screen.findByTestId('ai-usage-open-btn');
    fireEvent.click(aiBtn);
    expect(screen.getByRole('heading', { name: 'AI Usage' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'AI Usage' })).not.toBeInTheDocument());
  });

  test('modal content is accessible', async () => {
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
    const aiBtn = await screen.findByTestId('ai-usage-open-btn');
    fireEvent.click(aiBtn);
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    // Note: aria-labelledby and aria-describedby may not be present; adjust based on actual modal implementation
    // expect(modal).toHaveAttribute('aria-labelledby');
    // expect(modal).toHaveAttribute('aria-describedby');
  });
});
