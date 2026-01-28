"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Activity, TrendingUp, BarChart3, Settings, Info, Zap, LineChart, CandlestickChart } from 'lucide-react';
import { TechnicalIndicatorsPanel, type ExtendedIndicatorData } from '@/components/charts';
import IndicatorInfoModal from '@/components/modals/IndicatorInfoModal';
import LiveScreenSettingsDrawer from '@/components/modals/LiveScreenSettingsDrawer';
import { useToast } from '@/components/context/ToastContext';
import { getPricePrefix, getPriceSuffix } from '@/lib/priceUtils';

type ChartPeriod = '1D' | '1W' | '1M' | '1Y';

interface ChartDataState {
  sparkline: number[];
  change: number;
  valueChange: number;
  loading: boolean;
  error: string | null;
}

// Settings interface
interface LiveScreenSettings {
  autoRefresh: boolean;
  refreshInterval: number;
  showMACD: boolean;
  showRSI: boolean;
  showStochastic: boolean;
  showBB: boolean;
  showVolume: boolean;
  showMovingAverages: boolean;
}

const DEFAULT_SETTINGS: LiveScreenSettings = {
  autoRefresh: true,
  refreshInterval: 30,
  showMACD: true,
  showRSI: true,
  showStochastic: true,
  showBB: true,
  showVolume: true,
  showMovingAverages: true,
};

const SETTINGS_KEY = 'livescreen_settings';

interface OverallSignal {
  signal: 'BUY' | 'SELL' | 'HOLD';
  score: number;
  confidence: number;
}

interface MovingAverageData {
  current: number | null;
  status: 'bullish' | 'bearish' | 'neutral';
}

interface MovingAverages {
  sma20: MovingAverageData;
  sma50: MovingAverageData;
  sma200: MovingAverageData;
  ema12: MovingAverageData;
  ema26: MovingAverageData;
  currentPrice: number | null;
}

interface VolumeData {
  current: {
    volume: number;
    avgVolume: number;
    ratio: number;
  };
  trend: 'bullish' | 'bearish' | 'neutral';
}

interface IndicatorResponse {
  symbol: string;
  timeframe: string;
  overallSignal?: OverallSignal;
  movingAverages?: MovingAverages;
  volume?: VolumeData;
}

