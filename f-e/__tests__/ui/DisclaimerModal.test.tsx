import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '@/app/home/page';
import { ThemeProvider } from '@/components/context/ThemeContext';
import { ToastProvider } from '@/components/context/ToastContext';
import { UIProvider } from '@/components/context/UIContext';
import { PivyChatProvider } from '@/components/context/PivyChatContext';
import { PaperTradingProvider } from '@/components/context/PaperTradingContext';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

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
            <PaperTradingProvider>
              <PivyChatProvider>
                <App />
              </PivyChatProvider>
            </PaperTradingProvider>
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
