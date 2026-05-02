import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '@/app/home/page';
import { ThemeProvider } from '@/components/context/ThemeContext';
import { ToastProvider } from '@/components/context/ToastContext';
import { UIProvider } from '@/components/context/UIContext';
import { PivyChatProvider } from '@/components/context/PivyChatContext';
import { PaperTradingProvider } from '@/components/context/PaperTradingContext';
import { FavoritesProvider } from '@/components/context/FavoritesContext';
import { MarketStatusProvider } from '@/components/context/MarketStatusContext';
import { WatchlistProvider } from '@/components/context/WatchlistContext';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => '/home',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
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


describe('Stop Loss modal flow', () => {
  test('clicking stop loss opens modal and shows content', async () => {
    render(
      <MarketStatusProvider>
        <ThemeProvider>
          <ToastProvider>
            <UIProvider>
              <FavoritesProvider>
                <WatchlistProvider>
                  <PaperTradingProvider>
                    <PivyChatProvider>
                      <App />
                    </PivyChatProvider>
                  </PaperTradingProvider>
                </WatchlistProvider>
              </FavoritesProvider>
            </UIProvider>
          </ToastProvider>
        </ThemeProvider>
      </MarketStatusProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Disclaimers & Risk Notices')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Expand the Disclaimers section (it's collapsed by default)
    const expandBtns = screen.getAllByRole('button', { name: /Expand section/i });
    const disclaimersExpandBtn = expandBtns.find(btn => btn.textContent?.includes('Disclaimers'));
    if (disclaimersExpandBtn) fireEvent.click(disclaimersExpandBtn);
    
    const stopLossBtn = await screen.findByRole('button', { name: /open stop loss details/i });
    expect(stopLossBtn).toBeInTheDocument();
    fireEvent.click(stopLossBtn);
    await waitFor(() => {
      expect(document.querySelector('[role="dialog"]')).toBeTruthy();
    });
    // Check that modal opens (title should be visible)
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    // Close modal
    fireEvent.click(screen.getByTestId('modal-close-bottom'));
    await waitFor(() => {
      // Modal should be closed (data-modal-count should be 0)
      expect(document.body).toHaveAttribute('data-modal-count', '0');
    });
  });

  test('modal is not visible initially', async () => {
    render(
      <MarketStatusProvider>
        <ThemeProvider>
          <ToastProvider>
            <UIProvider>
              <FavoritesProvider>
                <WatchlistProvider>
                  <PaperTradingProvider>
                    <PivyChatProvider>
                      <App />
                    </PivyChatProvider>
                  </PaperTradingProvider>
                </WatchlistProvider>
              </FavoritesProvider>
            </UIProvider>
          </ToastProvider>
        </ThemeProvider>
      </MarketStatusProvider>
    );
    expect(screen.queryByText('Stop Loss Reminder')).not.toBeInTheDocument();
  });

  test('closing modal removes it from DOM', async () => {
    render(
      <MarketStatusProvider>
        <ThemeProvider>
          <ToastProvider>
            <UIProvider>
              <FavoritesProvider>
                <WatchlistProvider>
                  <PaperTradingProvider>
                    <PivyChatProvider>
                      <App />
                    </PivyChatProvider>
                  </PaperTradingProvider>
                </WatchlistProvider>
              </FavoritesProvider>
            </UIProvider>
          </ToastProvider>
        </ThemeProvider>
      </MarketStatusProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Disclaimers & Risk Notices')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Expand the Disclaimers section (it's collapsed by default)
    const expandBtns = screen.getAllByRole('button', { name: /Expand section/i });
    const disclaimersExpandBtn = expandBtns.find(btn => btn.textContent?.includes('Disclaimers'));
    if (disclaimersExpandBtn) fireEvent.click(disclaimersExpandBtn);
    
    const stopLossBtn = await screen.findByRole('button', { name: /open stop loss details/i });
    fireEvent.click(stopLossBtn);
    await waitFor(() => {
      expect(document.querySelector('[role="dialog"]')).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId('modal-close-bottom'));
    await waitFor(() => {
      // Modal should be closed (data-modal-count should be 0)
      expect(document.body).toHaveAttribute('data-modal-count', '0');
    });
  });
});