export default function LiveScreenDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const symbol = (params.symbol as string) || '';
  const decodedSymbol = decodeURIComponent(symbol);
  
  const [additionalData, setAdditionalData] = useState<IndicatorResponse | null>(null);
  const [isLoadingAdditional, setIsLoadingAdditional] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Chart state
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('1D');
  const [chartMode, setChartMode] = useState<'line' | 'candle'>('line');
  const [chartData, setChartData] = useState<ChartDataState>({
    sparkline: [],
    change: 0,
    valueChange: 0,
    loading: true,
    error: null,
  });
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const lastFetchedPeriod = useRef<ChartPeriod | null>(null);
  
  // Historical signals for chart markers (BUY/SELL/HOLD change points)
  const [historicalSignals, setHistoricalSignals] = useState<Array<{
    timestamp: number;
    price: number;
    signal: 'BUY' | 'SELL' | 'HOLD';
    rsi: number;
    score: number;
  }>>([]);
  
  // Settings state - initialized from localStorage
  const [settings, setSettings] = useState<LiveScreenSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    setSettingsLoaded(true);
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (settingsLoaded) {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
    }
  }, [settings, settingsLoaded]);

  // Settings handlers
  const handleAutoRefreshChange = (value: boolean) => {
    setSettings(prev => ({ ...prev, autoRefresh: value }));
    showToast(value ? 'Auto-refresh enabled' : 'Auto-refresh disabled', 'info', 2000);
  };

  const handleRefreshIntervalChange = (value: number) => {
    setSettings(prev => ({ ...prev, refreshInterval: value }));
    showToast(`Refresh interval set to ${value}s`, 'info', 2000);
  };

  const handleShowMACDChange = (value: boolean) => {
    setSettings(prev => ({ ...prev, showMACD: value }));
    showToast(value ? 'MACD enabled' : 'MACD hidden', 'info', 1500);
  };

  const handleShowRSIChange = (value: boolean) => {
    setSettings(prev => ({ ...prev, showRSI: value }));
    showToast(value ? 'RSI enabled' : 'RSI hidden', 'info', 1500);
  };

  const handleShowStochasticChange = (value: boolean) => {
    setSettings(prev => ({ ...prev, showStochastic: value }));
    showToast(value ? 'Stochastic enabled' : 'Stochastic hidden', 'info', 1500);
  };

  const handleShowBBChange = (value: boolean) => {
    setSettings(prev => ({ ...prev, showBB: value }));
    showToast(value ? 'Bollinger Bands enabled' : 'Bollinger Bands hidden', 'info', 1500);
  };

  const handleShowVolumeChange = (value: boolean) => {
    setSettings(prev => ({ ...prev, showVolume: value }));
    showToast(value ? 'Volume enabled' : 'Volume hidden', 'info', 1500);
  };

  const handleShowMovingAveragesChange = (value: boolean) => {
    setSettings(prev => ({ ...prev, showMovingAverages: value }));
    showToast(value ? 'Moving Averages enabled' : 'Moving Averages hidden', 'info', 1500);
  };

  // Callback to receive data from TechnicalIndicatorsPanel (avoids duplicate API calls)
  const handleIndicatorDataLoaded = useCallback((data: ExtendedIndicatorData | null, isLoading: boolean) => {
    setIsLoadingAdditional(isLoading);
    if (data) {
      // Extract current price from moving averages data
      const price = (data.movingAverages as Record<string, unknown>)?.currentPrice as number | undefined;
      if (price != null) {
        setCurrentPrice(price);
      }
      
      // Map the extended data to our local interface
      setAdditionalData({
        symbol: decodedSymbol,
        timeframe: 'D',
        overallSignal: data.overallSignal ? {
          signal: data.overallSignal.signal as 'BUY' | 'SELL' | 'HOLD',
          score: data.overallSignal.score,
          confidence: Math.round(Math.abs(data.overallSignal.score) * 100),
        } : undefined,
        movingAverages: data.movingAverages ? {
          sma20: { current: data.movingAverages.sma20?.current ?? null, status: (data.movingAverages.sma20?.status ?? 'neutral') as 'bullish' | 'bearish' | 'neutral' },
          sma50: { current: data.movingAverages.sma50?.current ?? null, status: (data.movingAverages.sma50?.status ?? 'neutral') as 'bullish' | 'bearish' | 'neutral' },
          sma200: { current: data.movingAverages.sma200?.current ?? null, status: (data.movingAverages.sma200?.status ?? 'neutral') as 'bullish' | 'bearish' | 'neutral' },
          ema12: { current: data.movingAverages.ema12?.current ?? null, status: (data.movingAverages.ema12?.status ?? 'neutral') as 'bullish' | 'bearish' | 'neutral' },
          ema26: { current: data.movingAverages.ema26?.current ?? null, status: (data.movingAverages.ema26?.status ?? 'neutral') as 'bullish' | 'bearish' | 'neutral' },
          currentPrice: price ?? null,
        } : undefined,
        volume: data.volume ? {
          current: {
            volume: data.volume.current?.volume ?? 0,
            avgVolume: data.volume.current?.avgVolume ?? 0,
            ratio: data.volume.current?.ratio ?? 100,
          },
          trend: (data.volume.trend?.toLowerCase() ?? 'neutral') as 'bullish' | 'bearish' | 'neutral',
        } : undefined,
      });
    }
  }, [decodedSymbol]);

  // Fetch chart data for selected period
  const fetchChartData = useCallback(async (period: ChartPeriod) => {
    // Prevent duplicate fetches
    if (lastFetchedPeriod.current === period && chartData.sparkline.length > 0) {
      return;
    }
    lastFetchedPeriod.current = period;
    
    setChartData(prev => ({ ...prev, loading: true, error: null }));
    
    const periodToTimeframe: Record<ChartPeriod, string> = {
      '1D': 'day',
      '1W': 'week',
      '1M': 'month',
      '1Y': 'year',
    };
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}/api/market-data/stock-detail/?symbol=${encodeURIComponent(decodedSymbol)}&timeframe=${periodToTimeframe[period]}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setChartData({
          sparkline: data.sparkline || [],
          change: data.change || 0,
          valueChange: data.valueChange || 0,
          loading: false,
          error: null,
        });
        // Also update price if available
        if (data.price && currentPrice === null) {
          setCurrentPrice(data.price);
        }
      } else {
        setChartData(prev => ({ ...prev, loading: false, error: 'Failed to load chart' }));
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartData(prev => ({ ...prev, loading: false, error: 'Failed to load chart' }));
    }
  }, [decodedSymbol, currentPrice, chartData.sparkline.length]);

  // Fetch chart data on mount and when period changes
  useEffect(() => {
    fetchChartData(chartPeriod);
  }, [chartPeriod, fetchChartData]);

  // Fetch historical signals when period changes
  useEffect(() => {
    if (!decodedSymbol) {
      setHistoricalSignals([]);
      return;
    }
    
    const controller = new AbortController();
    
    const fetchHistoricalSignals = async () => {
      try {
        const periodToTimeframe: Record<ChartPeriod, string> = {
          '1D': 'day',
          '1W': 'week',
          '1M': 'month',
          '1Y': 'year',
        };
        const tf = periodToTimeframe[chartPeriod] || 'day';
        
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}/api/market-data/historical-signals/?symbol=${encodeURIComponent(decodedSymbol)}&timeframe=${tf}`,
          { signal: controller.signal }
        );
        
        if (response.ok) {
          const data = await response.json();
          setHistoricalSignals(data.signals || []);
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        console.error('Error fetching historical signals:', error);
        setHistoricalSignals([]);
      }
    };
    
    fetchHistoricalSignals();
    
    return () => controller.abort();
  }, [decodedSymbol, chartPeriod]);

  // Handle period change
  const handlePeriodChange = (period: ChartPeriod) => {
    if (period === chartPeriod) return;
    lastFetchedPeriod.current = null; // Force refetch
    setChartPeriod(period);
  };

  // Chart scrubbing handlers
  const handleChartScrub = useCallback((clientX: number) => {
    if (!chartRef.current || !chartData.sparkline || chartData.sparkline.length === 0) return;
    const rect = chartRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const index = Math.round(percent * (chartData.sparkline.length - 1));
    setScrubIndex(index);
  }, [chartData.sparkline]);

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

  // Calculate scrub price and change
  const scrubPrice = React.useMemo(() => {
    if (scrubIndex === null || !chartData.sparkline || chartData.sparkline.length === 0) return null;
    const idx = Math.max(0, Math.min(scrubIndex, chartData.sparkline.length - 1));
    return chartData.sparkline[idx];
  }, [scrubIndex, chartData.sparkline]);

  const scrubChange = React.useMemo(() => {
    if (scrubPrice === null || !chartData.sparkline || chartData.sparkline.length === 0) return null;
    const firstPrice = chartData.sparkline[0];
    const valueChange = scrubPrice - firstPrice;
    const percentChange = ((scrubPrice - firstPrice) / firstPrice) * 100;
    return { valueChange, percentChange };
  }, [scrubPrice, chartData.sparkline]);

  const formatVolume = (vol: number) => {
    if (vol >= 1_000_000_000) return (vol / 1_000_000_000).toFixed(2) + 'B';
    if (vol >= 1_000_000) return (vol / 1_000_000).toFixed(2) + 'M';
    if (vol >= 1_000) return (vol / 1_000).toFixed(1) + 'K';
    return vol.toString();
  };

  const getSignalColor = (signal?: string) => {
    switch (signal) {
      case 'BUY': return 'text-green-500';
      case 'SELL': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getSignalBgColor = (signal?: string) => {
    switch (signal) {
      case 'BUY': return 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800';
      case 'SELL': return 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800';
      default: return 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" />
                <h1 className="text-lg font-semibold">{decodedSymbol}</h1>
              </div>
              {currentPrice != null && (
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  ${currentPrice.toFixed(2)}
                </span>
              )}
              {isLoadingAdditional && currentPrice == null && (
                <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsInfoModalOpen(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title="Indicator Guide"
            >
              <Info className="w-5 h-5 text-gray-500" />
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title="Live Screen Settings"
            >
              <Settings className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-28 space-y-6 max-w-2xl mx-auto">
        
        {/* Live Status Banner */}
        <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-sm text-purple-700 dark:text-purple-300">
            Live Technical Analysis
          </span>
        </div>

        {/* Price Chart Section */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-3">
          {/* Chart Header with Price */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isScrubbing ? 'Scrubbing' : 'Price Chart'}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {getPricePrefix(decodedSymbol)}
                  {(isScrubbing && scrubPrice !== null ? scrubPrice : (currentPrice || 0)).toFixed(2)}
                  {getPriceSuffix(decodedSymbol)}
                </span>
                {(isScrubbing && scrubChange) ? (
                  <span className={`text-sm font-medium ${scrubChange.percentChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {scrubChange.percentChange >= 0 ? '+' : ''}{scrubChange.percentChange.toFixed(2)}%
                    <span className="text-gray-400 ml-1">
                      ({scrubChange.valueChange >= 0 ? '+' : ''}{getPricePrefix(decodedSymbol)}{scrubChange.valueChange.toFixed(2)})
                    </span>
                  </span>
                ) : (
                  chartData.change !== 0 && (
                    <span className={`text-sm font-medium ${chartData.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {chartData.change >= 0 ? '+' : ''}{chartData.change.toFixed(2)}%
                    </span>
                  )
                )}
              </div>
            </div>
            {/* Chart mode toggle */}
            <button
              onClick={() => setChartMode(chartMode === 'line' ? 'candle' : 'line')}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={chartMode === 'line' ? 'Switch to candlestick' : 'Switch to line chart'}
            >
              {chartMode === 'line' ? (
                <CandlestickChart className="w-5 h-5 text-gray-500" />
              ) : (
                <LineChart className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </div>

          {/* Chart Area */}
          <div 
            ref={chartRef}
            className={`h-40 relative ${isScrubbing ? 'touch-none' : ''}`}
            onPointerDown={handleScrubStart}
            onPointerMove={handleScrubMove}
            onPointerUp={handleScrubEnd}
            onPointerLeave={handleScrubEnd}
          >
            {chartData.loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : chartData.error ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                {chartData.error}
              </div>
            ) : chartData.sparkline.length < 2 ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                No chart data available
              </div>
            ) : (() => {
              const data = chartData.sparkline;
              const min = Math.min(...data);
              const max = Math.max(...data);
              const range = max - min || 1;
              const paddedMin = min - range * 0.05;
              const paddedMax = max + range * 0.05;
              const paddedRange = paddedMax - paddedMin;
              const isPositive = chartData.change >= 0;

              if (chartMode === 'candle') {
                // Candlestick chart
                const candleCount = Math.min(40, Math.floor(data.length / 2));
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
                const gap = candleWidth * 0.4;

                return (
                  <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                    {[0, 33, 66, 100].map((y) => (
                      <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
                    ))}
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
                          <line x1={x + candleWidth / 2 - gap / 2} y1={highY} x2={x + candleWidth / 2 - gap / 2} y2={lowY} stroke={color} strokeWidth="0.5" />
                          <rect x={x} y={bodyTop} width={candleWidth - gap} height={bodyHeight} fill={color} stroke={color} strokeWidth="0.3" />
                        </g>
                      );
                    })}
                    {isScrubbing && scrubIndex !== null && (() => {
                      const scrubX = (scrubIndex / (data.length - 1)) * 100;
                      const scrubValue = data[scrubIndex];
                      const scrubY = 100 - ((scrubValue - paddedMin) / paddedRange) * 100;
                      return (
                        <>
                          <line x1={scrubX} y1="0" x2={scrubX} y2="100" stroke="#6b7280" strokeWidth="0.5" strokeDasharray="2,2" />
                          <line x1="0" y1={scrubY} x2="100" y2={scrubY} stroke="#6b7280" strokeWidth="0.5" strokeDasharray="2,2" />
                          <circle cx={scrubX} cy={scrubY} r="2" fill={scrubValue >= data[0] ? '#22c55e' : '#ef4444'} stroke="white" strokeWidth="0.5" />
                        </>
                      );
                    })()}
                  </svg>
                );
              }

              // Line chart (default)
              const points = data.map((val, i) => {
                const x = (i / (data.length - 1)) * 100;
                const y = 100 - ((val - paddedMin) / paddedRange) * 100;
                return `${x},${y}`;
              }).join(' ');

              const fillPoints = `0,100 ${points} 100,100`;
              const scrubX = scrubIndex !== null ? (scrubIndex / (data.length - 1)) * 100 : null;
              const scrubY = scrubIndex !== null ? 100 - ((data[scrubIndex] - paddedMin) / paddedRange) * 100 : null;

              return (
                <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="liveChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity="0.15" />
                      <stop offset="100%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[0, 33, 66, 100].map((y) => (
                    <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" strokeOpacity="0.05" strokeWidth="0.3" />
                  ))}
                  <polygon fill="url(#liveChartGradient)" points={fillPoints} />
                  <polyline fill="none" stroke={isPositive ? '#22c55e' : '#ef4444'} strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" points={points} />
                  {/* Historical signal markers (BUY/SELL/HOLD change points) */}
                  {historicalSignals.length > 0 && (() => {
                    const markers: JSX.Element[] = [];
                    const chartLength = data.length;
                    
                    historicalSignals.forEach((signal, idx) => {
                      // Distribute signals across chart proportionally based on their order
                      const signalIndex = Math.floor((idx / Math.max(historicalSignals.length - 1, 1)) * (chartLength - 1));
                      const clampedIndex = Math.min(Math.max(signalIndex, 0), chartLength - 1);
                      
                      const x = (clampedIndex / (chartLength - 1)) * 100;
                      const y = 100 - ((data[clampedIndex] - paddedMin) / paddedRange) * 100;
                      
                      let color = '#a855f7'; // HOLD - purple
                      let bgColor = 'rgba(168, 85, 247, 0.25)';
                      
                      if (signal.signal === 'BUY') {
                        color = '#06b6d4'; // cyan - visible on green charts
                        bgColor = 'rgba(6, 182, 212, 0.25)';
                      } else if (signal.signal === 'SELL') {
                        color = '#f97316'; // orange - visible on red charts
                        bgColor = 'rgba(249, 115, 22, 0.25)';
                      }
                      
                      markers.push(
                        <g key={`signal-${idx}`}>
                          <circle cx={x} cy={signal.signal === 'SELL' ? y - 4 : y + 4} r="2.5" fill={bgColor} />
                          {signal.signal === 'BUY' && (
                            <path d={`M${x},${y + 6} L${x - 1.5},${y + 3} L${x + 1.5},${y + 3} Z`} fill={color} />
                          )}
                          {signal.signal === 'SELL' && (
                            <path d={`M${x},${y - 6} L${x - 1.5},${y - 3} L${x + 1.5},${y - 3} Z`} fill={color} />
                          )}
                          {signal.signal === 'HOLD' && (
                            <circle cx={x} cy={y + 4} r="1.2" fill={color} />
                          )}
                        </g>
                      );
                    });
                    
                    return markers;
                  })()}
                  {isScrubbing && scrubX !== null && scrubY !== null && (
                    <>
                      <line x1={scrubX} y1="0" x2={scrubX} y2="100" stroke="#6b7280" strokeWidth="0.3" strokeDasharray="1.5,1.5" />
                      <line x1="0" y1={scrubY} x2="100" y2={scrubY} stroke="#6b7280" strokeWidth="0.3" strokeDasharray="1.5,1.5" />
                      <circle cx={scrubX} cy={scrubY} r="2.5" fill="none" stroke={isPositive ? '#22c55e' : '#ef4444'} strokeWidth="0.3" opacity="0.6">
                        <animate attributeName="r" values="2;3.5;2" dur="1s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1s" repeatCount="indefinite" />
                      </circle>
                      <circle cx={scrubX} cy={scrubY} r="1.2" fill={isPositive ? '#22c55e' : '#ef4444'} />
                    </>
                  )}
                </svg>
              );
            })()}
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center justify-center gap-2">
            {(['1D', '1W', '1M', '1Y'] as ChartPeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => handlePeriodChange(period)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  chartPeriod === period
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          {/* Signal markers legend */}
          {historicalSignals.length > 0 && chartMode === 'line' && (
            <div className="flex items-center justify-center gap-4 text-[10px] text-gray-500 dark:text-gray-400 pt-2">
              <div className="flex items-center gap-1">
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-cyan-500" style={{ transform: 'rotate(180deg)' }} />
                <span>BUY</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-orange-500" />
                <span>SELL</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span>HOLD</span>
              </div>
              <span className="text-gray-400">|</span>
              <span>{historicalSignals.length} signal{historicalSignals.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Overall Signal Card */}
        {isLoadingAdditional ? (
          <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800/50 dark:to-gray-800/30 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 animate-skeleton-in">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  <div className="h-3.5 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="text-right space-y-2">
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto" />
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <div className="h-2.5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-2.5 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-2.5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300/50 dark:via-gray-600/30 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>
        ) : (
        <div className={`bg-gradient-to-r ${getSignalBgColor(additionalData?.overallSignal?.signal)} rounded-2xl p-4 border animate-content-reveal`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-purple-500" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Overall Technical Signal</p>
              </div>
              <p className={`text-2xl font-bold ${getSignalColor(additionalData?.overallSignal?.signal)}`}>
                {additionalData?.overallSignal?.signal || 'HOLD'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Confidence</p>
              <p className="text-lg font-semibold">
                {Math.round(additionalData?.overallSignal?.confidence || 0)}%
              </p>
            </div>
          </div>
          
          {/* Signal Score Bar */}
          {additionalData?.overallSignal && (
            <div className="mt-4">
              <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                <span>Strong Sell</span>
                <span>Neutral</span>
                <span>Strong Buy</span>
              </div>
              <div className="h-2 bg-gradient-to-r from-red-500 via-gray-300 to-green-500 rounded-full relative">
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-purple-500 transition-all duration-500"
                  style={{ 
                    left: `${((additionalData.overallSignal.score + 1) / 2) * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              </div>
            </div>
          )}
        </div>
        )}

        {/* Technical Indicators Panel (Animated Charts) */}
        <TechnicalIndicatorsPanel 
          symbol={decodedSymbol} 
          onDataLoaded={handleIndicatorDataLoaded}
          showMACD={settings.showMACD}
          showRSI={settings.showRSI}
          showStochastic={settings.showStochastic}
          showBB={settings.showBB}
          showVolume={settings.showVolume}
        />

        {/* Moving Averages Section */}
        {settings.showMovingAverages && (
          isLoadingAdditional ? (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-4 animate-skeleton-in">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-5 w-14 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="h-3.5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ) : (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-4 animate-content-reveal">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h2 className="font-semibold">Moving Averages</h2>
          </div>
          
          <div className="space-y-3">
            {[
              { label: 'SMA 20', data: additionalData?.movingAverages?.sma20 },
              { label: 'SMA 50', data: additionalData?.movingAverages?.sma50 },
              { label: 'SMA 200', data: additionalData?.movingAverages?.sma200 },
              { label: 'EMA 12', data: additionalData?.movingAverages?.ema12 },
              { label: 'EMA 26', data: additionalData?.movingAverages?.ema26 },
            ].map((ma) => (
              <div key={ma.label} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                <span className="text-sm text-gray-600 dark:text-gray-400">{ma.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {ma.data?.current != null ? ma.data.current.toFixed(2) : '--'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    ma.data?.status === 'bullish' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : ma.data?.status === 'bearish'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}>
                    {ma.data?.status || 'neutral'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Current Price Reference */}
          {additionalData?.movingAverages?.currentPrice && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Current Price</span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  ${additionalData.movingAverages.currentPrice.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
          )
        )}

        {/* Volume Section */}
        {settings.showVolume && (
          isLoadingAdditional ? (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-4 animate-skeleton-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="h-5 w-14 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-xl p-3 text-center">
                  <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto mb-2" />
                  <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl p-3 text-center">
                  <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto mb-2" />
                  <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
                </div>
              </div>
              
              <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
            </div>
          ) : (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-4 animate-content-reveal">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-yellow-500" />
              <h2 className="font-semibold">Volume Analysis</h2>
            </div>
            {additionalData?.volume && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                additionalData.volume.trend === 'bullish'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : additionalData.volume.trend === 'bearish'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}>
                {additionalData.volume.trend}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Current Volume</p>
              <p className="text-lg font-semibold">
                {additionalData?.volume?.current.volume 
                  ? formatVolume(additionalData.volume.current.volume) 
                  : '--'}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg Volume (20)</p>
              <p className="text-lg font-semibold">
                {additionalData?.volume?.current.avgVolume 
                  ? formatVolume(additionalData.volume.current.avgVolume) 
                  : '--'}
              </p>
            </div>
          </div>
          
          {additionalData?.volume && (
            <>
              <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    additionalData.volume.current.ratio > 100 
                      ? 'bg-green-500' 
                      : 'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.min(additionalData.volume.current.ratio, 200)}%` }}
                />
              </div>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Volume vs Average: <span className="font-medium">{additionalData.volume.current.ratio != null ? additionalData.volume.current.ratio.toFixed(1) : '--'}%</span>
              </p>
            </>
          )}
        </div>
          )
        )}

      </div>

      {/* Fixed floating close button */}
      <button
        onClick={() => router.push('/watchlist')}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-md py-3 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-2 border-purple-300 dark:border-purple-600 font-semibold rounded-xl hover:bg-purple-200 dark:hover:bg-purple-900/70 transition-all flex items-center justify-center gap-2 shadow-lg"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Watchlist
      </button>

      {/* Indicator Info Modal */}
      <IndicatorInfoModal 
        isOpen={isInfoModalOpen} 
        onClose={() => setIsInfoModalOpen(false)} 
      />

      {/* Live Screen Settings Drawer */}
      <LiveScreenSettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        autoRefresh={settings.autoRefresh}
        onAutoRefreshChange={handleAutoRefreshChange}
        refreshInterval={settings.refreshInterval}
        onRefreshIntervalChange={handleRefreshIntervalChange}
        showMACD={settings.showMACD}
        onShowMACDChange={handleShowMACDChange}
        showRSI={settings.showRSI}
        onShowRSIChange={handleShowRSIChange}
        showStochastic={settings.showStochastic}
        onShowStochasticChange={handleShowStochasticChange}
        showBB={settings.showBB}
        onShowBBChange={handleShowBBChange}
        showVolume={settings.showVolume}
        onShowVolumeChange={handleShowVolumeChange}
        showMovingAverages={settings.showMovingAverages}
        onShowMovingAveragesChange={handleShowMovingAveragesChange}
      />
    </div>
  );
}