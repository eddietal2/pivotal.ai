import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LiveScreenCard from '@/components/screens/LiveScreenCard';
import { LiveScreen, LiveScreenStock } from '@/types/screens';

// Mock the Sparkline component
jest.mock('@/components/ui/Sparkline', () => {
  return function MockSparkline({ data }: { data: number[] }) {
    return <div data-testid="sparkline">Sparkline with {data.length} points</div>;
  };
});

// Mock the data/mockLiveScreens module
jest.mock('@/data/mockLiveScreens', () => ({
  getTimeUntilRefresh: jest.fn(() => '45m'),
}));

// Sample test data
const mockStock: LiveScreenStock = {
  symbol: 'AAPL',
  name: 'Apple Inc.',
  price: 175.50,
  change: 2.5,
  valueChange: 4.25,
  sparkline: [170, 172, 171, 173, 175, 175.5],
  timeframe: '1D',
  screenReason: 'Strong momentum with high institutional buying',
  rank: 1,
  score: 92,
  signals: ['Volume Spike', 'Golden Cross', 'Breakout'],
};

const mockScreen: LiveScreen = {
  id: 'morning-movers',
  title: 'Morning Movers',
  description: 'Top gainers with high volume today',
  icon: '🚀',
  category: 'momentum',
  stocks: [
    mockStock,
    {
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
      price: 380.25,
      change: 1.8,
      valueChange: 6.75,
      sparkline: [375, 376, 378, 379, 380, 380.25],
      timeframe: '1D',
      screenReason: 'AI sector strength',
      rank: 2,
      score: 88,
      signals: ['RSI Bullish'],
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corp.',
      price: 890.00,
      change: -0.5,
      valueChange: -4.45,
      sparkline: [895, 893, 891, 888, 889, 890],
      timeframe: '1D',
      screenReason: 'Consolidation pattern',
      rank: 3,
      score: 75,
      signals: ['Support Test'],
    },
  ],
  generatedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 86400000).toISOString(),
  refreshInterval: 30,
};

// Default props
const defaultProps = {
  screen: mockScreen,
  isExpanded: false,
  onToggle: jest.fn(),
  onStockClick: jest.fn(),
  onStockLongPress: jest.fn(),
  onStockDoubleTap: jest.fn(),
  onSaveScreen: jest.fn(),
  isInWatchlist: jest.fn(() => false),
  isFavorite: jest.fn(() => false),
  recentlyAdded: new Set<string>(),
  recentlyAddedToScreens: new Set<string>(),
};

