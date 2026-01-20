"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, ExternalLink, TrendingUp, TrendingDown, Info, MessageSquarePlus, Check, Star, BarChart2, LineChart, Briefcase, ChevronDown, FileText, DollarSign } from 'lucide-react';
import { getPricePrefix, getPriceSuffix, formatAxisPrice } from '@/lib/priceUtils';
import { usePivyChat } from '@/components/context/PivyChatContext';
import { usePaperTrading } from '@/components/context/PaperTradingContext';
import { useFavorites, MAX_FAVORITES } from '@/components/context/FavoritesContext';
import { useWatchlist, MAX_WATCHLIST } from '@/components/context/WatchlistContext';
import AnimatedPrice from '@/components/ui/AnimatedPrice';
import PaperTradingSection from '@/components/stock/PaperTradingSection';
import OptionsChainSection from '@/components/stock/OptionsChainSection';
import TimeframeSelector, { PeriodType, IntervalType, getDefaultInterval } from '@/components/charts/TimeframeSelector';

// Static descriptions for each asset
const assetDescriptions: Record<string, { description: string; interpretation?: string }> = {
  // Indexes
  '^GSPC': {
    description: 'The S&P 500 tracks 500 large-cap U.S. companies, representing ~80% of U.S. equity market cap.',
    interpretation: 'Widely used as a benchmark for overall U.S. stock market performance.'
  },
  '^DJI': {
    description: 'The Dow Jones Industrial Average tracks 30 large, publicly-owned blue-chip companies.',
    interpretation: 'A price-weighted index often cited as a barometer of U.S. economic health.'
  },
  '^IXIC': {
    description: 'The Nasdaq Composite includes all stocks listed on the Nasdaq exchange, heavily weighted toward tech.',
    interpretation: 'Often used as a proxy for technology sector performance.'
  },
  '^RUT': {
    description: 'The Russell 2000 tracks 2,000 small-cap U.S. companies.',
    interpretation: 'A key indicator of small-cap stock performance and domestic economic health.'
  },
  
  // Crypto
  'BTC-USD': {
    description: 'Bitcoin is the first and largest cryptocurrency by market cap, created in 2009.',
    interpretation: 'Often viewed as "digital gold" and a store of value in the crypto ecosystem.'
  },
  'ETH-USD': {
    description: 'Ethereum is a decentralized platform for smart contracts and dApps.',
    interpretation: 'The backbone of DeFi and NFTs; ETH is used for gas fees on the network.'
  },
  'SOL-USD': {
    description: 'Solana is a high-performance blockchain known for fast transactions and low fees.',
    interpretation: 'Popular for DeFi and NFT projects requiring high throughput.'
  },
  'XRP-USD': {
    description: 'XRP is designed for fast, low-cost international payments and remittances.',
    interpretation: 'Used by financial institutions for cross-border settlement.'
  },
  'CRYPTO-FEAR-GREED': {
    description: 'The Crypto Fear & Greed Index measures market sentiment on a 0-100 scale.',
    interpretation: '0-25: Extreme Fear (potential buying opportunity) • 25-50: Fear • 50-75: Greed • 75-100: Extreme Greed (potential correction ahead)'
  },
  
  // Precious Metals
  'GC=F': {
    description: 'Gold futures track the price of gold, a precious metal and traditional safe-haven asset.',
    interpretation: 'Often rises during economic uncertainty; inversely correlated with USD strength.'
  },
  'SI=F': {
    description: 'Silver futures track the price of silver, used in jewelry, electronics, and as an investment.',
    interpretation: 'More volatile than gold; has both industrial and precious metal demand.'
  },
  'HG=F': {
    description: 'Copper futures track the price of copper, a key industrial metal.',
    interpretation: '"Dr. Copper" is considered a leading economic indicator due to its industrial use.'
  },
  'PL=F': {
    description: 'Platinum futures track the price of platinum, used in automotive catalysts and jewelry.',
    interpretation: 'Demand tied to auto industry; historically traded above gold.'
  },
  'PA=F': {
    description: 'Palladium futures track the price of palladium, primarily used in catalytic converters.',
    interpretation: 'Highly sensitive to auto production and emissions regulations.'
  },
  'LIT': {
    description: 'Global X Lithium & Battery Tech ETF tracks companies in lithium mining and battery production.',
    interpretation: 'A proxy for EV and energy storage sector growth.'
  },
  
  // Energy
  'CL=F': {
    description: 'WTI Crude Oil futures track the price of West Texas Intermediate crude oil.',
    interpretation: 'The U.S. benchmark for oil prices; sensitive to OPEC decisions and global demand.'
  },
  'NG=F': {
    description: 'Natural Gas futures track the price of natural gas delivered at Henry Hub.',
    interpretation: 'Highly seasonal; demand spikes in winter for heating and summer for cooling.'
  },
  'TAN': {
    description: 'Invesco Solar ETF tracks companies in the solar energy industry.',
    interpretation: 'A pure-play on solar energy adoption and clean energy transition.'
  },
  'ICLN': {
    description: 'iShares Global Clean Energy ETF tracks global clean energy companies.',
    interpretation: 'Broad exposure to renewable energy including solar, wind, and other clean tech.'
  },
  'HYDR': {
    description: 'Global X Hydrogen ETF tracks companies involved in hydrogen production and fuel cells.',
    interpretation: 'Exposure to emerging hydrogen economy and green hydrogen initiatives.'
  },
  
  // Market Sentiment
  '^VIX': {
    description: 'The VIX measures expected 30-day volatility of the S&P 500 based on options prices.',
    interpretation: '<15: Low volatility (complacency) • 15-25: Normal • 25-35: Elevated fear • >35: Extreme fear'
  },
  'CALL/PUT Ratio': {
    description: 'The Put/Call Ratio compares put option volume to call option volume.',
    interpretation: '<0.7: Bullish sentiment (more calls) • 0.7-1.0: Neutral • >1.0: Bearish sentiment (more puts)'
  },
  
  // Treasury Yields
  'DGS10': {
    description: 'The 10-Year Treasury Yield is the interest rate on U.S. 10-year government bonds.',
    interpretation: 'Higher yields → higher mortgage/loan rates, signals growth or inflation expectations. Lower yields → cheaper borrowing, often indicates flight to safety.'
  },
  'DGS2': {
    description: 'The 2-Year Treasury Yield is the interest rate on U.S. 2-year government bonds.',
    interpretation: 'Higher yields → Fed expected to raise rates or keep them elevated. Lower yields → Fed expected to cut rates. When 2Y > 10Y (inverted), historically signals recession.'
  },
};

