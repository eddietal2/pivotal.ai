"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Bell, TrendingUp, TrendingDown, ExternalLink, MessageSquarePlus, Check, Star, X, BarChart2, LineChart, Briefcase, ChevronDown, FileText, DollarSign, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { getPricePrefix, getPriceSuffix, isCurrencyAsset } from '@/lib/priceUtils';
import { usePivyChat } from '@/components/context/PivyChatContext';
import { usePaperTrading } from '@/components/context/PaperTradingContext';
import { useFavorites, MAX_FAVORITES } from '@/components/context/FavoritesContext';
import { useWatchlist, MAX_WATCHLIST } from '@/components/context/WatchlistContext';
import AnimatedPrice from '@/components/ui/AnimatedPrice';
import PaperTradingSection from '@/components/stock/PaperTradingSection';
import OptionsChainSection from '@/components/stock/OptionsChainSection';
import TimeframeSelector, { type PeriodType, type IntervalType, getDefaultInterval } from '@/components/charts/TimeframeSelector';
import { useChartZoom } from '@/hooks/useChartZoom';

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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('1D');
  const [selectedInterval, setSelectedInterval] = useState<IntervalType>('15m');
  const [chartMode, setChartMode] = useState<'line' | 'candle'>('line');
  const [isPaperTradingExpanded, setIsPaperTradingExpanded] = useState(false);
  const [isOptionsExpanded, setIsOptionsExpanded] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'watchlist' | 'error'; link?: string } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalAbortRef = useRef<AbortController | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Pinch-to-zoom for mobile charts
  const {
    zoomState,
    isZooming,
    isPanning,
    handleTouchStart: handleZoomTouchStart,
    handleTouchMove: handleZoomTouchMove,
    handleTouchEnd: handleZoomTouchEnd,
    resetZoom,
    getVisibleRange,
    zoomIn,
    zoomOut,
  } = useChartZoom(chartRef as React.RefObject<HTMLElement>, { minScale: 1, maxScale: 5 });
  
  // State for interval-specific chart data (fetched from indicators endpoint)
  const [intervalChartData, setIntervalChartData] = useState<{
    sparkline: number[];
    loading: boolean;
  }>({ sparkline: [], loading: false });
  
  // Chart scrubbing state (Robinhood-style touch interaction)
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  
  const { addAssetToTodaysChat, isAssetInTodaysChat, removeAssetFromTodaysChat } = usePivyChat();
  const { isFavorite, toggleFavorite, isFull: isFavoritesFull } = useFavorites();
  const { isInWatchlist, toggleWatchlist, isFull: isWatchlistFull } = useWatchlist();
  const { isEnabled: isPaperTradingEnabled, getPosition, getOptionPositionsForUnderlying } = usePaperTrading();
  const position = getPosition(symbol);
  const optionPositions = getOptionPositionsForUnderlying(symbol);

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
      
      // Only show full loading state on initial load
      if (!stockData) {
        setLoading(true);
      }
      setError(null);
      
      try {
        // Map period to backend timeframe format
        const periodToTimeframe: Record<PeriodType, string> = {
          '1D': 'day',
          '1W': 'week',
          '1M': 'month',
          '1Y': 'year'
        };
        
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}/api/market-data/stock-detail/?symbol=${encodeURIComponent(symbol)}&timeframe=${periodToTimeframe[selectedPeriod]}`,
          { signal: controller.signal }
        );
        
        if (!res.ok) {
          throw new Error(`Server responded with status: ${res.status}`);
        }
        
        const data = await res.json();
        setStockData(data);
        setIsInitialLoad(false);
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
  }, [symbol, selectedPeriod]);

  // Fetch interval-specific chart data when period or interval changes (debounced)
  useEffect(() => {
    // Set loading state immediately
    setIntervalChartData(prev => ({ ...prev, loading: true }));
    
    // Debounce the fetch to prevent rapid requests (429 errors)
    const debounceTimer = setTimeout(() => {
      // Abort any in-flight interval request
      if (intervalAbortRef.current) {
        intervalAbortRef.current.abort();
      }
      
      const controller = new AbortController();
      intervalAbortRef.current = controller;
      
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
      const url = `${apiUrl}/api/market-data/indicators/${encodeURIComponent(symbol)}/?period=${selectedPeriod}&interval=${selectedInterval}&indicator=ALL`;
      
      console.log(`[StockDetailPage] Fetching chart data: ${symbol} period=${selectedPeriod} interval=${selectedInterval}`);
      
      fetch(url, { signal: controller.signal })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.closes && data.closes.length > 0) {
            console.log(`[StockDetailPage] Received ${data.closes.length} data points for ${symbol}:`, {
              period: data.period,
              interval: data.interval,
              yf_period: data.yf_period,
              yf_interval: data.yf_interval,
              dataPoints: data.dataPoints,
              firstClose: data.closes[0],
              lastClose: data.closes[data.closes.length - 1],
              firstTimestamp: data.timestamps?.[0],
              lastTimestamp: data.timestamps?.[data.timestamps.length - 1],
            });
            setIntervalChartData({
              sparkline: data.closes,
              loading: false,
            });
          } else {
            console.log(`[StockDetailPage] No closes data for ${symbol}`, data);
            setIntervalChartData({ sparkline: [], loading: false });
          }
        })
        .catch(err => {
          if (err.name === 'AbortError') return;
          console.error(`[StockDetailPage] Error fetching chart data:`, err);
          setIntervalChartData({ sparkline: [], loading: false });
        });
    }, 300); // 300ms debounce
    
    return () => {
      clearTimeout(debounceTimer);
      if (intervalAbortRef.current) {
        intervalAbortRef.current.abort();
      }
    };
  }, [symbol, selectedPeriod, selectedInterval]);

  // Get current chart data - prefer interval data, fallback to stock data sparkline
  const currentChartData = useMemo(() => {
    if (intervalChartData.sparkline.length > 0) {
      const firstPrice = intervalChartData.sparkline[0] || 0;
      const lastPrice = intervalChartData.sparkline[intervalChartData.sparkline.length - 1] || 0;
      const intervalValueChange = lastPrice - firstPrice;
      const intervalPercentChange = firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
      
      return {
        sparkline: intervalChartData.sparkline,
        change: intervalPercentChange,
        valueChange: intervalValueChange,
      };
    }
    
    // Fallback to stock data
    return {
      sparkline: stockData?.sparkline || [],
      change: stockData?.change || 0,
      valueChange: stockData?.valueChange || 0,
    };
  }, [intervalChartData.sparkline, stockData?.sparkline, stockData?.change, stockData?.valueChange]);

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

  // Get scrubbed price when touching chart
  const scrubPrice = useMemo(() => {
    const data = currentChartData.sparkline;
    if (scrubIndex === null || data.length === 0) return null;
    const idx = Math.max(0, Math.min(scrubIndex, data.length - 1));
    return data[idx];
  }, [scrubIndex, currentChartData.sparkline]);

  // Calculate change from first data point to scrubbed point
  const scrubChange = useMemo(() => {
    const data = currentChartData.sparkline;
    if (scrubPrice === null || data.length === 0) return null;
    const firstPrice = data[0];
    const valueChange = scrubPrice - firstPrice;
    const percentChange = ((scrubPrice - firstPrice) / firstPrice) * 100;
    return { valueChange, percentChange };
  }, [scrubPrice, currentChartData.sparkline]);

  // Handle chart scrubbing
  const handleChartScrub = useCallback((clientX: number) => {
    const data = currentChartData.sparkline;
    if (!chartRef.current || data.length === 0) return;
    const rect = chartRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const index = Math.round(percent * (data.length - 1));
    setScrubIndex(index);
  }, [currentChartData.sparkline]);

  const handleScrubStart = useCallback((e: React.PointerEvent) => {
    setIsScrubbing(true);
    handleChartScrub(e.clientX);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [handleChartScrub]);

  const handleScrubMove = useCallback((e: React.PointerEvent) => {
    if (!isScrubbing) return;
    handleChartScrub(e.clientX);
  }, [isScrubbing, handleChartScrub]);

  const handleScrubEnd = useCallback(() => {
    setIsScrubbing(false);
    setScrubIndex(null);
  }, []);

  // Get time labels based on period
  const getTimeLabels = (period: PeriodType) => {
    switch (period) {
      case '1D': return ['9:30 AM', '10:30', '11:30', '12:30 PM', '1:30', '2:30', '3:30'];
      case '1W': return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      case '1M': return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      case '1Y': return ['Jan', 'Apr', 'Jul', 'Oct'];
    }
  };

  // Calculate highlighted time label index based on scrub position
  const getHighlightedLabelIndex = (dataLength: number) => {
    if (!isScrubbing || scrubIndex === null || dataLength === 0) return -1;
    const labels = getTimeLabels(selectedPeriod);
    const percent = scrubIndex / (dataLength - 1);
    return Math.round(percent * (labels.length - 1));
  };

  // Render sparkline as SVG
  const renderChart = () => {
    // Show loading state when fetching interval data
    if (intervalChartData.loading) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            Loading...
          </div>
        </div>
      );
    }
    
    const fullData = currentChartData.sparkline;
    if (fullData.length < 2) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400">
          No chart data available
        </div>
      );
    }

    // Get visible range based on zoom level
    const { startIndex, endIndex } = getVisibleRange(fullData.length);
    const data = fullData.slice(startIndex, endIndex + 1);
    
    // Recalculate min/max for visible data only
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    // Add padding to price range
    const paddedMin = min - range * 0.05;
    const paddedMax = max + range * 0.05;
    const paddedRange = paddedMax - paddedMin;
    const isPositive = currentChartData.change >= 0;

    // Get time labels and highlight index
    const timeLabels = getTimeLabels(selectedPeriod);
    const highlightIdx = getHighlightedLabelIndex(fullData.length);

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
                {/* Scrub indicator - crosshair lines and dot */}
                {isScrubbing && scrubIndex !== null && (() => {
                  const scrubX = (scrubIndex / (data.length - 1)) * 100;
                  const scrubValue = data[scrubIndex];
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
                        fill={scrubValue >= data[0] ? '#22c55e' : '#ef4444'}
                        stroke="white"
                        strokeWidth="0.5"
                      />
                    </>
                  );
                })()}
              </svg>
            </div>
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

    // Calculate scrub indicator position
    const scrubX = scrubIndex !== null ? (scrubIndex / (data.length - 1)) * 100 : null;
    const scrubY = scrubIndex !== null ? 100 - ((data[scrubIndex] - paddedMin) / paddedRange) * 100 : null;

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
        </div>
      </div>
    );
  };

  // Render time labels separately (outside chart container)
  const renderTimeLabels = () => {
    const data = stockData?.sparkline || [];
    if (data.length < 2) return null;
    
    const timeLabels = getTimeLabels(selectedPeriod);
    const highlightIdx = getHighlightedLabelIndex(data.length);
    
    return (
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 px-4 mt-2">
        {timeLabels.map((label, i) => (
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

  if (loading && isInitialLoad) {
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold">{symbol}</h1>
              {stockData && (
                <span className={`text-lg font-bold ${stockData.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPrice(stockData.price)}
                </span>
              )}
              {loading && !stockData && (
                <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              )}
            </div>
          </div>
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
          {/* Price - shows scrub price when touching chart */}
          <div className="flex items-baseline gap-3 mt-2">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">
              {isScrubbing && scrubPrice !== null ? (
                <AnimatedPrice 
                  value={scrubPrice} 
                  prefix={pricePrefix} 
                  suffix={priceSuffix}
                  duration={200}
                />
              ) : (
                formatPrice(stockData?.price)
              )}
            </span>
            {stockData && (
              <div className={`flex items-center gap-1 ${
                isScrubbing && scrubChange 
                  ? (scrubChange.percentChange >= 0 ? 'text-green-500' : 'text-red-500')
                  : (currentChartData.change >= 0 ? 'text-green-500' : 'text-red-500')
              }`}>
                {(isScrubbing && scrubChange ? scrubChange.percentChange >= 0 : currentChartData.change >= 0) 
                  ? <TrendingUp className="w-5 h-5" /> 
                  : <TrendingDown className="w-5 h-5" />}
                <span className="text-lg font-semibold">
                  {isScrubbing && scrubChange ? (
                    <>{pricePrefix}{scrubChange.percentChange >= 0 ? '+' : ''}{scrubChange.valueChange.toFixed(2)}{priceSuffix} ({scrubChange.percentChange >= 0 ? '+' : ''}{scrubChange.percentChange.toFixed(2)}%)</>
                  ) : (
                    <>{pricePrefix}{currentChartData.change >= 0 ? '+' : ''}{currentChartData.valueChange.toFixed(2)}{priceSuffix} ({currentChartData.change >= 0 ? '+' : ''}{currentChartData.change.toFixed(2)}%)</>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* User's Stock Position */}
          {isPaperTradingEnabled && position && (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2 mt-2 w-fit">
              <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                You own {parseFloat(position.quantity).toLocaleString()} shares
              </span>
            </div>
          )}

          {/* User's Options Positions */}
          {isPaperTradingEnabled && optionPositions.length > 0 && (
            <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg px-3 py-2 mt-2 w-fit">
              <DollarSign className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                {optionPositions.length} option{optionPositions.length !== 1 ? 's' : ''} contract{optionPositions.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Chart - interactive scrubbing and pinch-to-zoom */}
        <div className="relative">
          <div 
            ref={chartRef}
            className={`bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 h-64 overflow-hidden touch-none ${
              isZooming || isPanning ? 'cursor-move' : (isScrubbing ? 'cursor-grabbing' : 'cursor-crosshair')
            }`}
            onPointerDown={!isZooming && !isPanning ? handleScrubStart : undefined}
            onPointerMove={!isZooming && !isPanning ? handleScrubMove : undefined}
            onPointerUp={!isZooming && !isPanning ? handleScrubEnd : undefined}
            onPointerCancel={!isZooming && !isPanning ? handleScrubEnd : undefined}
            onPointerLeave={!isZooming && !isPanning ? handleScrubEnd : undefined}
            onTouchStart={handleZoomTouchStart}
            onTouchMove={handleZoomTouchMove}
            onTouchEnd={handleZoomTouchEnd}
          >
            {renderChart()}
          </div>
          
          {/* Zoom controls - show when zoomed or on hover */}
          <div className={`absolute top-2 right-2 flex items-center gap-1 transition-opacity ${
            zoomState.scale > 1 ? 'opacity-100' : 'opacity-0 hover:opacity-100'
          }`}>
            {zoomState.scale > 1 && (
              <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full mr-1">
                {zoomState.scale.toFixed(1)}x
              </span>
            )}
            <button
              onClick={zoomIn}
              className="p-1.5 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-sm hover:bg-white dark:hover:bg-gray-700 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={zoomOut}
              disabled={zoomState.scale <= 1}
              className="p-1.5 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-sm hover:bg-white dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            {zoomState.scale > 1 && (
              <button
                onClick={resetZoom}
                className="p-1.5 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-sm hover:bg-white dark:hover:bg-gray-700 transition-colors"
                title="Reset zoom"
              >
                <RotateCcw className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            )}
          </div>
          
          {/* Zoom hint for mobile */}
          {zoomState.scale === 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-400 dark:text-gray-500 pointer-events-none md:hidden">
              Pinch to zoom
            </div>
          )}
        </div>
        {/* X-axis time labels */}
        {renderTimeLabels()}

        {/* Timeframe & Interval Selector */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <TimeframeSelector
              selectedPeriod={selectedPeriod}
              selectedInterval={selectedInterval}
              onPeriodChange={(period) => {
                setSelectedPeriod(period);
                setSelectedInterval(getDefaultInterval(period));
              }}
              onIntervalChange={setSelectedInterval}
              compact
            />
          </div>
          {/* Chart mode toggle */}
          <button
            onClick={() => setChartMode(chartMode === 'line' ? 'candle' : 'line')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              chartMode === 'candle'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title={chartMode === 'line' ? 'Switch to candlestick' : 'Switch to line chart'}
          >
            {chartMode === 'line' ? <BarChart2 className="w-4 h-4" /> : <LineChart className="w-4 h-4" />}
          </button>
        </div>

        {/* Paper Trading Section - Collapsible */}
        {stockData && (
          <div className="border border-orange-200 dark:border-orange-800 rounded-xl overflow-hidden bg-orange-50 dark:bg-orange-900/20">
            <button
              onClick={() => setIsPaperTradingExpanded(!isPaperTradingExpanded)}
              className="w-full flex items-center justify-between p-4 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Paper Trading</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Position summary when collapsed */}
                {!isPaperTradingExpanded && isPaperTradingEnabled && position && (
                  <div className="flex flex-col items-end text-sm">
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
                  name={stockData.name || symbol}
                  currentPrice={stockData.price}
                  hideHeader
                />
              </div>
            </div>
          </div>
        )}

        {/* Options Chain Section - Collapsible */}
        {stockData && isPaperTradingEnabled && (
          <div className="border border-purple-200 dark:border-purple-800 rounded-xl overflow-hidden bg-purple-50 dark:bg-purple-900/20">
            <button
              onClick={() => setIsOptionsExpanded(!isOptionsExpanded)}
              className="w-full flex items-center justify-between p-4 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-500" />
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Options Chain</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Options positions summary when collapsed */}
                {!isOptionsExpanded && optionPositions.length > 0 && (
                  <div className="flex flex-col items-end text-sm">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      {optionPositions.length} contract{optionPositions.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-purple-600 dark:text-purple-400 font-semibold">
                      {optionPositions.filter(p => p.position_type === 'long').length} long / {optionPositions.filter(p => p.position_type === 'short').length} short
                    </span>
                  </div>
                )}
                <ChevronDown className={`w-5 h-5 text-purple-500 transition-transform duration-200 ${isOptionsExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOptionsExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="border-t border-purple-200 dark:border-purple-800 p-4">
                <OptionsChainSection
                  symbol={symbol}
                  currentPrice={stockData.price}
                />
              </div>
            </div>
          </div>
        )}

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
