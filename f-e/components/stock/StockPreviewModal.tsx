"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, ExternalLink, TrendingUp, TrendingDown, Info, MessageSquarePlus, Check } from 'lucide-react';
import { getPricePrefix, getPriceSuffix, formatAxisPrice } from '@/lib/priceUtils';
import { usePivyChat } from '@/components/context/PivyChatContext';

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
  const [isClosing, setIsClosing] = React.useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = React.useState<'day' | 'week' | 'month' | 'year'>(
    (timeframe?.toLowerCase() as 'day' | 'week' | 'month' | 'year') || 'day'
  );
  const [isTransitioning, setIsTransitioning] = React.useState(false);

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
  const handleTimeframeChange = (tf: 'day' | 'week' | 'month' | 'year') => {
    if (tf === selectedTimeframe) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedTimeframe(tf);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 150);
  };

  // Reset selected timeframe when modal opens with new data
  React.useEffect(() => {
    if (isOpen && timeframe) {
      const tf = timeframe.toLowerCase();
      if (tf === 'day' || tf === 'week' || tf === 'month' || tf === 'year') {
        setSelectedTimeframe(tf);
      }
    }
  }, [isOpen, timeframe]);

  // Get current data based on selected timeframe
  const currentData = React.useMemo(() => {
    if (timeframes && timeframes[selectedTimeframe]) {
      const tfData = timeframes[selectedTimeframe]!;
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
  }, [timeframes, selectedTimeframe, sparkline, change, valueChange, price]);

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

  // Render sparkline chart with axes
  const renderSparkline = () => {
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

    const points = chartData
      .map((val, i) => {
        const x = (i / (chartData.length - 1)) * 100;
        const y = 100 - ((val - paddedMin) / paddedRange) * 100;
        return `${x},${y}`;
      })
      .join(' ');

    // Create gradient fill
    const fillPoints = `0,100 ${points} 100,100`;

    // Generate Y-axis labels (4 price levels)
    const yLabels = [];
    for (let i = 0; i <= 3; i++) {
      const price = paddedMax - (paddedRange * i) / 3;
      yLabels.push(price);
    }

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
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
            </svg>
          </div>
          {/* X-axis labels */}
          <div className="flex justify-between text-[10px] text-gray-400 pt-1 flex-shrink-0">
            <span>Open</span>
            <span>{selectedTimeframe.charAt(0).toUpperCase() + selectedTimeframe.slice(1)}</span>
            <span>Now</span>
          </div>
        </div>
        {/* Y-axis labels (right side) */}
        <div className="flex flex-col justify-between text-[10px] text-gray-400 pl-2 py-1 min-w-[45px] text-left flex-shrink-0">
          {yLabels.map((yPrice, i) => (
            <span key={i}>{formatAxisPrice(yPrice, symbol)}</span>
          ))}
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
        className={`fixed bottom-0 left-0 right-0 z-[101] bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-preview-title"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{symbol}</p>
            <h2 id="stock-preview-title" className="text-xl font-bold text-gray-900 dark:text-white">{name}</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close preview"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Price */}
          <div className={`flex items-baseline gap-3 flex-wrap transition-opacity duration-150 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {pricePrefix}{!isNaN(numericPrice) ? numericPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : price}{priceSuffix}
            </span>
            <div className={`flex items-center gap-1 transition-colors duration-200 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="font-semibold">
                {pricePrefix}{isPositive ? '+' : ''}{currentData.valueChange?.toFixed(2) || '0.00'}{priceSuffix} ({isPositive ? '+' : ''}{currentData.change?.toFixed(2) || '0.00'}%)
              </span>
            </div>
          </div>


          {/* Chart */}
          <div className={`bg-gray-100 dark:bg-gray-700/50 rounded-xl p-3 h-48 overflow-hidden transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            {renderSparkline()}
          </div>
          
          {/* Timeframe buttons */}
          <div className="flex gap-2">
            {(['day', 'week', 'month', 'year'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  selectedTimeframe === tf
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {tf === 'day' ? '1D' : tf === 'week' ? '1W' : tf === 'month' ? '1M' : '1Y'}
              </button>
            ))}
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
        </div>
        

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
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
      `}</style>
    </>
  );
}
