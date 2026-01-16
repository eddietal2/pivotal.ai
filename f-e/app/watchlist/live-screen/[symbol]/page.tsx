"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Activity, TrendingUp, BarChart3, Settings, Info, Zap, LineChart } from 'lucide-react';
import { TechnicalIndicatorsPanel, type ExtendedIndicatorData } from '@/components/charts';
import IndicatorInfoModal from '@/components/modals/IndicatorInfoModal';
import LiveScreenSettingsDrawer from '@/components/modals/LiveScreenSettingsDrawer';
import StockPreviewModal from '@/components/stock/StockPreviewModal';
import { useToast } from '@/components/context/ToastContext';

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
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  
  // Stock preview data state
  const [previewData, setPreviewData] = useState<{
    price: number;
    change: number;
    valueChange: number;
    sparkline: number[];
    name: string;
  } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  
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

  // Fetch stock preview data when needed
  const fetchPreviewData = useCallback(async () => {
    if (previewData) {
      setIsPreviewModalOpen(true);
      return;
    }
    
    setIsLoadingPreview(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}/api/market-data/stock-detail/?symbol=${encodeURIComponent(decodedSymbol)}&timeframe=day`
      );
      
      if (response.ok) {
        const data = await response.json();
        setPreviewData({
          price: data.price || currentPrice || 0,
          change: data.change || 0,
          valueChange: data.valueChange || 0,
          sparkline: data.sparkline || [],
          name: data.name || decodedSymbol,
        });
        setIsPreviewModalOpen(true);
      } else {
        showToast('Failed to load stock data', 'error');
      }
    } catch (error) {
      console.error('Error fetching preview data:', error);
      showToast('Failed to load stock data', 'error');
    } finally {
      setIsLoadingPreview(false);
    }
  }, [decodedSymbol, currentPrice, previewData, showToast]);

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

  const timeframeLabels: Record<string, string> = {
    'D': '1 Day',
    'W': '1 Week',
    'M': '1 Month',
    'Y': '1 Year',
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

        {/* View Price Chart Button */}
        <button
          onClick={fetchPreviewData}
          disabled={isLoadingPreview}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingPreview ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <LineChart className="w-5 h-5" />
              View Price Chart
            </>
          )}
        </button>

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

      {/* Stock Preview Modal */}
      <StockPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        symbol={decodedSymbol}
        name={previewData?.name || decodedSymbol}
        price={previewData?.price || currentPrice || 0}
        change={previewData?.change || 0}
        valueChange={previewData?.valueChange || 0}
        sparkline={previewData?.sparkline || []}
        timeframe="day"
      />
    </div>
  );
}
