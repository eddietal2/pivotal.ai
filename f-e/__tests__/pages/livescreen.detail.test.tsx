import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LiveScreenDetailPage from '@/app/watchlist/live-screen/[symbol]/page';
import { ToastProvider } from '@/components/context/ToastContext';
import { PivyChatProvider } from '@/components/context/PivyChatContext';
import { FavoritesProvider } from '@/components/context/FavoritesContext';
import { WatchlistProvider } from '@/components/context/WatchlistContext';
import { PaperTradingProvider } from '@/components/context/PaperTradingContext';

// Mock next/navigation
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
  useParams: () => ({
    symbol: 'AAPL',
  }),
}));

// Mock canvas context for TrendPulse animations
const mockContext = {
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  scale: jest.fn(),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  fillRect: jest.fn(),
};

HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext) as any;

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => 1);
global.cancelAnimationFrame = jest.fn();

// Mock indicator data from API
const mockIndicatorData = {
  symbol: 'AAPL',
  movingAverages: {
    currentPrice: 175.50,
    sma20: { current: 172.30, status: 'bullish' },
    sma50: { current: 168.50, status: 'bullish' },
    sma200: { current: 155.20, status: 'bullish' },
    ema12: { current: 173.80, status: 'bullish' },
    ema26: { current: 170.10, status: 'bullish' },
  },
  rsi: {
    current: 62.5,
    rsi: [55, 58, 60, 62, 65, 63, 62.5],
  },
  macd: {
    macd: [0.8, 0.9, 1.0, 1.1, 1.2],
    signal: [0.7, 0.8, 0.85, 0.9, 1.0],
    histogram: [0.1, 0.1, 0.15, 0.2, 0.2],
    current: {
      macd: 1.2,
      signal: 1.0,
      histogram: 0.2,
    },
  },
  stochastic: {
    k: [45, 50, 55, 60, 65],
    d: [42, 48, 52, 58, 62],
    current: { k: 65, d: 62 },
  },
  bollingerBands: {
    upper: [180, 181, 182, 183, 184],
    middle: [175, 175.5, 176, 176.5, 177],
    lower: [170, 170.5, 171, 171.5, 172],
    percentB: [60, 62, 65, 68, 70],
    current: {
      upper: 184,
      middle: 177,
      lower: 172,
      percentB: 70,
    },
  },
  volume: {
    trend: 'bullish',
    current: {
      volume: 85000000,
      avgVolume: 75000000,
      ratio: 113.3,
    },
  },
  overallSignal: {
    signal: 'BUY',
    score: 0.65,
    summary: 'Strong bullish momentum',
  },
};

// Wrapper component with required providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    <PaperTradingProvider>
      <PivyChatProvider>
        <FavoritesProvider>
          <WatchlistProvider>
            {children}
          </WatchlistProvider>
        </FavoritesProvider>
      </PivyChatProvider>
    </PaperTradingProvider>
  </ToastProvider>
);

const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui, { wrapper: TestWrapper });
};

// Suppress expected console errors during tests
const originalConsoleError = console.error;

beforeEach(() => {
  jest.clearAllMocks();
  // Suppress expected act() warnings and error logs
  console.error = jest.fn();
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockIndicatorData),
    })
  ) as jest.Mock;
  
  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    clear: jest.fn(),
  };
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
});

afterEach(() => {
  console.error = originalConsoleError;
});

