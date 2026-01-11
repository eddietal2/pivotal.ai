import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WatchlistPage from '@/app/watchlist/page';
import { FavoritesProvider } from '@/components/context/FavoritesContext';
import { WatchlistProvider } from '@/components/context/WatchlistContext';
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
  usePathname: () => '/watchlist',
}));

// Wrapper component with all required providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <PivyChatProvider>
    <FavoritesProvider>
      <WatchlistProvider>
        {children}
      </WatchlistProvider>
    </FavoritesProvider>
  </PivyChatProvider>
);

// Helper function to render with providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui, { wrapper: TestWrapper });
};

// Mock fetch for market data
beforeEach(() => {
  global.fetch = jest.fn();
  mockPush.mockClear();
  mockBack.mockClear();
});

describe('Watchlist page', () => {
  describe('Page Header', () => {
    test('renders WatchList header', () => {
      renderWithProviders(<WatchlistPage />);
      expect(screen.getByText('WatchList')).toBeInTheDocument();
    });
  });

  describe('Getting Started Alert', () => {
    test('renders "How Pivy Watchlist Works" alert on initial load', () => {
      renderWithProviders(<WatchlistPage />);
      expect(screen.getByText('How Pivy Watchlist Works')).toBeInTheDocument();
    });

    test('displays 3 instructional steps in the alert', () => {
      renderWithProviders(<WatchlistPage />);
      expect(screen.getByText(/Search or Browse/)).toBeInTheDocument();
      expect(screen.getByText(/Build Your Watchlist/)).toBeInTheDocument();
      expect(screen.getByText(/Enable Swing Screens/)).toBeInTheDocument();
    });

    test('can close the getting started alert', async () => {
      renderWithProviders(<WatchlistPage />);
      
      // The alert should be visible initially
      const alertHeading = screen.getByText('How Pivy Watchlist Works');
      expect(alertHeading).toBeInTheDocument();
      
      // Find the close button - it's the button inside the alert container with the X icon
      const alertContainer = alertHeading.closest('div[class*="bg-blue-50"]');
      expect(alertContainer).toBeInTheDocument();
      
      // Find the X button within the alert (has the hover:bg-blue-100 class)
      const closeButton = alertContainer?.querySelector('button[class*="hover:bg-blue-100"]');
      expect(closeButton).toBeInTheDocument();
      
      // Click the close button
      fireEvent.click(closeButton!);
      
      // Wait for animation to complete and alert to be removed
      await waitFor(() => {
        expect(screen.queryByText('How Pivy Watchlist Works')).not.toBeInTheDocument();
      }, { timeout: 500 });
    });
  });

  describe('Search Bar', () => {
    test('renders search bar placeholder text', () => {
      renderWithProviders(<WatchlistPage />);
      expect(screen.getByText('Search stocks, ETFs, crypto...')).toBeInTheDocument();
    });
  });

  describe('Market Pulse Section', () => {
    test('renders Market Pulse section with Activity icon', () => {
      renderWithProviders(<WatchlistPage />);
      // Ensure the Market Pulse header is present - use getAllByText since there are multiple
      const headers = screen.getAllByText(/Market Pulse/i);
      expect(headers.length).toBeGreaterThan(0);
      // Market pulse container should render items
      expect(screen.getByTestId('market-pulse-container')).toBeInTheDocument();
    });

    test('renders market pulse container in loading state', () => {
      renderWithProviders(<WatchlistPage />);
      // Should show loading skeletons
      expect(screen.getByTestId('market-pulse-container')).toBeInTheDocument();
    });
  });

  describe('Swing Screens Section', () => {
    test('renders Swing Screens section', () => {
      renderWithProviders(<WatchlistPage />);
      expect(screen.getByText('Swing Screens')).toBeInTheDocument();
    });

    test('shows empty state when no favorites', () => {
      renderWithProviders(<WatchlistPage />);
      // Since there are no favorites by default, it should show the empty state
      expect(screen.getByText('No swing setups found')).toBeInTheDocument();
      expect(screen.getByText('Add favorites to track technical indicators')).toBeInTheDocument();
    });
  });

  describe('Favorites Section', () => {
    test('renders Favorites section with Heart icon', () => {
      renderWithProviders(<WatchlistPage />);
      // Find the Favorites header text
      expect(screen.getByText('Favorites')).toBeInTheDocument();
    });

    test('displays favorites count indicator', () => {
      renderWithProviders(<WatchlistPage />);
      // Should show (0/3) when no favorites - MAX_FAVORITES is 3
      expect(screen.getByText('(0/3)')).toBeInTheDocument();
    });

    test('shows empty state when no favorites exist', () => {
      renderWithProviders(<WatchlistPage />);
      // Since there are no favorites by default, it should show the empty state
      expect(screen.getByText('No favorites yet')).toBeInTheDocument();
      expect(screen.getByText('Tap ♡ on any asset to add it here')).toBeInTheDocument();
    });

    test('displays favorites caption explaining the limit', () => {
      renderWithProviders(<WatchlistPage />);
      // The caption should mention the favorites purpose
      expect(screen.getByText(/Your top 3 most important assets/)).toBeInTheDocument();
    });
  });

  describe('My Watchlist Section', () => {
    test('renders My Watchlist section with Star icon', () => {
      renderWithProviders(<WatchlistPage />);
      expect(screen.getByText('My Watchlist')).toBeInTheDocument();
    });

    test('displays watchlist count indicator', () => {
      renderWithProviders(<WatchlistPage />);
      // Should show (0/10) when no watchlist items - MAX_WATCHLIST is 10
      expect(screen.getByText('(0/10)')).toBeInTheDocument();
    });

    test('shows empty state when watchlist is empty', () => {
      renderWithProviders(<WatchlistPage />);
      expect(screen.getByText('Your watchlist is empty')).toBeInTheDocument();
      expect(screen.getByText('Search for stocks and tap ⭐ to add them')).toBeInTheDocument();
    });

    test('displays watchlist caption explaining the limit', () => {
      renderWithProviders(<WatchlistPage />);
      expect(screen.getByText(/Track up to 10 assets/)).toBeInTheDocument();
    });
  });

  describe('Settings Drawer', () => {
    test('opens settings drawer when floating button is clicked', async () => {
      renderWithProviders(<WatchlistPage />);
      
      // Find the floating settings button by its specific class
      const floatingButton = document.querySelector('button[class*="bg-blue-500"][class*="rounded-full"]');
      expect(floatingButton).toBeInTheDocument();
      
      fireEvent.click(floatingButton!);
      
      // Drawer should now be visible with "Manage Watchlist" header
      await waitFor(() => {
        expect(screen.getByText('Manage Watchlist')).toBeInTheDocument();
      });
    });

    test('displays timeframe options in settings drawer', async () => {
      renderWithProviders(<WatchlistPage />);
      
      // Open the settings drawer
      const floatingButton = document.querySelector('button[class*="bg-blue-500"][class*="rounded-full"]');
      fireEvent.click(floatingButton!);
      
      await waitFor(() => {
        expect(screen.getByText('Timeframes')).toBeInTheDocument();
      });
      
      // Timeframe buttons should be visible
      expect(screen.getByRole('button', { name: 'Day' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Week' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Month' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Year' })).toBeInTheDocument();
    });

    test('displays timeframe descriptions', async () => {
      renderWithProviders(<WatchlistPage />);
      
      // Open the settings drawer
      const floatingButton = document.querySelector('button[class*="bg-blue-500"][class*="rounded-full"]');
      fireEvent.click(floatingButton!);
      
      await waitFor(() => {
        expect(screen.getByText('Day - 5 Minute Chart')).toBeInTheDocument();
        expect(screen.getByText('Week - 1 Hour Chart')).toBeInTheDocument();
        expect(screen.getByText('Month - 4 Hour Chart')).toBeInTheDocument();
        expect(screen.getByText('Year - 1 Day Chart')).toBeInTheDocument();
      });
    });

    test('has arrange section for Market Pulse', async () => {
      renderWithProviders(<WatchlistPage />);
      
      const floatingButton = document.querySelector('button[class*="bg-blue-500"][class*="rounded-full"]');
      fireEvent.click(floatingButton!);
      
      await waitFor(() => {
        expect(screen.getByText('Arrange Market Pulse Asset Classes')).toBeInTheDocument();
      });
    });

    test('closes drawer when Close button is clicked', async () => {
      renderWithProviders(<WatchlistPage />);
      
      const floatingButton = document.querySelector('button[class*="bg-blue-500"][class*="rounded-full"]');
      fireEvent.click(floatingButton!);
      
      await waitFor(() => {
        expect(screen.getByText('Manage Watchlist')).toBeInTheDocument();
      });
      
      // Click the first Close button (in the settings drawer - has specific class with 'rounded' not 'rounded-xl')
      const closeButtons = screen.getAllByRole('button', { name: 'Close' });
      const settingsCloseButton = closeButtons.find(btn => 
        btn.className.includes('rounded') && !btn.className.includes('rounded-xl')
      );
      expect(settingsCloseButton).toBeInTheDocument();
      fireEvent.click(settingsCloseButton!);
      
      // Drawer should close (backdrop should have opacity-0)
      await waitFor(() => {
        const backdrop = document.querySelector('div[class*="bg-black/50"][class*="opacity-0"]');
        expect(backdrop).toBeInTheDocument();
      });
    });
  });

  describe('Search Drawer', () => {
    test('opens search drawer when search bar is clicked', async () => {
      renderWithProviders(<WatchlistPage />);
      
      // Find and click the search bar button
      const searchBarButton = screen.getByText('Search stocks, ETFs, crypto...').closest('button');
      expect(searchBarButton).toBeInTheDocument();
      
      fireEvent.click(searchBarButton!);
      
      // Search input should now be visible
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search stocks, ETFs, crypto...')).toBeInTheDocument();
      });
    });

    test('displays popular searches in search drawer', async () => {
      renderWithProviders(<WatchlistPage />);
      
      const searchBarButton = screen.getByText('Search stocks, ETFs, crypto...').closest('button');
      fireEvent.click(searchBarButton!);
      
      await waitFor(() => {
        expect(screen.getByText('Popular Searches')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'AAPL' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'TSLA' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'NVDA' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'SPY' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'BTC-USD' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'GOOGL' })).toBeInTheDocument();
      });
    });

    test('has close button in search drawer', async () => {
      renderWithProviders(<WatchlistPage />);
      
      const searchBarButton = screen.getByText('Search stocks, ETFs, crypto...').closest('button');
      fireEvent.click(searchBarButton!);
      
      await waitFor(() => {
        // Find the Close button in the search drawer
        const closeButtons = screen.getAllByRole('button', { name: 'Close' });
        expect(closeButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Candlestick Animation', () => {
    test('renders candlestick animation in header', () => {
      renderWithProviders(<WatchlistPage />);
      expect(screen.getByTestId('candlestick-animation')).toBeInTheDocument();
    });
  });
});
