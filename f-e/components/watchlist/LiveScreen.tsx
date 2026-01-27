"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, ChevronRight, Star, TrendingUp, TrendingDown, Trash2, Zap, Gauge, ArrowUpCircle, ArrowDownCircle, Minus, RefreshCw } from 'lucide-react';

// Period and interval types
type PeriodType = '1D' | '1W' | '1M' | '1Y';
type IntervalType = '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

// Valid intervals for each period
const PERIOD_INTERVALS: Record<PeriodType, IntervalType[]> = {
  '1D': ['5m', '15m', '1h'],
  '1W': ['15m', '1h', '4h'],
  '1M': ['1h', '4h', '1d'],
  '1Y': ['1d', '1w'],
};

const PERIOD_LABELS: Record<PeriodType, string> = {
  '1D': '1D',
  '1W': '1W',
  '1M': '1M',
  '1Y': '1Y',
};

const INTERVAL_LABELS: Record<IntervalType, string> = {
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1D',
  '1w': '1W',
};

interface Favorite {
  symbol: string;
  name: string;
}

// Technical indicator summary for each stock
interface StockIndicatorData {
  symbol: string;
  price?: number;
  overallSignal?: {
    signal: 'BUY' | 'SELL' | 'HOLD';
    score: number;
    confidence: number;
  };
  rsi?: {
    current: number;
    status: 'overbought' | 'oversold' | 'neutral';
  };
  macdHistogram?: number[];
  trend?: 'bullish' | 'bearish' | 'neutral';
  isLoading: boolean;
  error?: string;
}

interface LiveScreenProps {
  favorites: Favorite[];
  onLongPress?: (symbol: string, name: string, position: { x: number; y: number }) => void;
  onDoubleTap?: (symbol: string, name: string) => void;
  isInWatchlist?: (symbol: string) => boolean;
  onSwipeRemove?: (symbol: string, name: string) => void;
  enableSwipe?: boolean;
  /** If true, fetches data. If false, pauses fetching but keeps cached data. Default: true */
  isActive?: boolean;
}