interface TimeframeData {
  closes: number[];
  latest: {
    close: string;
    change: number;
    value_change: number;
    is_after_hours: boolean;
  };
}

interface StockPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  name: string;
  price: number | string;
  change: number;
  valueChange: number;
  sparkline: number[];
  timeframe: string;
  // New: all timeframe data for switching
  timeframes?: {
    day?: TimeframeData;
    week?: TimeframeData;
    month?: TimeframeData;
    year?: TimeframeData;
  };
}

export default function StockPreviewModal({
  isOpen,
  onClose,
  symbol,
  name,
  price,
  change,
  valueChange,
  sparkline,
  timeframe,
  timeframes,
}: StockPreviewModalProps) {
  const router = useRouter();
  const { addAssetToTodaysChat, isAssetInTodaysChat, removeAssetFromTodaysChat } = usePivyChat();
  const { isFavorite, toggleFavorite, isFull: isFavoritesFull } = useFavorites();
  const { isInWatchlist, toggleWatchlist, isFull: isWatchlistFull } = useWatchlist();
  const { isEnabled: isPaperTradingEnabled, getPosition, getOptionPositionsForUnderlying } = usePaperTrading();
  const position = getPosition(symbol);
  const optionPositions = getOptionPositionsForUnderlying(symbol);
  const [isClosing, setIsClosing] = React.useState(false);
  const [chartMode, setChartMode] = React.useState<'line' | 'candle'>('line');
  const [isPaperTradingExpanded, setIsPaperTradingExpanded] = React.useState(false);
  const [isOptionsExpanded, setIsOptionsExpanded] = React.useState(false);
  
  // Period and interval selection
  const periodFromTimeframe = (tf: string): PeriodType => {
    const map: Record<string, PeriodType> = { day: '1D', week: '1W', month: '1M', year: '1Y' };
    return map[tf?.toLowerCase()] || '1D';
  };
  const [selectedPeriod, setSelectedPeriod] = React.useState<PeriodType>(periodFromTimeframe(timeframe));
  const [selectedInterval, setSelectedInterval] = React.useState<IntervalType>(getDefaultInterval(periodFromTimeframe(timeframe)));
  
  // Legacy timeframe for data fetching (maps period to backend format)
  const selectedTimeframe = React.useMemo<'day' | 'week' | 'month' | 'year'>(() => {
    const map: Record<PeriodType, 'day' | 'week' | 'month' | 'year'> = { '1D': 'day', '1W': 'week', '1M': 'month', '1Y': 'year' };
    return map[selectedPeriod];
  }, [selectedPeriod]);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'info' | 'watchlist' | 'error'; link?: string } | null>(null);
  
  // State for fetched data when timeframes prop is not provided
  const [fetchedData, setFetchedData] = React.useState<{
    timeframes?: StockPreviewModalProps['timeframes'];
    loading: boolean;
    error: string | null;
  }>({ loading: false, error: null });
  
  // Chart scrubbing state (Robinhood-style touch interaction)
  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const [scrubIndex, setScrubIndex] = React.useState<number | null>(null);
  const chartRef = React.useRef<HTMLDivElement>(null);

  // Handle navigating to a section from toast
  const handleToastClick = (link?: string) => {
    if (link) {
      handleClose();
      setTimeout(() => {
        router.push(link);
      }, 280);
    }
  };

  // Handle favorite toggle with toast notification
  const handleToggleFavorite = () => {
    const wasFavorite = isFavorite(symbol);
    if (!wasFavorite && isFavoritesFull()) {
      setToast({
        message: `My Screens full (${MAX_FAVORITES}/${MAX_FAVORITES}) - Tap to manage`,
        type: 'error',
        link: '/watchlist?section=my-screens',
      });
      setTimeout(() => setToast(null), 4000);
      return;
    }
    toggleFavorite({ symbol, name });
    setToast({
      message: wasFavorite ? `${name} removed from My Screens` : `${name} added to My Screens`,
      type: wasFavorite ? 'info' : 'success',
    });
    // Auto-dismiss toast
    setTimeout(() => setToast(null), 2500);
  };

  // Handle watchlist toggle with toast notification
  const handleToggleWatchlist = () => {
    const wasInWatchlist = isInWatchlist(symbol);
    if (!wasInWatchlist && isWatchlistFull()) {
      setToast({
        message: `Watchlist full (${MAX_WATCHLIST}/${MAX_WATCHLIST}) - Tap to manage`,
        type: 'error',
        link: '/watchlist?section=my-watchlist',
      });
      setTimeout(() => setToast(null), 4000);
      return;
    }
    toggleWatchlist({ symbol, name });
    setToast({
      message: wasInWatchlist ? `${name} removed from watchlist` : `${name} added to watchlist`,
      type: 'watchlist',
    });
    // Auto-dismiss toast
    setTimeout(() => setToast(null), 2500);
  };

  // Check if asset is already in today's chat
  const isInChat = isAssetInTodaysChat(symbol);

  // Handle adding/removing asset from today's Pivy Chat
  const handleTogglePivyChat = () => {
    if (isInChat) {
      removeAssetFromTodaysChat(symbol);
    } else {
      const numericPrice = typeof price === 'string' ? parseFloat(price.replace(/,/g, '')) : price;
      addAssetToTodaysChat({
        symbol,
        name,
        price: numericPrice,
        change,
      });
    }
  };

  // Handle timeframe change with transition
  const handlePeriodChange = (period: PeriodType) => {
    if (period === selectedPeriod) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedPeriod(period);
      setSelectedInterval(getDefaultInterval(period));
      setTimeout(() => setIsTransitioning(false), 50);
    }, 150);
  };

  const handleIntervalChange = (interval: IntervalType) => {
    setSelectedInterval(interval);
  };

  // Reset selected timeframe when modal opens with new data
  React.useEffect(() => {
    if (isOpen && timeframe) {
      const period = periodFromTimeframe(timeframe);
      setSelectedPeriod(period);
      setSelectedInterval(getDefaultInterval(period));
    }
  }, [isOpen, timeframe]);

  // Fetch data when modal opens without timeframes (e.g., search results)
  React.useEffect(() => {
    if (!isOpen || !symbol) return;
    
    // Check if we have valid timeframes data from props
    const hasValidTimeframes = timeframes && 
      Object.keys(timeframes).length > 0 && 
      Object.values(timeframes).some(tf => tf && tf.closes && tf.closes.length > 0);
    
    // Also check if we have valid sparkline data
    const hasValidSparkline = sparkline && sparkline.length > 0;
    
    // If we already have valid data from props, don't fetch
    if (hasValidTimeframes || hasValidSparkline) {
      setFetchedData({ loading: false, error: null });
      return;
    }
    
    // Reset and fetch data for this symbol using stock-detail endpoint
    setFetchedData({ loading: true, error: null });
    
    const controller = new AbortController();
    
    // Fetch all timeframes in parallel using stock-detail endpoint
    const timeframeMap = { day: 'day', week: 'week', month: 'month', year: 'year' };
    
    Promise.all(
      Object.entries(timeframeMap).map(([key, apiTf]) =>
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}/api/market-data/stock-detail/?symbol=${encodeURIComponent(symbol)}&timeframe=${apiTf}`, {
          signal: controller.signal,
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => ({ key, data }))
          .catch(() => ({ key, data: null }))
      )
    )
      .then(results => {
        const fetchedTimeframes: StockPreviewModalProps['timeframes'] = {};
        let hasAnyData = false;
        
        results.forEach(({ key, data }) => {
          if (data && data.sparkline && data.sparkline.length > 0) {
            hasAnyData = true;
            fetchedTimeframes[key as 'day' | 'week' | 'month' | 'year'] = {
              closes: data.sparkline,
              latest: {
                close: String(data.price || 0),
                change: data.change || 0,
                value_change: data.valueChange || 0,
                is_after_hours: false,
              },
            };
          }
        });
        
        if (hasAnyData) {
          console.log('StockPreviewModal fetched data for', symbol, ':', fetchedTimeframes);
          setFetchedData({
            timeframes: fetchedTimeframes,
            loading: false,
            error: null,
          });
        } else {
          setFetchedData({ loading: false, error: 'No data available for this symbol' });
        }
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        console.error('Error fetching stock data:', err);
        setFetchedData({ loading: false, error: err.message });
      });
    
    return () => controller.abort();
  }, [isOpen, symbol, timeframes, sparkline]);

  // Use fetched timeframes if props don't have valid data
  const hasValidPropsTimeframes = timeframes && 
    Object.keys(timeframes).length > 0 && 
    Object.values(timeframes).some(tf => tf && tf.closes && tf.closes.length > 0);
  
  const effectiveTimeframes = hasValidPropsTimeframes 
    ? timeframes 
    : fetchedData.timeframes;

  // Get current data based on selected timeframe
  const currentData = React.useMemo(() => {
    if (effectiveTimeframes && effectiveTimeframes[selectedTimeframe]) {
      const tfData = effectiveTimeframes[selectedTimeframe]!;
      return {
        sparkline: tfData.closes || [],
        change: tfData.latest?.change ?? change,
        valueChange: tfData.latest?.value_change ?? valueChange,
        price: tfData.latest?.close ? parseFloat(tfData.latest.close.replace(/,/g, '')) : (typeof price === 'string' ? parseFloat(price.replace(/,/g, '')) : price),
      };
    }
    // Fallback to props
    return {
      sparkline,
      change,
      valueChange,
      price: typeof price === 'string' ? parseFloat(price.replace(/,/g, '')) : price,
    };
  }, [effectiveTimeframes, selectedTimeframe, sparkline, change, valueChange, price]);

  // Get scrubbed price when touching chart
  const scrubPrice = React.useMemo(() => {
    if (scrubIndex === null || !currentData.sparkline || currentData.sparkline.length === 0) return null;
    const idx = Math.max(0, Math.min(scrubIndex, currentData.sparkline.length - 1));
    return currentData.sparkline[idx];
  }, [scrubIndex, currentData.sparkline]);

  // Calculate change from first data point to scrubbed point
  const scrubChange = React.useMemo(() => {
    if (scrubPrice === null || !currentData.sparkline || currentData.sparkline.length === 0) return null;
    const firstPrice = currentData.sparkline[0];
    const valueChange = scrubPrice - firstPrice;
    const percentChange = ((scrubPrice - firstPrice) / firstPrice) * 100;
    return { valueChange, percentChange };
  }, [scrubPrice, currentData.sparkline]);

  // Handle chart scrubbing
  const handleChartScrub = React.useCallback((clientX: number) => {
    if (!chartRef.current || !currentData.sparkline || currentData.sparkline.length === 0) return;
    const rect = chartRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const index = Math.round(percent * (currentData.sparkline.length - 1));
    setScrubIndex(index);
  }, [currentData.sparkline]);

  const handleScrubStart = React.useCallback((e: React.PointerEvent) => {
    setIsScrubbing(true);
    handleChartScrub(e.clientX);
    // Capture pointer to track movement outside element
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [handleChartScrub]);

  const handleScrubMove = React.useCallback((e: React.PointerEvent) => {
    if (!isScrubbing) return;
    handleChartScrub(e.clientX);
  }, [isScrubbing, handleChartScrub]);

  const handleScrubEnd = React.useCallback(() => {
    setIsScrubbing(false);
    setScrubIndex(null);
  }, []);

  // Handle close with animation
  const handleClose = React.useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 280); // Match animation duration
  }, [onClose]);

  // Prevent scroll on body when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const handleOpenFullView = () => {
    handleClose();
    // Navigate after animation completes
    setTimeout(() => {
      router.push(`/stock/${encodeURIComponent(symbol)}`);
    }, 280);
  };

  const numericPrice = currentData.price;
  const isPositive = currentData.change >= 0;
  const pricePrefix = getPricePrefix(symbol);
  const priceSuffix = getPriceSuffix(symbol);

  // Get time labels based on timeframe
  const getTimeLabels = (tf: 'day' | 'week' | 'month' | 'year') => {
    switch (tf) {
      case 'day': return ['9:30 AM', '10:30', '11:30', '12:30 PM', '1:30', '2:30', '3:30'];
      case 'week': return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      case 'month': return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      case 'year': return ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'];
    }
  };

  // Calculate highlighted time label index based on scrub position
  const getHighlightedLabelIndex = (dataLength: number) => {
    if (!isScrubbing || scrubIndex === null || dataLength === 0) return -1;
    const labels = getTimeLabels(selectedTimeframe);
    const percent = scrubIndex / (dataLength - 1);
    return Math.round(percent * (labels.length - 1));
  };

  // Render time labels with optional highlighting
  const renderTimeLabels = (dataLength: number) => {
    const labels = getTimeLabels(selectedTimeframe);
    const highlightIdx = getHighlightedLabelIndex(dataLength);
    
    return (
      <div className="flex justify-between text-[10px] text-gray-400 pt-1 flex-shrink-0 px-2">
        {labels.map((label, i) => (
          <span 
            key={i} 
            className={`transition-all duration-100 ${
              highlightIdx === i 
                ? 'text-gray-900 dark:text-white font-semibold scale-110' 
                : ''
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    );
  };

  // Render sparkline chart with axes
  const renderSparkline = () => {
    // Show loading state while fetching
    if (fetchedData.loading) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            Loading chart data...
          </div>
        </div>
      );
    }
    
    // Show error state
    if (fetchedData.error) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          {fetchedData.error}
        </div>
      );
    }
    
    const chartData = currentData.sparkline;
    if (!chartData || chartData.length < 2) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          No chart data available
        </div>
      );
    }

    const min = Math.min(...chartData);
    const max = Math.max(...chartData);
    const range = max - min || 1;
    // Add padding to price range
    const paddedMin = min - range * 0.05;
    const paddedMax = max + range * 0.05;
    const paddedRange = paddedMax - paddedMin;

    // Generate Y-axis labels (4 price levels)
    const yLabels = [];
    for (let i = 0; i <= 3; i++) {
      const price = paddedMax - (paddedRange * i) / 3;
      yLabels.push(price);
    }

    // Candlestick mode rendering
    if (chartMode === 'candle') {
      // Generate OHLC data from closes - group into candles
      const candleCount = Math.min(20, Math.floor(chartData.length / 3));
      const pointsPerCandle = Math.floor(chartData.length / candleCount);
      const candles: { open: number; high: number; low: number; close: number }[] = [];
      
      for (let i = 0; i < candleCount; i++) {
        const start = i * pointsPerCandle;
        const end = Math.min(start + pointsPerCandle, chartData.length);
        const segment = chartData.slice(start, end);
        if (segment.length > 0) {
          candles.push({
            open: segment[0],
            high: Math.max(...segment),
            low: Math.min(...segment),
            close: segment[segment.length - 1],
          });
        }
      }

      const candleWidth = 80 / candleCount;
      const gap = candleWidth * 0.2;

      return (
        <div className="flex h-full overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div className="flex-1 relative min-h-0">
              <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 33, 66, 100].map((y) => (
                  <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
                ))}
                {/* Candlesticks */}
                {candles.map((candle, i) => {
                  const x = 10 + (i / candleCount) * 80;
                  const isBullish = candle.close >= candle.open;
                  const color = isBullish ? '#22c55e' : '#ef4444';
                  
                  const highY = 100 - ((candle.high - paddedMin) / paddedRange) * 100;
                  const lowY = 100 - ((candle.low - paddedMin) / paddedRange) * 100;
                  const openY = 100 - ((candle.open - paddedMin) / paddedRange) * 100;
                  const closeY = 100 - ((candle.close - paddedMin) / paddedRange) * 100;
                  
                  const bodyTop = Math.min(openY, closeY);
                  const bodyHeight = Math.max(Math.abs(closeY - openY), 0.5);
                  
                  return (
                    <g key={i}>
                      {/* Wick */}
                      <line
                        x1={x + candleWidth / 2 - gap / 2}
                        y1={highY}
                        x2={x + candleWidth / 2 - gap / 2}
                        y2={lowY}
                        stroke={color}
                        strokeWidth="0.5"
                      />
                      {/* Body */}
                      <rect
                        x={x}
                        y={bodyTop}
                        width={candleWidth - gap}
                        height={bodyHeight}
                        fill={isBullish ? color : color}
                        stroke={color}
                        strokeWidth="0.3"
                      />
                    </g>
                  );
                })}
                {/* Scrub indicator - crosshair lines and dot */}
                {isScrubbing && scrubIndex !== null && (() => {
                  const scrubX = (scrubIndex / (chartData.length - 1)) * 100;
                  const scrubValue = chartData[scrubIndex];
                  const scrubY = 100 - ((scrubValue - paddedMin) / paddedRange) * 100;
                  return (
                    <>
                      {/* Vertical line */}
                      <line 
                        x1={scrubX} 
                        y1="0" 
                        x2={scrubX} 
                        y2="100" 
                        stroke="#6b7280" 
                        strokeWidth="0.5" 
                        strokeDasharray="2,2"
                      />
                      {/* Horizontal line */}
                      <line 
                        x1="0" 
                        y1={scrubY} 
                        x2="100" 
                        y2={scrubY} 
                        stroke="#6b7280" 
                        strokeWidth="0.5" 
                        strokeDasharray="2,2"
                      />
                      <circle 
                        cx={scrubX} 
                        cy={scrubY} 
                        r="2" 
                        fill={scrubValue >= chartData[0] ? '#22c55e' : '#ef4444'}
                        stroke="white"
                        strokeWidth="0.5"
                      />
                    </>
                  );
                })()}
              </svg>
            </div>
            {/* X-axis labels - relative times like Robinhood */}
            {renderTimeLabels(chartData.length)}
          </div>
        </div>
      );
    }

    // Line chart mode (default)
    const points = chartData
      .map((val, i) => {
        const x = (i / (chartData.length - 1)) * 100;
        const y = 100 - ((val - paddedMin) / paddedRange) * 100;
        return `${x},${y}`;
      })
      .join(' ');

    // Create gradient fill
    const fillPoints = `0,100 ${points} 100,100`;

    // Calculate scrub indicator position
    const scrubX = scrubIndex !== null ? (scrubIndex / (chartData.length - 1)) * 100 : null;
    const scrubY = scrubIndex !== null ? 100 - ((chartData[scrubIndex] - paddedMin) / paddedRange) * 100 : null;

    return (
      <div className="flex h-full overflow-hidden">
        {/* Chart area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 relative min-h-0">
            <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0" preserveAspectRatio="none">
              <defs>
                <linearGradient id="modalChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              {[0, 33, 66, 100].map((y) => (
                <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
              ))}
              <polygon fill="url(#modalChartGradient)" points={fillPoints} />
              <polyline
                fill="none"
                stroke={isPositive ? '#22c55e' : '#ef4444'}
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
              {/* Scrub indicator - crosshair lines and dot */}
              {isScrubbing && scrubX !== null && scrubY !== null && (
                <>
                  {/* Vertical line */}
                  <line 
                    x1={scrubX} 
                    y1="0" 
                    x2={scrubX} 
                    y2="100" 
                    stroke="#6b7280" 
                    strokeWidth="0.5" 
                    strokeDasharray="2,2"
                  />
                  {/* Horizontal line */}
                  <line 
                    x1="0" 
                    y1={scrubY} 
                    x2="100" 
                    y2={scrubY} 
                    stroke="#6b7280" 
                    strokeWidth="0.5" 
                    strokeDasharray="2,2"
                  />
                  <circle 
                    cx={scrubX} 
                    cy={scrubY} 
                    r="2" 
                    fill={isPositive ? '#22c55e' : '#ef4444'}
                    stroke="white"
                    strokeWidth="0.5"
                  />
                </>
              )}
            </svg>
          </div>
          {/* X-axis labels - relative times like Robinhood */}
          {renderTimeLabels(chartData.length)}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] transition-opacity ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet Modal */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-[101] bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl max-h-[95vh] flex flex-col ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-preview-title"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{symbol}</p>
            <h2 id="stock-preview-title" className="text-xl font-bold text-gray-900 dark:text-white">{name}</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleWatchlist}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              aria-label={isInWatchlist(symbol) ? 'Remove from watchlist' : 'Add to watchlist'}
            >
              <Star className={`w-6 h-6 transition-colors ${isInWatchlist(symbol) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400 hover:text-yellow-400'}`} />
            </button>
            <button
              onClick={handleToggleFavorite}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              aria-label={isFavorite(symbol) ? 'Remove from My Screens' : 'Add to My Screens'}
            >
              <TrendingUp className={`w-6 h-6 transition-colors ${isFavorite(symbol) ? 'text-purple-500' : 'text-gray-400 hover:text-purple-400'}`} />
            </button>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Close preview"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content - scrollable */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          {/* Price - shows scrub price when touching chart */}
          <div className={`flex items-baseline gap-3 flex-wrap transition-opacity duration-150 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {isScrubbing && scrubPrice !== null ? (
                <AnimatedPrice 
                  value={scrubPrice} 
                  prefix={pricePrefix} 
                  suffix={priceSuffix}
                  duration={200}
                />
              ) : (
                <>{pricePrefix}{!isNaN(numericPrice) ? numericPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : price}{priceSuffix}</>
              )}
            </span>
            <div className={`flex items-center gap-1 transition-colors duration-200 ${
              isScrubbing && scrubChange 
                ? (scrubChange.percentChange >= 0 ? 'text-green-500' : 'text-red-500')
                : (isPositive ? 'text-green-500' : 'text-red-500')
            }`}>
              {(isScrubbing && scrubChange ? scrubChange.percentChange >= 0 : isPositive) 
                ? <TrendingUp className="w-4 h-4" /> 
                : <TrendingDown className="w-4 h-4" />}
              <span className="font-semibold">
                {isScrubbing && scrubChange ? (
                  <>{pricePrefix}{scrubChange.percentChange >= 0 ? '+' : ''}{scrubChange.valueChange.toFixed(2)}{priceSuffix} ({scrubChange.percentChange >= 0 ? '+' : ''}{scrubChange.percentChange.toFixed(2)}%)</>
                ) : (
                  <>{pricePrefix}{isPositive ? '+' : ''}{currentData.valueChange?.toFixed(2) || '0.00'}{priceSuffix} ({isPositive ? '+' : ''}{currentData.change?.toFixed(2) || '0.00'}%)</>
                )}
              </span>
            </div>
          </div>

          {/* User's Position */}
          {isPaperTradingEnabled && position && (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
              <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                You own {parseFloat(position.quantity).toLocaleString()} shares
              </span>
            </div>
          )}

          {/* Chart - interactive scrubbing */}
          <div 
            ref={chartRef}
            className={`bg-gray-100 dark:bg-gray-700/50 rounded-xl p-3 h-48 overflow-hidden transition-opacity duration-150 touch-none ${isTransitioning ? 'opacity-0' : 'opacity-100'} ${isScrubbing ? 'cursor-grabbing' : 'cursor-crosshair'}`}
            onPointerDown={handleScrubStart}
            onPointerMove={handleScrubMove}
            onPointerUp={handleScrubEnd}
            onPointerCancel={handleScrubEnd}
            onPointerLeave={handleScrubEnd}
          >
            {renderSparkline()}
          </div>
          
          {/* Timeframe & Interval Selector */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <TimeframeSelector
                selectedPeriod={selectedPeriod}
                selectedInterval={selectedInterval}
                onPeriodChange={handlePeriodChange}
                onIntervalChange={handleIntervalChange}
                compact
              />
            </div>
            {/* Chart mode toggle */}
            <button
              onClick={() => setChartMode(chartMode === 'line' ? 'candle' : 'line')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 ${
                chartMode === 'candle'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={chartMode === 'line' ? 'Switch to candlestick' : 'Switch to line chart'}
            >
              {chartMode === 'line' ? <BarChart2 className="w-4 h-4" /> : <LineChart className="w-4 h-4" />}
            </button>
          </div>

          {/* Brief Description */}
          {assetDescriptions[symbol] && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {assetDescriptions[symbol].description}
                </p>
              </div>
              {assetDescriptions[symbol].interpretation && (
                <p className="text-xs text-gray-500 dark:text-gray-400 pl-6 border-l-2 border-blue-200 dark:border-blue-700 ml-1">
                  {assetDescriptions[symbol].interpretation}
                </p>
              )}
            </div>
          )}

          {/* Paper Trading Section - Collapsible */}
          <div className="border border-orange-200 dark:border-orange-800 rounded-xl overflow-hidden bg-orange-50 dark:bg-orange-900/20">
            <button
              onClick={() => setIsPaperTradingExpanded(!isPaperTradingExpanded)}
              className="w-full flex items-center justify-between p-3 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Paper Trading</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Position summary when collapsed */}
                {!isPaperTradingExpanded && isPaperTradingEnabled && position && (
                  <div className="flex flex-col items-end text-xs">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      {parseFloat(position.quantity).toLocaleString()} shares
                    </span>
                    <span className={`font-semibold ${
                      parseFloat(position.unrealized_pl) >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {parseFloat(position.unrealized_pl) >= 0 ? '+' : ''}${parseFloat(position.unrealized_pl).toFixed(2)} ({parseFloat(position.unrealized_pl_percent).toFixed(1)}%)
                    </span>
                  </div>
                )}
                <ChevronDown className={`w-5 h-5 text-orange-500 transition-transform duration-200 ${isPaperTradingExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isPaperTradingExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="border-t border-orange-200 dark:border-orange-800">
                <PaperTradingSection
                  symbol={symbol}
                  name={name}
                  currentPrice={numericPrice}
                  hideHeader
                />
              </div>
            </div>
          </div>

          {/* Options Chain Section - Collapsible */}
          <div className="border border-purple-200 dark:border-purple-800 rounded-xl overflow-hidden bg-purple-50 dark:bg-purple-900/20">
            <button
              onClick={() => setIsOptionsExpanded(!isOptionsExpanded)}
              className="w-full flex items-center justify-between p-3 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Options Chain</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Options positions summary when collapsed */}
                {!isOptionsExpanded && isPaperTradingEnabled && optionPositions.length > 0 && (
                  <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                    {optionPositions.length} position{optionPositions.length !== 1 ? 's' : ''}
                  </span>
                )}
                <ChevronDown className={`w-5 h-5 text-purple-500 transition-transform duration-200 ${isOptionsExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOptionsExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="border-t border-purple-200 dark:border-purple-800 p-3">
                <OptionsChainSection
                  symbol={symbol}
                  currentPrice={numericPrice}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions - fixed at bottom */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3 flex-shrink-0">
          <button
            onClick={handleTogglePivyChat}
            className={`w-full py-3 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              isInChat
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-2 border-purple-200 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/30'
            }`}
          >
            {isInChat ? (
              <>
                <Check className="w-5 h-5" />
                Added to Today&apos;s Pivy Chat
              </>
            ) : (
              <>
                <MessageSquarePlus className="w-5 h-5" />
                Add to Today&apos;s Pivy Chat
              </>
            )}
          </button>
          <button
            onClick={handleOpenFullView}
            className="w-full py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-2 border-blue-200 dark:border-blue-700 font-semibold rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-5 h-5" />
            Open Full View
          </button>
          <button
            onClick={handleClose}
            className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        @keyframes slide-down {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(100%);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fade-out {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
        .animate-slide-down {
          animation: slide-down 0.28s ease-in forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        .animate-fade-out {
          animation: fade-out 0.25s ease-in forwards;
        }
        @keyframes toast-slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-toast-slide-up {
          animation: toast-slide-up 0.25s ease-out forwards;
        }
      `}</style>

      {/* Toast Notification */}
      {toast && (
        <div 
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[102] animate-toast-slide-up"
          onClick={() => handleToastClick(toast.link)}
          style={{ cursor: toast.link ? 'pointer' : 'default' }}
        >
          <div className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-lg backdrop-blur-sm transition-transform ${
            toast.link ? 'hover:scale-105 active:scale-95' : ''
          } ${
            toast.type === 'success' 
              ? 'bg-pink-500/90 text-white' 
              : toast.type === 'watchlist'
              ? 'bg-yellow-500/90 text-white'
              : toast.type === 'error'
              ? 'bg-red-500/90 text-white'
              : 'bg-gray-800/90 text-white dark:bg-gray-700/90'
          }`}>
            {toast.type === 'watchlist' ? (
              <Star className="w-4 h-4 fill-white" />
            ) : toast.type === 'error' ? (
              <ExternalLink className="w-4 h-4" />
            ) : (
              <TrendingUp className={`w-4 h-4 ${toast.type === 'success' ? 'text-white' : ''}`} />
            )}
            <span className="text-sm font-medium whitespace-nowrap">{toast.message}</span>
          </div>
        </div>
      )}
    </>
  );
}
