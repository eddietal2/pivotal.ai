import '@testing-library/jest-dom';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import LiveScreensContainer from '@/components/screens/LiveScreensContainer';
import { LiveScreen, LiveScreenStock } from '@/types/screens';

// Mock the LiveScreenCard component to simplify testing
jest.mock('@/components/screens/LiveScreenCard', () => {
  return function MockLiveScreenCard({ screen, isExpanded, onToggle }: { 
    screen: { id: string; title: string }; 
    isExpanded: boolean; 
    onToggle: () => void 
  }) {
    return (
      <div data-testid={`screen-card-${screen.id}`}>
        <button onClick={onToggle} data-testid={`toggle-${screen.id}`}>
          {screen.title}
        </button>
        {isExpanded && <div data-testid={`expanded-${screen.id}`}>Expanded Content</div>}
      </div>
    );
  };
});

// Mock data/mockLiveScreens
jest.mock('@/data/mockLiveScreens', () => ({
  getTimeUntilRefresh: jest.fn(() => '2h 30m'),
}));

// Sample mock data
const mockScreens: LiveScreen[] = [
  {
    id: 'morning-movers',
    title: 'Morning Movers',
    description: 'Top gainers today',
    icon: '🚀',
    category: 'momentum',
    stocks: [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 175.50,
        change: 2.5,
        valueChange: 4.25,
        sparkline: [170, 172, 171, 173, 175, 175.5],
        timeframe: '1D',
        screenReason: 'Strong momentum',
        rank: 1,
        score: 92,
        signals: ['Volume Spike', 'Breakout'],
      },
    ],
    generatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    refreshInterval: 30,
  },
  {
    id: 'unusual-volume',
    title: 'Unusual Volume',
    description: 'High volume stocks',
    icon: '🔥',
    category: 'unusual',
    stocks: [
      {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        price: 245.00,
        change: -1.2,
        valueChange: -2.98,
        sparkline: [250, 248, 247, 245, 244, 245],
        timeframe: '1D',
        screenReason: 'Unusual trading activity',
        rank: 1,
        score: 85,
        signals: ['Volume 3x Avg'],
      },
    ],
    generatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  },
];

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Default mock props
const defaultProps = {
  onStockClick: jest.fn(),
  onStockLongPress: jest.fn(),
  onStockDoubleTap: jest.fn(),
  onSaveScreen: jest.fn(),
  onSaveAllStocks: jest.fn(),
  isInWatchlist: jest.fn(() => false),
  isFavorite: jest.fn(() => false),
  recentlyAdded: new Set<string>(),
  recentlyAddedToScreens: new Set<string>(),
};

describe('LiveScreensContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('LS-101: Loading State', () => {
    test('displays loading state while fetching screens', async () => {
      // Create a promise that won't resolve immediately
      mockFetch.mockImplementation(() => new Promise(() => {}));

      render(<LiveScreensContainer {...defaultProps} />);
      
      // Should show loading indicator (actual text from component)
      expect(screen.getByText('Loading Live Screens...')).toBeInTheDocument();
    });
  });

  describe('LS-102: Successful Data Fetch', () => {
    test('renders screen cards after successful fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ screens: mockScreens }),
      });

      await act(async () => {
        render(<LiveScreensContainer {...defaultProps} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('screen-card-morning-movers')).toBeInTheDocument();
        expect(screen.getByTestId('screen-card-unusual-volume')).toBeInTheDocument();
      });
    });

    test('makes API call to correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ screens: mockScreens }),
      });

      await act(async () => {
        render(<LiveScreensContainer {...defaultProps} />);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://127.0.0.1:8000/api/market-data/live-screens/',
          { credentials: 'include' }
        );
      });
    });
  });

  describe('LS-103: Error Handling', () => {
    test('displays error message when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        render(<LiveScreensContainer {...defaultProps} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    test('displays error for non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await act(async () => {
        render(<LiveScreensContainer {...defaultProps} />);
      });

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch screens: 500/)).toBeInTheDocument();
      });
    });

    test('shows retry button on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        render(<LiveScreensContainer {...defaultProps} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
      });
    });
  });

  describe('LS-104: Screen Selection Filter', () => {
    test('passes selected screen IDs to API endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ screens: [mockScreens[0]] }),
      });

      await act(async () => {
        render(
          <LiveScreensContainer 
            {...defaultProps} 
            selectedScreenIds={['morning-movers', 'unusual-volume']} 
          />
        );
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://127.0.0.1:8000/api/market-data/live-screens/?screens=morning-movers,unusual-volume',
          { credentials: 'include' }
        );
      });
    });
  });

  describe('LS-105: Screen Toggle Functionality', () => {
    test('first screen is expanded by default', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ screens: mockScreens }),
      });

      await act(async () => {
        render(<LiveScreensContainer {...defaultProps} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('expanded-morning-movers')).toBeInTheDocument();
      });
    });

    test('toggles screen expansion when clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ screens: mockScreens }),
      });

      await act(async () => {
        render(<LiveScreensContainer {...defaultProps} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('expanded-morning-movers')).toBeInTheDocument();
      });

      // Toggle to collapse
      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-morning-movers'));
      });

      await waitFor(() => {
        expect(screen.queryByTestId('expanded-morning-movers')).not.toBeInTheDocument();
      });
    });
  });

  describe('LS-106: Empty State', () => {
    test('displays empty state when no screens returned', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ screens: [] }),
      });

      await act(async () => {
        render(<LiveScreensContainer {...defaultProps} />);
      });

      await waitFor(() => {
        expect(screen.getByText('No Live Screens available')).toBeInTheDocument();
      });
    });
  });

  describe('LS-107: Refresh Indicator', () => {
    test('displays next refresh time', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ screens: mockScreens }),
      });

      await act(async () => {
        render(<LiveScreensContainer {...defaultProps} />);
      });

      await waitFor(() => {
        // The mock returns '2h 30m' for getTimeUntilRefresh
        expect(screen.getByText(/Refreshes in/)).toBeInTheDocument();
      });
    });
  });
});
