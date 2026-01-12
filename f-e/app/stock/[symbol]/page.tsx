"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Bell, TrendingUp, TrendingDown, ExternalLink, MessageSquarePlus, Check, Star, X, BarChart2, LineChart } from 'lucide-react';
import { getPricePrefix, getPriceSuffix, isCurrencyAsset } from '@/lib/priceUtils';
import { usePivyChat } from '@/components/context/PivyChatContext';
import { useFavorites, MAX_FAVORITES } from '@/components/context/FavoritesContext';
import { useWatchlist, MAX_WATCHLIST } from '@/components/context/WatchlistContext';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  valueChange: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  pe: number;
  week52High: number;
  week52Low: number;
  sparkline: number[];
}

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = decodeURIComponent(params.symbol as string);
  
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'>('1D');
  const [chartMode, setChartMode] = useState<'line' | 'candle'>('line');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'watchlist' | 'error'; link?: string } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { addAssetToTodaysChat, isAssetInTodaysChat, removeAssetFromTodaysChat } = usePivyChat();
  const { isFavorite, toggleFavorite, isFull: isFavoritesFull } = useFavorites();
  const { isInWatchlist, toggleWatchlist, isFull: isWatchlistFull } = useWatchlist();

  // Check if asset is already in today's chat
  const isInChat = isAssetInTodaysChat(symbol);

  // Handle navigating to a section from toast
  const handleToastClick = (link?: string) => {
    if (link) {
      router.push(link);
    }
  };

  // Handle watchlist toggle with limit check
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
    toggleWatchlist({ symbol, name: stockData?.name || symbol });
    setToast({
      message: wasInWatchlist ? 'Removed from watchlist' : 'Added to watchlist',
      type: 'watchlist',
    });
    setTimeout(() => setToast(null), 2500);
  };

  // Handle favorite toggle with limit check
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
    toggleFavorite({ symbol, name: stockData?.name || symbol });
    setToast({
      message: wasFavorite ? 'Removed from My Screens' : 'Added to My Screens',
      type: wasFavorite ? 'info' : 'success',
    });
    setTimeout(() => setToast(null), 2500);
  };

  // Handle adding/removing asset from today's Pivy Chat
  const handleTogglePivyChat = () => {
    if (isInChat) {
      removeAssetFromTodaysChat(symbol);
    } else if (stockData) {
      addAssetToTodaysChat({
        symbol,
        name: stockData.name || symbol,
        price: stockData.price,
        change: stockData.change,
      });
    }
  };

  useEffect(() => {
    const fetchStockData = async () => {
      // Abort any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      setLoading(true);
      setError(null);
      
      try {
        const timeframeMap: Record<string, string> = {
          '1D': 'day',
          '1W': 'week',
          '1M': 'month',
          '3M': 'month',
          '1Y': 'year',
          'ALL': 'year'
        };
        
        const res = await fetch(
          `http://127.0.0.1:8000/api/market-data/stock-detail/?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframeMap[selectedTimeframe]}`,
          { signal: controller.signal }
        );
        
        if (!res.ok) {
          throw new Error(`Server responded with status: ${res.status}`);
        }
        
        const data = await res.json();
        setStockData(data);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('Error fetching stock data:', err);
        setError(err.message || 'Failed to load stock data');
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [symbol, selectedTimeframe]);

  const pricePrefix = getPricePrefix(symbol);
  const priceSuffix = getPriceSuffix(symbol);

  const formatNumber = (num: number | undefined | null, decimals = 2) => {
    if (num === undefined || num === null) return '—';
    if (num >= 1e12) return `${(num / 1e12).toFixed(decimals)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const formatPrice = (price: number | undefined | null) => {
    if (price === undefined || price === null) return '—';
    return `${pricePrefix}${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${priceSuffix}`;
  };

  // Render sparkline as SVG with axes
  const renderChart = () => {
    const data = stockData?.sparkline || [];
    if (data.length < 2) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400">
          No chart data available
        </div>
      );
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    // Add padding to price range
    const paddedMin = min - range * 0.05;
    const paddedMax = max + range * 0.05;
    const paddedRange = paddedMax - paddedMin;
    const isPositive = (stockData?.change ?? 0) >= 0;

    // Generate Y-axis labels (5 price levels)
    const yLabels = [];
    for (let i = 0; i <= 4; i++) {
      const yPrice = paddedMax - (paddedRange * i) / 4;
      yLabels.push(yPrice);
    }

    // Format price for Y-axis display
    const formatAxisPriceLocal = (p: number) => {
      let formatted: string;
      if (p >= 10000) {
        formatted = `${(p / 1000).toFixed(0)}K`;
      } else if (p >= 1000) {
        formatted = `${(p / 1000).toFixed(1)}K`;
      } else if (p >= 100) {
        formatted = p.toFixed(0);
      } else if (p >= 1) {
        formatted = p.toFixed(2);
      } else {
        formatted = p.toFixed(4);
      }
      return `${pricePrefix}${formatted}${priceSuffix}`;
    };

    // Generate X-axis labels based on timeframe
    const getXLabels = () => {
      switch (selectedTimeframe) {
        case '1D':
          return ['9:30', '11:00', '12:30', '2:00', '4:00'];
        case '1W':
          return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        case '1M':
          return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        case '3M':
          return ['Month 1', 'Month 2', 'Month 3'];
        case '1Y':
          return ['Q1', 'Q2', 'Q3', 'Q4'];
        case 'ALL':
          return ['Start', '', 'Mid', '', 'Now'];
        default:
          return ['Open', '', '', '', 'Now'];
      }
    };

    const xLabels = getXLabels();

    // Candlestick mode rendering
    if (chartMode === 'candle') {
      // Generate OHLC data from closes - group into candles
      const candleCount = Math.min(30, Math.floor(data.length / 3));
      const pointsPerCandle = Math.floor(data.length / candleCount);
      const candles: { open: number; high: number; low: number; close: number }[] = [];
      
      for (let i = 0; i < candleCount; i++) {
        const start = i * pointsPerCandle;
        const end = Math.min(start + pointsPerCandle, data.length);
        const segment = data.slice(start, end);
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
        <div className="flex h-full">
          <div className="flex-1 flex flex-col">
            <div className="flex-1 relative">
              <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                {/* Horizontal grid lines */}
                {[0, 25, 50, 75, 100].map((y) => (
                  <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.3" />
                ))}
                {/* Vertical grid lines */}
                {[0, 25, 50, 75, 100].map((x) => (
                  <line key={x} x1={x} y1="0" x2={x} y2="100" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.3" />
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
                        strokeWidth="0.4"
                      />
                      {/* Body */}
                      <rect
                        x={x}
                        y={bodyTop}
                        width={candleWidth - gap}
                        height={bodyHeight}
                        fill={color}
                        stroke={color}
                        strokeWidth="0.2"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
            {/* X-axis labels */}
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 px-1">
              {xLabels.map((label, i) => (
                <span key={i}>{label}</span>
              ))}
            </div>
          </div>
          {/* Y-axis labels (right side) */}
          <div className="flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 pl-3 py-1 min-w-[55px] text-left">
            {yLabels.map((yPrice, i) => (
              <span key={i}>{formatAxisPriceLocal(yPrice)}</span>
            ))}
          </div>
        </div>
      );
    }

    // Line chart mode (default)
    const points = data
      .map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((val - paddedMin) / paddedRange) * 100;
        return `${x},${y}`;
      })
      .join(' ');

    // Create gradient fill
    const fillPoints = `0,100 ${points} 100,100`;

    return (
      <div className="flex h-full">
        {/* Chart area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative">
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Horizontal grid lines */}
              {[0, 25, 50, 75, 100].map((y) => (
                <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.3" />
              ))}
              {/* Vertical grid lines */}
              {[0, 25, 50, 75, 100].map((x) => (
                <line key={x} x1={x} y1="0" x2={x} y2="100" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.3" />
              ))}
              <polygon fill="url(#chartGradient)" points={fillPoints} />
              <polyline
                fill="none"
                stroke={isPositive ? '#22c55e' : '#ef4444'}
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
            </svg>
          </div>
          {/* X-axis labels */}
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 px-1">
            {xLabels.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>
        </div>
        {/* Y-axis labels (right side) */}
        <div className="flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 pl-3 py-1 min-w-[55px] text-left">
          {yLabels.map((yPrice, i) => (
            <span key={i}>{formatAxisPriceLocal(yPrice)}</span>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 p-4">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="flex gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex-1"></div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold">{symbol}</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleWatchlist}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title={isInWatchlist(symbol) ? 'Remove from watchlist' : 'Add to watchlist'}
            >
              <Star className={`w-6 h-6 transition-colors ${isInWatchlist(symbol) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400 hover:text-yellow-400'}`} />
            </button>
            <button
              onClick={handleToggleFavorite}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title={isFavorite(symbol) ? 'Remove from My Screens' : 'Add to My Screens'}
            >
              <TrendingUp className={`w-6 h-6 transition-colors ${isFavorite(symbol) ? 'text-purple-500' : 'text-gray-400 hover:text-purple-400'}`} />
            </button>
            <button 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title="Set price alert"
            >
              <Bell className="w-6 h-6" />
            </button>
            <button 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title="Share"
            >
              <Share2 className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-4xl mx-auto">
        {/* Stock Info */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{symbol}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {stockData?.name || symbol}
          </h1>
          <div className="flex items-baseline gap-3 mt-2">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">
              {formatPrice(stockData?.price)}
            </span>
            {stockData && (
              <div className={`flex items-center gap-1 ${(stockData.change ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {(stockData.change ?? 0) >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                <span className="text-lg font-semibold">
                  {pricePrefix}{(stockData.change ?? 0) >= 0 ? '+' : ''}{stockData.valueChange?.toFixed(2) || '0.00'}{priceSuffix} ({(stockData.change ?? 0) >= 0 ? '+' : ''}{stockData.change?.toFixed(2) || '0.00'}%)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 h-72">
          {renderChart()}
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setSelectedTimeframe(tf)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedTimeframe === tf
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {tf}
            </button>
          ))}
          {/* Chart mode toggle */}
          <button
            onClick={() => setChartMode(chartMode === 'line' ? 'candle' : 'line')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              chartMode === 'candle'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title={chartMode === 'line' ? 'Switch to candlestick' : 'Switch to line chart'}
          >
            {chartMode === 'line' ? <BarChart2 className="w-4 h-4" /> : <LineChart className="w-4 h-4" />}
          </button>
        </div>

        {/* Key Statistics */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Key Statistics</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatItem label="Open" value={formatPrice(stockData?.open)} />
            <StatItem label="Previous Close" value={formatPrice(stockData?.previousClose)} />
            <StatItem label="Day High" value={formatPrice(stockData?.high)} />
            <StatItem label="Day Low" value={formatPrice(stockData?.low)} />
            <StatItem label="52W High" value={formatPrice(stockData?.week52High)} />
            <StatItem label="52W Low" value={formatPrice(stockData?.week52Low)} />
            <StatItem label="Volume" value={formatNumber(stockData?.volume, 0)} />
            <StatItem label="Avg Volume" value={formatNumber(stockData?.avgVolume, 0)} />
            <StatItem label="Market Cap" value={formatNumber(stockData?.marketCap)} />
            <StatItem label="P/E Ratio" value={stockData?.pe?.toFixed(2) || '—'} />
          </div>
        </div>

        {/* External Links */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">More Information</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleTogglePivyChat}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isInChat
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                  : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-2 border-purple-200 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/30'
              }`}
            >
              {isInChat ? (
                <>
                  <Check className="w-4 h-4" />
                  Added to Today&apos;s Chat
                </>
              ) : (
                <>
                  <MessageSquarePlus className="w-4 h-4" />
                  Add to Today&apos;s Chat
                </>
              )}
            </button>
            <a
              href={`https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Yahoo Finance
            </a>
            <a
              href={`https://www.tradingview.com/symbols/${encodeURIComponent(symbol.replace('^', ''))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              TradingView
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        @keyframes toast-slide-up {
          from {
            transform: translate(-50%, 100%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
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
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] animate-toast-slide-up"
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

      {/* Fixed floating close button */}
      <button
        onClick={() => router.push('/watchlist')}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-md py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-2 border-blue-200 dark:border-blue-700 font-semibold rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all flex items-center justify-center gap-2 shadow-lg"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Watchlist
      </button>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
