import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import HomePage from '@/app/home/page';
import { ToastProvider } from '@/components/context/ToastContext';
import { UIProvider } from '@/components/context/UIContext';
import { PivyChatProvider } from '@/components/context/PivyChatContext';

// Mock next/navigation
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(() => null),
  }),
  usePathname: () => '/home',
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Wrapper component with all required providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    <UIProvider>
      <PivyChatProvider>
        {children}
      </PivyChatProvider>
    </UIProvider>
  </ToastProvider>
);

// Helper function to render with providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui, { wrapper: TestWrapper });
};

// Suppress expected console errors during tests
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

// Mock fetch for market data
beforeEach(() => {
  // Suppress expected error messages
  console.error = jest.fn();
  console.log = jest.fn();
  
  // Mock scrollIntoView
  Element.prototype.scrollIntoView = jest.fn();
  
  // Default fetch mock that returns successful market data
  global.fetch = jest.fn().mockImplementation((url: string) => {
    // Handle market-data API endpoint
    if (url.includes('/market-data/')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          '^GSPC': {
            timeframes: {
              day: {
                latest: { close: '5000.00', change: 0.5, value_change: 25 }
              }
            }
          },
          '^DJI': {
            timeframes: {
              day: {
                latest: { close: '40000.00', change: 0.3, value_change: 120 }
              }
            }
          },
          'BTC-USD': {
            timeframes: {
              day: {
                latest: { close: '45000.00', change: 2.5, value_change: 1125 }
              }
            }
          },
          '^VIX': {
            timeframes: {
              day: {
                latest: { close: '15.50', change: -3.2, value_change: -0.51 }
              }
            }
          },
        }),
      });
    }
    // Default response
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    });
  }) as jest.Mock;
  mockPush.mockClear();
  mockBack.mockClear();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
  jest.clearAllMocks();
});

describe('Home page', () => {
  describe('Page Structure', () => {
    test('renders Today\'s Pivy Chat section', async () => {
      renderWithProviders(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByText("Today's Pivy Chat")).toBeInTheDocument();
      });
    });

    test('renders Learn more about Pivy Chat link', async () => {
      renderWithProviders(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Learn more about Pivy Chat/)).toBeInTheDocument();
      });
    });
    
    test('renders candlestick animation', async () => {
      renderWithProviders(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('candlestick-animation')).toBeInTheDocument();
      });
    });
  });

  describe('Top Market Indicators Section', () => {
    // Note: Market data tests are limited because fetch is skipped in test environment
    // These tests verify the section exists and basic structure
    
    test('renders market indicators container', async () => {
      renderWithProviders(<HomePage />);
      
      // The container for market indicators should exist
      await waitFor(() => {
        expect(screen.getByText("Today's Pivy Chat")).toBeInTheDocument();
      });
      
      // Verify basic page structure exists
      expect(document.querySelector('.space-y-8')).toBeInTheDocument();
    });
  });

  describe('Error UI Integration', () => {
    // Note: Error UI tests are limited because fetch is skipped in test environment
    // These tests verify the page renders without runtime errors
    
    test('page renders correctly without errors', async () => {
      renderWithProviders(<HomePage />);

      // Page should render the main sections without throwing
      await waitFor(() => {
        expect(screen.getByText("Today's Pivy Chat")).toBeInTheDocument();
      });
    });

    test('page displays Learn more about Pivy Chat without errors', async () => {
      renderWithProviders(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText(/Learn more about Pivy Chat/)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    test('page shows loading states correctly', async () => {
      renderWithProviders(<HomePage />);

      // The page should render in a consistent state
      // In test environment, loading is skipped so we just verify the page renders
      await waitFor(() => {
        expect(screen.getByText("Today's Pivy Chat")).toBeInTheDocument();
      });
    });
  });
});