// Mini TrendPulse component for My Screens items
function MiniTrendPulse({ 
  dataPoints, 
  trend,
  width = 48,
  height = 20 
}: { 
  dataPoints: number[];
  trend: 'bullish' | 'bearish' | 'neutral';
  width?: number;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const offsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dataPoints || dataPoints.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const getColor = () => {
      if (trend === 'bullish') return { main: '#22c55e', glow: 'rgba(34, 197, 94, 0.4)' };
      if (trend === 'bearish') return { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' };
      return { main: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)' };
    };

    const colors = getColor();
    const padding = 2;
    const chartHeight = height - padding * 2;
    
    // Normalize data
    const minVal = Math.min(...dataPoints);
    const maxVal = Math.max(...dataPoints);
    const range = maxVal - minVal || 1;
    const normalizedPoints = dataPoints.map(v => 
      padding + chartHeight - ((v - minVal) / range) * chartHeight
    );

    const pointsToShow = Math.min(15, normalizedPoints.length);
    const scrollSpeed = 0.8;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw scrolling line
      ctx.beginPath();
      ctx.strokeStyle = colors.main;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const pointSpacing = width / (pointsToShow - 1);
      let lastY = height / 2;
      
      for (let i = 0; i < pointsToShow; i++) {
        const dataOffset = Math.floor(offsetRef.current / 3);
        const dataIndex = (dataOffset + i) % normalizedPoints.length;
        const y = normalizedPoints[dataIndex];
        const x = i * pointSpacing;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        
        if (i === pointsToShow - 1) lastY = y;
      }
      ctx.stroke();

      // Glowing dot at end
      const pulseSize = 2.5 + Math.sin(offsetRef.current * 0.15) * 1;
      ctx.beginPath();
      ctx.arc(width - 2, lastY, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = colors.glow;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(width - 2, lastY, pulseSize * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = colors.main;
      ctx.fill();

      offsetRef.current += scrollSpeed;
      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [dataPoints, trend, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width, height }}
      className="rounded"
    />
  );
}

export default function LiveScreen({ favorites, onLongPress, onDoubleTap, isInWatchlist, onSwipeRemove, enableSwipe = false, isActive = true }: LiveScreenProps) {
  const router = useRouter();
  
  // Period and interval state
  const [period, setPeriod] = useState<PeriodType>('1D');
  const [interval, setInterval] = useState<IntervalType>('15m');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Real indicator data for each stock
  const [indicatorData, setIndicatorData] = useState<Record<string, StockIndicatorData>>({});

  // Long-press detection refs
  const longPressRefs = useRef<Record<string, NodeJS.Timeout | null>>({});
  const pressStartPosRefs = useRef<Record<string, { x: number; y: number } | null>>({});
  const [pressedSymbol, setPressedSymbol] = useState<string | null>(null);
  
  // Double-tap detection refs
  const lastTapRefs = useRef<Record<string, number>>({});
  const tapTimeoutRefs = useRef<Record<string, NodeJS.Timeout | null>>({});

  // Swipe-to-remove state
  const [swipeX, setSwipeX] = useState<Record<string, number>>({});
  const [swipingSymbol, setSwipingSymbol] = useState<string | null>(null);
  const [showRemoveButton, setShowRemoveButton] = useState<Record<string, boolean>>({});
  const swipeStartRef = useRef<{ x: number; y: number; time: number; symbol: string } | null>(null);
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const SWIPE_THRESHOLD = 80;
  const REMOVE_BUTTON_WIDTH = 80;

  // Reset swipe when clicking outside
  useEffect(() => {
    const symbolsWithRemoveButton = Object.keys(showRemoveButton).filter(s => showRemoveButton[s]);
    if (symbolsWithRemoveButton.length === 0) return;
    
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const clickedSymbol = symbolsWithRemoveButton.find(symbol => 
        containerRefs.current[symbol]?.contains(e.target as Node)
      );
      
      if (!clickedSymbol) {
        setSwipeX({});
        setShowRemoveButton({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showRemoveButton]);

  // Touch handlers for swipe
  const handleTouchStart = useCallback((e: React.TouchEvent, symbol: string) => {
    if (!enableSwipe) return;
    
    const touch = e.touches[0];
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now(), symbol };
    setSwipingSymbol(null);
  }, [enableSwipe]);

  const handleTouchMove = useCallback((e: React.TouchEvent, symbol: string) => {
    if (!enableSwipe || !swipeStartRef.current || swipeStartRef.current.symbol !== symbol) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeStartRef.current.x;
    const deltaY = touch.clientY - swipeStartRef.current.y;
    
    // Only allow left swipe, and only if horizontal movement is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setSwipingSymbol(symbol);
      
      // Cancel long-press when swiping
      if (longPressRefs.current[symbol]) {
        clearTimeout(longPressRefs.current[symbol]!);
        longPressRefs.current[symbol] = null;
        setPressedSymbol(null);
      }
      
      // Calculate swipe position (only allow left swipe, capped at remove button width)
      const currentlyShown = showRemoveButton[symbol];
      const newSwipeX = currentlyShown 
        ? Math.max(-REMOVE_BUTTON_WIDTH, Math.min(0, deltaX - REMOVE_BUTTON_WIDTH))
        : Math.max(-REMOVE_BUTTON_WIDTH, Math.min(0, deltaX));
      
      setSwipeX(prev => ({ ...prev, [symbol]: newSwipeX }));
    }
  }, [enableSwipe, showRemoveButton]);

  const handleTouchEnd = useCallback((symbol: string) => {
    if (!enableSwipe || !swipeStartRef.current || swipeStartRef.current.symbol !== symbol) return;
    
    const currentSwipeX = swipeX[symbol] || 0;
    const swipedPastThreshold = Math.abs(currentSwipeX) >= SWIPE_THRESHOLD;
    
    if (swipedPastThreshold) {
      // Snap to reveal remove button
      setSwipeX(prev => ({ ...prev, [symbol]: -REMOVE_BUTTON_WIDTH }));
      setShowRemoveButton(prev => ({ ...prev, [symbol]: true }));
    } else {
      // Snap back
      setSwipeX(prev => ({ ...prev, [symbol]: 0 }));
      setShowRemoveButton(prev => ({ ...prev, [symbol]: false }));
    }
    
    swipeStartRef.current = null;
    setSwipingSymbol(null);
  }, [enableSwipe, swipeX]);

  const handleRemoveClick = useCallback((e: React.MouseEvent | React.TouchEvent, symbol: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // Reset swipe state
    setSwipeX(prev => ({ ...prev, [symbol]: 0 }));
    setShowRemoveButton(prev => ({ ...prev, [symbol]: false }));
    
    // Call remove handler
    onSwipeRemove?.(symbol, name);
  }, [onSwipeRemove]);

  // Handle period change - auto-adjust interval if needed
  const handlePeriodChange = useCallback((newPeriod: PeriodType) => {
    setPeriod(newPeriod);
    const validIntervals = PERIOD_INTERVALS[newPeriod];
    if (!validIntervals.includes(interval)) {
      setInterval(validIntervals[0]);
    }
  }, [interval]);

  // Fetch indicator data for all favorites
  const fetchAllIndicatorData = useCallback(async () => {
    if (favorites.length === 0) return;
    
    setIsRefreshing(true);
    
    const fetchIndicatorData = async (symbol: string) => {
      // Set loading state
      setIndicatorData(prev => ({
        ...prev,
        [symbol]: { ...prev[symbol], symbol, isLoading: true }
      }));

      try {
        const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
        const response = await fetch(
          `${apiUrl}/api/market-data/indicators/${encodeURIComponent(symbol)}/?period=${period}&interval=${interval}&indicator=ALL`
        );

        if (response.status === 429) {
          // Rate limited - use placeholder data silently
          const placeholderHistogram = Array.from({ length: 20 }, () => (Math.random() - 0.5) * 0.3);
          setIndicatorData(prev => ({
            ...prev,
            [symbol]: {
              symbol,
              macdHistogram: placeholderHistogram,
              trend: 'neutral',
              isLoading: false,
            }
          }));
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch');
        }

        const data = await response.json();
        
        // Extract useful data
        const price = data.movingAverages?.currentPrice;
        const rsiCurrent = data.rsi?.current;
        const macdHistogram = data.macd?.histogram || [];
        const overallSignal = data.overallSignal;
        
        // Determine RSI status
        let rsiStatus: 'overbought' | 'oversold' | 'neutral' = 'neutral';
        if (rsiCurrent >= 70) rsiStatus = 'overbought';
        else if (rsiCurrent <= 30) rsiStatus = 'oversold';

        // Determine overall trend from MACD histogram
        let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
        if (macdHistogram.length > 0) {
          const lastHist = macdHistogram[macdHistogram.length - 1];
          trend = lastHist > 0 ? 'bullish' : lastHist < 0 ? 'bearish' : 'neutral';
        }

        setIndicatorData(prev => ({
          ...prev,
          [symbol]: {
            symbol,
            price: price ?? undefined,
            overallSignal: overallSignal ? {
              signal: overallSignal.signal as 'BUY' | 'SELL' | 'HOLD',
              score: overallSignal.score,
              confidence: Math.round(Math.abs(overallSignal.score) * 100),
            } : undefined,
            rsi: rsiCurrent != null ? {
              current: rsiCurrent,
              status: rsiStatus,
            } : undefined,
            macdHistogram,
            trend,
            isLoading: false,
          }
        }));
      } catch (err) {
        // On error, generate placeholder data
        const placeholderHistogram = Array.from({ length: 20 }, () => (Math.random() - 0.5) * 0.3);
        setIndicatorData(prev => ({
          ...prev,
          [symbol]: {
            symbol,
            macdHistogram: placeholderHistogram,
            trend: 'neutral',
            isLoading: false,
            error: 'Failed to load',
          }
        }));
      }
    };

    // Fetch data for all favorites sequentially with longer delay to avoid rate limiting
    // Only fetch first 5 immediately, then batch the rest with longer delays
    const BATCH_SIZE = 3;
    const BATCH_DELAY = 1500; // 1.5 seconds between batches
    
    for (let i = 0; i < favorites.length; i += BATCH_SIZE) {
      const batch = favorites.slice(i, i + BATCH_SIZE);
      
      // Fetch batch in parallel
      await Promise.all(batch.map(fav => fetchIndicatorData(fav.symbol)));
      
      // Wait before next batch (except for the last batch)
      if (i + BATCH_SIZE < favorites.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      }
    }
    
    setIsRefreshing(false);
  }, [favorites, period, interval]);

  // Fetch data on mount and when period/interval changes - only when active
  useEffect(() => {
    if (!isActive) return; // Skip fetch if tab is not active
    fetchAllIndicatorData();
  }, [fetchAllIndicatorData, isActive]);

  const handlePointerDown = useCallback((e: React.PointerEvent, symbol: string, name: string) => {
    if (!onLongPress) return;
    
    setPressedSymbol(symbol);
    pressStartPosRefs.current[symbol] = { x: e.clientX, y: e.clientY };
    
    longPressRefs.current[symbol] = setTimeout(() => {
      if (pressStartPosRefs.current[symbol]) {
        // Haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        onLongPress(symbol, name, pressStartPosRefs.current[symbol]!);
      }
      setPressedSymbol(null);
    }, 500);
  }, [onLongPress]);

  const handlePointerUp = useCallback((symbol: string) => {
    if (longPressRefs.current[symbol]) {
      clearTimeout(longPressRefs.current[symbol]!);
      longPressRefs.current[symbol] = null;
    }
    setPressedSymbol(null);
  }, []);

  const handlePointerLeave = useCallback((symbol: string) => {
    if (longPressRefs.current[symbol]) {
      clearTimeout(longPressRefs.current[symbol]!);
      longPressRefs.current[symbol] = null;
    }
    setPressedSymbol(null);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent, symbol: string) => {
    // Cancel long-press if moved more than 10px
    if (pressStartPosRefs.current[symbol] && longPressRefs.current[symbol]) {
      const dx = Math.abs(e.clientX - pressStartPosRefs.current[symbol]!.x);
      const dy = Math.abs(e.clientY - pressStartPosRefs.current[symbol]!.y);
      if (dx > 10 || dy > 10) {
        clearTimeout(longPressRefs.current[symbol]!);
        longPressRefs.current[symbol] = null;
        setPressedSymbol(null);
      }
    }
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, symbol: string, name: string) => {
    if (!onLongPress) return;
    e.preventDefault();
    onLongPress(symbol, name, { x: e.clientX, y: e.clientY });
  }, [onLongPress]);

  const handleClick = useCallback((e: React.MouseEvent, symbol: string, name: string) => {
    const now = Date.now();
    const timeSinceLastTap = now - (lastTapRefs.current[symbol] || 0);
    
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0 && onDoubleTap) {
      // Double-tap detected
      e.preventDefault();
      e.stopPropagation();
      if (tapTimeoutRefs.current[symbol]) {
        clearTimeout(tapTimeoutRefs.current[symbol]!);
        tapTimeoutRefs.current[symbol] = null;
      }
      onDoubleTap(symbol, name);
      lastTapRefs.current[symbol] = 0;
    } else {
      // Single tap - wait to see if it's a double tap
      lastTapRefs.current[symbol] = now;
      tapTimeoutRefs.current[symbol] = setTimeout(() => {
        router.push(`/watchlist/live-screen/${encodeURIComponent(symbol)}`);
        lastTapRefs.current[symbol] = 0;
      }, 300);
    }
  }, [onDoubleTap, router]);

  // Get available intervals for current period
  const availableIntervals = PERIOD_INTERVALS[period];

  return (
    <div className="space-y-3">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-purple-500" />
          Live Technical Analysis
        </span>
        <button
          onClick={() => fetchAllIndicatorData()}
          disabled={isRefreshing}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh data"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Period & Interval Selectors */}
      <div className="flex flex-col gap-2">
        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 dark:text-gray-500 w-10">Period</span>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 flex-1">
            {(['1D', '1W', '1M', '1Y'] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                disabled={isRefreshing}
                className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-all ${
                  period === p
                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                } disabled:opacity-50`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Interval Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 dark:text-gray-500 w-10">Interval</span>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 flex-1">
            {availableIntervals.map((i) => (
              <button
                key={i}
                onClick={() => setInterval(i)}
                disabled={isRefreshing}
                className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-all ${
                  interval === i
                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                } disabled:opacity-50`}
              >
                {INTERVAL_LABELS[i]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hint for gestures */}
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Tap to view • Long-press for options • Double-tap to remove{enableSwipe ? ' • Swipe left to delete' : ''}
      </p>

      {/* List of favorited stocks with indicators */}
      {favorites.map((fav) => {
        const data = indicatorData[fav.symbol];
        const inWatchlist = isInWatchlist?.(fav.symbol) ?? false;
        const currentSwipeX = swipeX[fav.symbol] || 0;
        const isSwiping = swipingSymbol === fav.symbol;
        const isLoading = data?.isLoading ?? true;
        
        // Get signal colors
        const getSignalColor = (signal?: string) => {
          switch (signal) {
            case 'BUY': return 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700';
            case 'SELL': return 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700';
            default: return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700';
          }
        };

        const getSignalIcon = (signal?: string) => {
          switch (signal) {
            case 'BUY': return <ArrowUpCircle className="w-3 h-3" />;
            case 'SELL': return <ArrowDownCircle className="w-3 h-3" />;
            default: return <Minus className="w-3 h-3" />;
          }
        };
        
        return (
          <div
            key={fav.symbol}
            ref={(el) => { containerRefs.current[fav.symbol] = el; }}
            className="relative overflow-hidden rounded-xl"
          >
            {/* Remove button (revealed on swipe) */}
            {enableSwipe && (currentSwipeX < 0 || showRemoveButton[fav.symbol]) && (
              <button
                type="button"
                onClick={(e) => handleRemoveClick(e, fav.symbol, fav.name)}
                className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
                style={{ zIndex: 5 }}
                aria-label={`Remove ${fav.symbol} from My Screens`}
              >
                <Trash2 className="w-5 h-5 text-white" />
              </button>
            )}
            
            {/* Main content (slides on swipe) */}
            <button
              onClick={(e) => handleClick(e, fav.symbol, fav.name)}
              onPointerDown={(e) => handlePointerDown(e, fav.symbol, fav.name)}
              onPointerUp={() => handlePointerUp(fav.symbol)}
              onPointerLeave={() => handlePointerLeave(fav.symbol)}
              onPointerMove={(e) => handlePointerMove(e, fav.symbol)}
              onContextMenu={(e) => handleContextMenu(e, fav.symbol, fav.name)}
              onTouchStart={(e) => handleTouchStart(e, fav.symbol)}
              onTouchMove={(e) => handleTouchMove(e, fav.symbol)}
              onTouchEnd={() => handleTouchEnd(fav.symbol)}
              className={`w-full bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all text-left relative ${
                pressedSymbol === fav.symbol ? 'scale-[0.98] opacity-90' : ''
              }`}
              style={{
                transform: `translateX(${currentSwipeX}px)`,
                transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
                zIndex: 10,
              }}
            >
              <div className="p-3 space-y-2">
                {/* Top row: Symbol, name, signal badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="relative flex-shrink-0">
                      <Activity className="w-4 h-4 text-purple-400" />
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    </div>
                    <div className="flex flex-col items-start min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">{fav.symbol}</span>
                        {inWatchlist && (
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        )}
                        {/* Price */}
                        {isLoading ? (
                          <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        ) : data?.price != null ? (
                          <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                            ${data.price.toFixed(2)}
                          </span>
                        ) : null}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px] sm:max-w-[140px]">{fav.name}</span>
                    </div>
                  </div>
                  
                  {/* Signal Badge */}
                  {isLoading ? (
                    <div className="h-6 w-14 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  ) : data?.overallSignal ? (
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${getSignalColor(data.overallSignal.signal)}`}>
                      {getSignalIcon(data.overallSignal.signal)}
                      {data.overallSignal.signal}
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                      --
                    </span>
                  )}
                </div>

                {/* Bottom row: RSI, TrendPulse, Chevron */}
                <div className="flex items-center justify-between gap-2">
                  {/* RSI Indicator */}
                  {isLoading ? (
                    <div className="flex items-center gap-1.5">
                      <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  ) : data?.rsi ? (
                    <div className="flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">RSI</span>
                      <span className={`text-xs font-medium ${
                        data.rsi.status === 'overbought' ? 'text-red-500' :
                        data.rsi.status === 'oversold' ? 'text-green-500' :
                        'text-gray-600 dark:text-gray-300'
                      }`}>
                        {data.rsi.current.toFixed(1)}
                      </span>
                      {data.rsi.status !== 'neutral' && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                          data.rsi.status === 'overbought' 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                            : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        }`}>
                          {data.rsi.status === 'overbought' ? 'OB' : 'OS'}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Gauge className="w-3.5 h-3.5" />
                      <span>RSI --</span>
                    </div>
                  )}

                  {/* TrendPulse + Chevron */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isLoading ? (
                      <div className="h-5 w-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                    ) : data?.macdHistogram && data.macdHistogram.length > 0 ? (
                      <MiniTrendPulse 
                        dataPoints={data.macdHistogram}
                        trend={data.trend || 'neutral'}
                        width={48}
                        height={20}
                      />
                    ) : (
                      <div className="h-5 w-12 flex items-center justify-center">
                        <span className="text-[10px] text-gray-400">--</span>
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