describe('LiveScreenCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('LSC-101: Card Header', () => {
    test('renders screen title and icon', () => {
      render(<LiveScreenCard {...defaultProps} />);
      
      expect(screen.getByText('Morning Movers')).toBeInTheDocument();
      expect(screen.getByText('🚀')).toBeInTheDocument();
    });

    test('renders screen description', () => {
      render(<LiveScreenCard {...defaultProps} />);
      
      expect(screen.getByText('Top gainers with high volume today')).toBeInTheDocument();
    });

    test('displays stock count', () => {
      render(<LiveScreenCard {...defaultProps} />);
      
      expect(screen.getByText('3 stocks')).toBeInTheDocument();
    });

    test('displays category badge', () => {
      render(<LiveScreenCard {...defaultProps} />);
      
      // Category for momentum screens
      expect(screen.getByText('Momentum')).toBeInTheDocument();
    });
  });

  describe('LSC-102: Toggle Functionality', () => {
    test('calls onToggle when header is clicked', () => {
      const onToggle = jest.fn();
      render(<LiveScreenCard {...defaultProps} onToggle={onToggle} isExpanded={false} />);
      
      // Click the header button (the one containing the title)
      const headerButton = screen.getByText('Morning Movers').closest('button');
      fireEvent.click(headerButton!);
      
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    test('hides expanded content visually when collapsed', () => {
      render(<LiveScreenCard {...defaultProps} isExpanded={false} />);
      
      // The content is rendered but hidden with CSS (max-h-0 opacity-0)
      // We check that the expanded container has the collapsed classes
      const container = document.querySelector('div[class*="max-h-0"]');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('opacity-0');
    });

    test('shows expanded content when isExpanded is true', () => {
      render(<LiveScreenCard {...defaultProps} isExpanded={true} />);
      
      // Stock cards should be visible
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('MSFT')).toBeInTheDocument();
      expect(screen.getByText('NVDA')).toBeInTheDocument();
    });
  });

  describe('LSC-103: Stock Cards Display', () => {
    test('renders all stocks when expanded', () => {
      render(<LiveScreenCard {...defaultProps} isExpanded={true} />);
      
      expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
      expect(screen.getByText('Microsoft Corp.')).toBeInTheDocument();
      expect(screen.getByText('NVIDIA Corp.')).toBeInTheDocument();
    });

    test('displays stock prices correctly', () => {
      render(<LiveScreenCard {...defaultProps} isExpanded={true} />);
      
      expect(screen.getByText('$175.50')).toBeInTheDocument();
      expect(screen.getByText('$380.25')).toBeInTheDocument();
      expect(screen.getByText('$890.00')).toBeInTheDocument();
    });

    test('displays positive change with + prefix', () => {
      render(<LiveScreenCard {...defaultProps} isExpanded={true} />);
      
      expect(screen.getByText('+2.50%')).toBeInTheDocument();
      expect(screen.getByText('+1.80%')).toBeInTheDocument();
    });

    test('displays negative change correctly', () => {
      render(<LiveScreenCard {...defaultProps} isExpanded={true} />);
      
      expect(screen.getByText('-0.50%')).toBeInTheDocument();
    });

    test('displays rank badges for top 3 stocks', () => {
      render(<LiveScreenCard {...defaultProps} isExpanded={true} />);
      
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    test('displays score badges', () => {
      render(<LiveScreenCard {...defaultProps} isExpanded={true} />);
      
      expect(screen.getByText('92')).toBeInTheDocument();
      expect(screen.getByText('88')).toBeInTheDocument();
      expect(screen.getByText('75')).toBeInTheDocument();
    });

    test('displays screen reasons', () => {
      render(<LiveScreenCard {...defaultProps} isExpanded={true} />);
      
      expect(screen.getByText('Strong momentum with high institutional buying')).toBeInTheDocument();
    });

    test('displays signal tags', () => {
      render(<LiveScreenCard {...defaultProps} isExpanded={true} />);
      
      expect(screen.getByText('Volume Spike')).toBeInTheDocument();
      expect(screen.getByText('Golden Cross')).toBeInTheDocument();
    });
  });

  describe('LSC-104: Stock Interactions', () => {
    test('calls onStockClick when stock card is clicked', () => {
      const onStockClick = jest.fn();
      render(<LiveScreenCard {...defaultProps} isExpanded={true} onStockClick={onStockClick} />);
      
      // Click on a stock card
      fireEvent.click(screen.getByText('AAPL'));
      
      expect(onStockClick).toHaveBeenCalledWith(mockStock);
    });

    test('calls onStockDoubleTap when stock card is double-clicked', () => {
      const onStockDoubleTap = jest.fn();
      render(<LiveScreenCard {...defaultProps} isExpanded={true} onStockDoubleTap={onStockDoubleTap} />);
      
      // Double-click on a stock card
      fireEvent.doubleClick(screen.getByText('AAPL'));
      
      expect(onStockDoubleTap).toHaveBeenCalledWith(mockStock);
    });
  });

  describe('LSC-105: Save Screen Functionality', () => {
    test('renders Save All to My Screens button when expanded', () => {
      render(<LiveScreenCard {...defaultProps} isExpanded={true} />);
      
      expect(screen.getByRole('button', { name: /Save All to My Screens/i })).toBeInTheDocument();
    });

    test('calls onSaveScreen when Save All button is clicked', () => {
      const onSaveScreen = jest.fn();
      render(<LiveScreenCard {...defaultProps} isExpanded={true} onSaveScreen={onSaveScreen} />);
      
      fireEvent.click(screen.getByRole('button', { name: /Save All to My Screens/i }));
      
      expect(onSaveScreen).toHaveBeenCalledWith(mockScreen);
    });
  });

  describe('LSC-106: Refresh Indicator', () => {
    test('displays refresh time for screens with refreshInterval', () => {
      render(<LiveScreenCard {...defaultProps} />);
      
      // Mock returns '45m' for getTimeUntilRefresh
      expect(screen.getByText('45m')).toBeInTheDocument();
    });

    test('does not display refresh indicator for screens without refreshInterval', () => {
      const screenWithoutRefresh = { ...mockScreen, refreshInterval: undefined };
      render(<LiveScreenCard {...defaultProps} screen={screenWithoutRefresh} />);
      
      // Should not show the refresh icon/time
      expect(screen.queryByText('45m')).not.toBeInTheDocument();
    });
  });

  describe('LSC-107: Sparkline Rendering', () => {
    test('renders sparklines for each stock when expanded', () => {
      render(<LiveScreenCard {...defaultProps} isExpanded={true} />);
      
      const sparklines = screen.getAllByTestId('sparkline');
      expect(sparklines).toHaveLength(3); // 3 stocks
    });
  });

  describe('LSC-108: Visual States', () => {
    test('highlights stocks in watchlist', () => {
      const isInWatchlist = jest.fn((symbol: string) => symbol === 'AAPL');
      render(<LiveScreenCard {...defaultProps} isExpanded={true} isInWatchlist={isInWatchlist} />);
      
      // Check isInWatchlist was called
      expect(isInWatchlist).toHaveBeenCalledWith('AAPL');
    });

    test('highlights recently added stocks', () => {
      const recentlyAdded = new Set(['MSFT']);
      render(<LiveScreenCard {...defaultProps} isExpanded={true} recentlyAdded={recentlyAdded} />);
      
      // The component should apply different styling for MSFT
      const msftCard = screen.getByText('MSFT').closest('div[class*="cursor-pointer"]');
      expect(msftCard).toHaveClass('border-green-400');
    });
  });

  describe('LSC-109: Help Text', () => {
    test('displays double-tap instruction when expanded', () => {
      render(<LiveScreenCard {...defaultProps} isExpanded={true} />);
      
      expect(screen.getByText('Double-tap stocks to add to Watchlist')).toBeInTheDocument();
    });
  });
});