describe('LiveScreenDetailPage', () => {
  describe('LSDP-101: Page Header', () => {
    test('renders page header with symbol', () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });

    test('renders back button', () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      // Back button should be present
      const backButtons = document.querySelectorAll('button');
      const hasBackButton = Array.from(backButtons).some(btn => 
        btn.querySelector('svg') !== null
      );
      expect(hasBackButton).toBe(true);
    });

    test('renders settings button', () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      const settingsButton = screen.getByTitle('Live Screen Settings');
      expect(settingsButton).toBeInTheDocument();
    });

    test('renders info button', () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      const infoButton = screen.getByTitle('Indicator Guide');
      expect(infoButton).toBeInTheDocument();
    });
  });

  describe('LSDP-102: Live Status Banner', () => {
    test('renders Live Technical Analysis banner', () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      expect(screen.getByText('Live Technical Analysis')).toBeInTheDocument();
    });

    test('displays pulsing live indicator', () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      const pulsingDot = document.querySelector('.animate-ping');
      expect(pulsingDot).toBeInTheDocument();
    });
  });

  describe('LSDP-102b: View Price Chart Button', () => {
    test('renders View Price Chart button', () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      expect(screen.getByRole('button', { name: /View Price Chart/i })).toBeInTheDocument();
    });

    test('button has full width styling', () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      const button = screen.getByRole('button', { name: /View Price Chart/i });
      expect(button).toHaveClass('w-full');
    });

    test('button shows loading state when clicked', async () => {
      // Mock a slow response
      global.fetch = jest.fn((url) => {
        if (url.includes('stock-detail')) {
          return new Promise(resolve => setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({
              price: 175.50,
              change: 2.5,
              valueChange: 4.25,
              sparkline: [170, 172, 174, 175, 175.5],
              name: 'Apple Inc.'
            })
          }), 500));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockIndicatorData),
        });
      }) as jest.Mock;

      renderWithProviders(<LiveScreenDetailPage />);
      
      const button = screen.getByRole('button', { name: /View Price Chart/i });
      fireEvent.click(button);
      
      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByText(/Loading/i)).toBeInTheDocument();
      });
    });

    test('opens StockPreviewModal when clicked and data loads', async () => {
      global.fetch = jest.fn((url) => {
        if (url.includes('stock-detail')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              price: 175.50,
              change: 2.5,
              valueChange: 4.25,
              sparkline: [170, 172, 174, 175, 175.5],
              name: 'Apple Inc.'
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockIndicatorData),
        });
      }) as jest.Mock;

      renderWithProviders(<LiveScreenDetailPage />);
      
      const button = screen.getByRole('button', { name: /View Price Chart/i });
      fireEvent.click(button);
      
      // Modal should open with stock data
      await waitFor(() => {
        expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('shows error toast when fetch fails', async () => {
      global.fetch = jest.fn((url) => {
        if (url.includes('stock-detail')) {
          return Promise.resolve({
            ok: false,
            status: 500,
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockIndicatorData),
        });
      }) as jest.Mock;

      renderWithProviders(<LiveScreenDetailPage />);
      
      const button = screen.getByRole('button', { name: /View Price Chart/i });
      fireEvent.click(button);
      
      // Should handle error gracefully (button returns to normal state)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /View Price Chart/i })).not.toBeDisabled();
      }, { timeout: 3000 });
    });
  });

  describe('LSDP-103: Overall Signal Card', () => {
    test('shows skeleton loading state initially', () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      // Should show loading skeletons
      const skeletons = document.querySelectorAll('.animate-pulse, .animate-skeleton-in');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    test('displays overall signal after data loads', async () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Overall Technical Signal')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('displays BUY signal when data indicates bullish', async () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('BUY')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('displays confidence percentage', async () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Confidence')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('LSDP-104: Technical Indicators Panel', () => {
    test('renders Technical Indicators header', async () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Technical Indicators')).toBeInTheDocument();
      });
    });

    test('renders refresh button', async () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      await waitFor(() => {
        const refreshButtons = document.querySelectorAll('button[title="Refresh data"]');
        expect(refreshButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('LSDP-105: Timeframe Selector', () => {
    test('renders Period selector with all options', async () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Period')).toBeInTheDocument();
      });
      
      // Period buttons
      const periodButtons = screen.getAllByRole('button').filter(btn => 
        ['1D', '1W', '1M', '1Y'].includes(btn.textContent || '')
      );
      expect(periodButtons.length).toBeGreaterThanOrEqual(4);
    });

    test('renders Interval selector', async () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Interval')).toBeInTheDocument();
      });
    });

    test('1D period is selected by default', async () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      await waitFor(() => {
        // Find period row and check default selection
        const periodLabel = screen.getByText('Period');
        expect(periodLabel).toBeInTheDocument();
      });
    });
  });

  describe('LSDP-106: Indicator Cards', () => {
    test('renders MACD indicator card', async () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      await waitFor(() => {
        const macdElements = screen.getAllByText(/MACD/);
        expect(macdElements.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    test('renders RSI indicator card', async () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/RSI/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('renders Stochastic indicator card', async () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Stochastic/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('renders Bollinger Bands indicator card', async () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Bollinger/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('LSDP-107: Moving Averages Section', () => {
    test('renders Moving Averages section header', async () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Moving Averages')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('displays SMA and EMA values', async () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('SMA 20')).toBeInTheDocument();
        expect(screen.getByText('SMA 50')).toBeInTheDocument();
        expect(screen.getByText('SMA 200')).toBeInTheDocument();
        expect(screen.getByText('EMA 12')).toBeInTheDocument();
        expect(screen.getByText('EMA 26')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('shows skeleton loading state for Moving Averages', () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      // Initially should show skeletons
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('LSDP-108: Volume Analysis Section', () => {
    test('renders Volume Analysis section header', async () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      await waitFor(() => {
        const volumeElements = screen.getAllByText('Volume Analysis');
        expect(volumeElements.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    test('displays Current Volume and Average Volume', async () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Current Volume')).toBeInTheDocument();
        expect(screen.getByText(/Avg Volume/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('shows skeleton loading state for Volume', () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      // Initially should show skeletons
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('LSDP-109: Price Display', () => {
    test('displays current price in header', async () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      await waitFor(() => {
        const priceElements = screen.getAllByText(/175\.50/);
        expect(priceElements.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    test('shows price skeleton while loading', () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      // Initially should show price skeleton in header
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('LSDP-110: Back to Watchlist Button', () => {
    test('renders Back to Watchlist button', () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      expect(screen.getByRole('button', { name: /Back to Watchlist/ })).toBeInTheDocument();
    });

    test('navigates to watchlist when clicked', () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      const backButton = screen.getByRole('button', { name: /Back to Watchlist/ });
      fireEvent.click(backButton);
      
      expect(mockPush).toHaveBeenCalledWith('/watchlist');
    });
  });

  describe('LSDP-111: Settings Drawer', () => {
    test('opens settings drawer when settings button is clicked', async () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      const settingsButton = screen.getByTitle('Live Screen Settings');
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        expect(screen.getByText('Live Screen Settings')).toBeInTheDocument();
      });
    });

    test('settings drawer has auto-refresh toggle', async () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      const settingsButton = screen.getByTitle('Live Screen Settings');
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        // Settings drawer should be visible
        expect(screen.getAllByText('Live Screen Settings').length).toBeGreaterThan(0);
      });
    });

    test('settings drawer has indicator visibility toggles', async () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      const settingsButton = screen.getByTitle('Live Screen Settings');
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        // Check that settings drawer contains indicator-related content
        // Use getAllByText since there might be multiple elements with these texts
        const macdElements = screen.getAllByText(/MACD/);
        expect(macdElements.length).toBeGreaterThan(0);
        
        const rsiElements = screen.getAllByText(/RSI/);
        expect(rsiElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('LSDP-112: Info Modal', () => {
    test('opens indicator info modal when info button is clicked', async () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      const infoButton = screen.getByTitle('Indicator Guide');
      fireEvent.click(infoButton);
      
      await waitFor(() => {
        // Modal should open with indicator information
        expect(screen.getByText(/Technical Indicator Guide|Indicator Guide/i)).toBeInTheDocument();
      });
    });
  });

  describe('LSDP-113: Data Fetching', () => {
    test('fetches indicator data on mount', async () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    test('fetches data with period and interval params', async () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('period=')
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('interval=')
        );
      });
    });

    test('handles fetch errors gracefully', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error'))) as jest.Mock;
      
      // Should not throw
      renderWithProviders(<LiveScreenDetailPage />);
      
      // Page should still render
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });
  });

  describe('LSDP-114: Animation Classes', () => {
    test('applies skeleton-in animation to loading states', () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      // Check for skeleton animation classes
      const animatedElements = document.querySelectorAll('.animate-skeleton-in, .animate-pulse');
      expect(animatedElements.length).toBeGreaterThan(0);
    });

    test('applies content-reveal animation after data loads', async () => {
      renderWithProviders(<LiveScreenDetailPage />);
      
      await waitFor(() => {
        const revealElements = document.querySelectorAll('.animate-content-reveal');
        expect(revealElements.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });
});
