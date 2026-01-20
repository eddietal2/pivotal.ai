"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Activity, BarChart3, Gauge, TrendingUp, RefreshCw, Zap, AlertTriangle, TrendingDown, ArrowUpCircle, ArrowDownCircle, BarChart } from 'lucide-react';
import AnimatedIndicatorChart, { IndicatorData } from './AnimatedIndicatorChart';
import TimeframeSelector, { type PeriodType, type IntervalType, getDefaultInterval } from './TimeframeSelector';

type IndicatorType = 'MACD' | 'RSI' | 'STOCH' | 'BB' | 'VOL';

interface EventBadge {
  label: string;
  type: 'bullish' | 'bearish' | 'neutral' | 'warning';
  icon?: React.ReactNode;
}

interface IndicatorCardProps {
  symbol: string;
  indicator: IndicatorType;
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  data: IndicatorData | null;
  isLoading: boolean;
  period: PeriodType;
  interval: IntervalType;
  height?: number;
}

function IndicatorCard({ 
  symbol, 
  indicator, 
  title, 
  icon, 
  iconColor, 
  data, 
  isLoading, 
  period,
  interval,
  height = 140 
}: IndicatorCardProps) {
  const getStatusBadge = () => {
    if (!data || isLoading) return null;

    if (indicator === 'MACD' && data.macd) {
      const hist = data.macd.current.histogram;
      return (
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${hist >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {hist.toFixed(3)}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            hist > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                     : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
          }`}>
            {hist > 0 ? 'Bullish' : 'Bearish'}
          </span>
        </div>
      );
    }

    if (indicator === 'RSI' && data.rsi) {
      const val = data.rsi.current;
      const badge = val >= 70 
        ? <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">Overbought</span>
        : val <= 30 
          ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">Oversold</span>
          : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">Neutral</span>;
      return (
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${val >= 70 ? 'text-red-500' : val <= 30 ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
            {val.toFixed(1)}
          </span>
          {badge}
        </div>
      );
    }

    if (indicator === 'STOCH' && data.stochastic) {
      const val = data.stochastic.current.k;
      const badge = val >= 80 
        ? <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">Overbought</span>
        : val <= 20 
          ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">Oversold</span>
          : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">Neutral</span>;
      return (
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${val >= 80 ? 'text-red-500' : val <= 20 ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
            {val.toFixed(1)}
          </span>
          {badge}
        </div>
      );
    }

    if (indicator === 'BB' && data.bollingerBands) {
      const val = data.bollingerBands.current.percentB;
      const badge = val >= 80 
        ? <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">Near Upper</span>
        : val <= 20 
          ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">Near Lower</span>
          : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">Mid Band</span>;
      return (
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${val >= 80 ? 'text-red-500' : val <= 20 ? 'text-green-500' : 'text-purple-500'}`}>
            {val.toFixed(1)}%
          </span>
          {badge}
        </div>
      );
    }

    if (indicator === 'VOL' && data.volume?.current) {
      const ratio = data.volume.current.ratio;
      const badge = ratio >= 2 
        ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">High Volume</span>
        : ratio < 0.5 
          ? <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">Low Volume</span>
          : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">Normal</span>;
      return (
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${ratio >= 2 ? 'text-green-500' : ratio < 0.5 ? 'text-amber-500' : 'text-orange-500'}`}>
            {ratio.toFixed(1)}x
          </span>
          {badge}
        </div>
      );
    }

    return null;
  };

  // Detect special events/signals for each indicator
  const getEventBadges = (): EventBadge[] => {
    if (!data || isLoading) return [];
    const events: EventBadge[] = [];

    if (indicator === 'MACD' && data.macd) {
      const { macd, signal, histogram } = data.macd;
      const len = macd.length;
      
      if (len >= 2) {
        // Check for MACD/Signal crossover (compare last 2 values)
        const prevMacd = macd[len - 2];
        const currMacd = macd[len - 1];
        const prevSignal = signal[len - 2];
        const currSignal = signal[len - 1];
        
        // Bullish crossover: MACD crosses above Signal
        if (prevMacd <= prevSignal && currMacd > currSignal) {
          events.push({ label: 'Bullish Crossover', type: 'bullish', icon: <ArrowUpCircle className="w-3 h-3" /> });
        }
        // Bearish crossover: MACD crosses below Signal
        if (prevMacd >= prevSignal && currMacd < currSignal) {
          events.push({ label: 'Bearish Crossover', type: 'bearish', icon: <ArrowDownCircle className="w-3 h-3" /> });
        }
        
        // Check for zero line cross
        const prevHist = histogram[len - 2];
        const currHist = histogram[len - 1];
        if (prevHist <= 0 && currHist > 0) {
          events.push({ label: 'Above Zero', type: 'bullish', icon: <TrendingUp className="w-3 h-3" /> });
        }
        if (prevHist >= 0 && currHist < 0) {
          events.push({ label: 'Below Zero', type: 'bearish', icon: <TrendingDown className="w-3 h-3" /> });
        }
        
        // Histogram momentum
        if (currHist > 0 && currHist > prevHist) {
          events.push({ label: 'Rising Momentum', type: 'bullish' });
        } else if (currHist < 0 && currHist < prevHist) {
          events.push({ label: 'Falling Momentum', type: 'bearish' });
        }
      }
    }

    if (indicator === 'RSI' && data.rsi) {
      const { rsi } = data.rsi;
      const len = rsi.length;
      const current = data.rsi.current;
      
      if (len >= 2) {
        const prev = rsi[len - 2];
        
        // Entering overbought/oversold
        if (prev < 70 && current >= 70) {
          events.push({ label: 'Entering Overbought', type: 'warning', icon: <AlertTriangle className="w-3 h-3" /> });
        }
        if (prev > 30 && current <= 30) {
          events.push({ label: 'Entering Oversold', type: 'bullish', icon: <Zap className="w-3 h-3" /> });
        }
        
        // Exiting overbought/oversold
        if (prev >= 70 && current < 70) {
          events.push({ label: 'Exiting Overbought', type: 'bearish', icon: <ArrowDownCircle className="w-3 h-3" /> });
        }
        if (prev <= 30 && current > 30) {
          events.push({ label: 'Exiting Oversold', type: 'bullish', icon: <ArrowUpCircle className="w-3 h-3" /> });
        }
        
        // RSI direction
        if (current > prev && current > 50) {
          events.push({ label: 'Bullish Momentum', type: 'bullish' });
        } else if (current < prev && current < 50) {
          events.push({ label: 'Bearish Momentum', type: 'bearish' });
        }
      }
    }

    if (indicator === 'STOCH' && data.stochastic) {
      const { k, d } = data.stochastic;
      const len = k.length;
      const currK = data.stochastic.current.k;
      const currD = data.stochastic.current.d;
      
      if (len >= 2) {
        const prevK = k[len - 2];
        const prevD = d[len - 2];
        
        // %K/%D crossover
        if (prevK <= prevD && currK > currD) {
          events.push({ label: 'Bullish Crossover', type: 'bullish', icon: <ArrowUpCircle className="w-3 h-3" /> });
        }
        if (prevK >= prevD && currK < currD) {
          events.push({ label: 'Bearish Crossover', type: 'bearish', icon: <ArrowDownCircle className="w-3 h-3" /> });
        }
        
        // Oversold bounce / Overbought reversal
        if (currK <= 20 && currK > prevK) {
          events.push({ label: 'Oversold Bounce', type: 'bullish', icon: <Zap className="w-3 h-3" /> });
        }
        if (currK >= 80 && currK < prevK) {
          events.push({ label: 'Overbought Reversal', type: 'bearish', icon: <AlertTriangle className="w-3 h-3" /> });
        }
      }
    }

    if (indicator === 'BB' && data.bollingerBands) {
      const { percentB } = data.bollingerBands;
      const len = percentB.length;
      const current = data.bollingerBands.current.percentB;
      
      if (len >= 2) {
        const prev = percentB[len - 2];
        
        // Band touches
        if (current >= 100) {
          events.push({ label: 'Upper Band Touch', type: 'warning', icon: <AlertTriangle className="w-3 h-3" /> });
        }
        if (current <= 0) {
          events.push({ label: 'Lower Band Touch', type: 'bullish', icon: <Zap className="w-3 h-3" /> });
        }
        
        // Band breakouts
        if (prev < 100 && current >= 100) {
          events.push({ label: 'Upper Breakout', type: 'bearish', icon: <ArrowUpCircle className="w-3 h-3" /> });
        }
        if (prev > 0 && current <= 0) {
          events.push({ label: 'Lower Breakout', type: 'bullish', icon: <ArrowDownCircle className="w-3 h-3" /> });
        }
        
        // Mean reversion signals
        if (prev >= 80 && current < 80) {
          events.push({ label: 'Mean Reversion', type: 'bearish' });
        }
        if (prev <= 20 && current > 20) {
          events.push({ label: 'Mean Reversion', type: 'bullish' });
        }
      }
    }

    // Volume Analysis Events
    if (indicator === 'VOL' && data.volume?.current) {
      const { volume, avgVolume, ratio } = data.volume.current;
      const trend = data.volume.trend;
      
      // High Volume Surge (2x+ average)
      if (ratio >= 2) {
        events.push({ label: 'High Volume Surge', type: 'bullish', icon: <ArrowUpCircle className="w-3 h-3" /> });
      }
      
      // Volume Spike (3x+ average)
      if (ratio >= 3) {
        events.push({ label: 'Volume Spike', type: 'neutral', icon: <Zap className="w-3 h-3" /> });
      }
      
      // Low Volume Warning (below 50% average)
      if (ratio < 0.5) {
        events.push({ label: 'Low Volume Warning', type: 'warning', icon: <AlertTriangle className="w-3 h-3" /> });
      }
      
      // Volume Dry Up (below 30% average)
      if (ratio < 0.3) {
        events.push({ label: 'Volume Dry Up', type: 'neutral' });
      }
      
      // Trend-based signals
      if (trend === 'increasing' && ratio > 1) {
        events.push({ label: 'Accumulation', type: 'bullish', icon: <TrendingUp className="w-3 h-3" /> });
      }
      if (trend === 'decreasing' && ratio > 1) {
        events.push({ label: 'Distribution', type: 'bearish', icon: <TrendingDown className="w-3 h-3" /> });
      }
    }

    return events;
  };

  const getCurrentValues = () => {
    if (!data || isLoading) return null;

    if (indicator === 'MACD' && data.macd) {
      return (
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="text-center">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">MACD</p>
            <p className="text-sm font-semibold text-blue-500">{data.macd.current.macd.toFixed(3)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Signal</p>
            <p className="text-sm font-semibold text-orange-500">{data.macd.current.signal.toFixed(3)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Histogram</p>
            <p className={`text-sm font-semibold ${data.macd.current.histogram >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {data.macd.current.histogram.toFixed(3)}
            </p>
          </div>
        </div>
      );
    }

    if (indicator === 'RSI' && data.rsi) {
      return (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-1">
            <span>0</span>
            <span>30</span>
            <span>50</span>
            <span>70</span>
            <span>100</span>
          </div>
          <div className="relative h-2 bg-gradient-to-r from-green-500 via-gray-300 to-red-500 rounded-full">
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-purple-500 transition-all duration-500"
              style={{ left: `${data.rsi.current}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>
          <p className="text-center mt-2 text-lg font-bold">{data.rsi.current.toFixed(1)}</p>
        </div>
      );
    }

    if (indicator === 'STOCH' && data.stochastic) {
      return (
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div className="text-center">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">%K (Fast)</p>
            <p className="text-lg font-semibold text-blue-500">{data.stochastic.current.k.toFixed(1)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">%D (Slow)</p>
            <p className="text-lg font-semibold text-orange-500">{data.stochastic.current.d.toFixed(1)}</p>
          </div>
        </div>
      );
    }

    if (indicator === 'BB' && data.bollingerBands) {
      const bb = data.bollingerBands.current;
      return (
        <div className="grid grid-cols-4 gap-2 mt-3 text-center">
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Upper</p>
            <p className="text-xs font-medium text-red-500">{bb.upper?.toFixed(2) || '--'}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Middle</p>
            <p className="text-xs font-medium">{bb.middle?.toFixed(2) || '--'}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Lower</p>
            <p className="text-xs font-medium text-green-500">{bb.lower?.toFixed(2) || '--'}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">%B</p>
            <p className="text-xs font-medium text-purple-500">{bb.percentB.toFixed(1)}%</p>
          </div>
        </div>
      );
    }

    if (indicator === 'VOL' && data.volume?.current) {
      const vol = data.volume.current;
      const formatVolume = (v: number) => {
        if (v >= 1000000000) return `${(v / 1000000000).toFixed(1)}B`;
        if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
        if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
        return v.toString();
      };
      return (
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="text-center">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Current</p>
            <p className="text-sm font-semibold text-orange-500">{formatVolume(vol.volume)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Average</p>
            <p className="text-sm font-semibold text-gray-500">{formatVolume(vol.avgVolume)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Ratio</p>
            <p className={`text-sm font-semibold ${vol.ratio >= 1.5 ? 'text-green-500' : vol.ratio < 0.5 ? 'text-amber-500' : 'text-gray-500'}`}>
              {vol.ratio.toFixed(2)}x
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  const eventBadges = getEventBadges();

  // Skeleton loading state
  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-3 animate-skeleton-in">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          </div>
        </div>
        
        {/* Chart skeleton */}
        <div 
          className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl relative overflow-hidden"
          style={{ height }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200/50 dark:via-gray-600/30 to-transparent animate-shimmer" />
        </div>
        
        {/* Badge skeleton */}
        <div className="flex gap-2">
          <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        </div>
        
        {/* Values grid skeleton */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center space-y-1">
              <div className="h-2.5 w-12 bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse" />
              <div className="h-4 w-14 bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-3 animate-content-reveal">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={iconColor}>{icon}</span>
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        {getStatusBadge()}
      </div>
      
      <AnimatedIndicatorChart
        data={data}
        indicator={indicator}
        height={height}
        isLoading={isLoading}
        animated={true}
        showLabels={true}
        interactive={true}
      />

      {/* Event Badges */}
      {eventBadges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {eventBadges.map((event, idx) => (
            <span
              key={idx}
              className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-medium ${
                event.type === 'bullish'
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                  : event.type === 'bearish'
                    ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                    : event.type === 'warning'
                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
              }`}
            >
              {event.icon}
              {event.label}
            </span>
          ))}
        </div>
      )}
      
      {getCurrentValues()}
    </div>
  );
}

// Moving average item interface
interface MovingAverageItem {
  values?: (number | null)[];
  current: number | null;
  status: string;
}

// Extended data interface for parent components
export interface ExtendedIndicatorData extends IndicatorData {
  overallSignal?: {
    signal: string;
    score: number;
    summary: string;
  };
  movingAverages?: {
    sma20?: MovingAverageItem;
    sma50?: MovingAverageItem;
    sma200?: MovingAverageItem;
    ema12?: MovingAverageItem;
    ema26?: MovingAverageItem;
    currentPrice?: number | null;
    [key: string]: MovingAverageItem | number | null | undefined;
  };
}

interface TechnicalIndicatorsPanelProps {
  symbol: string;
  className?: string;
  onDataLoaded?: (data: ExtendedIndicatorData | null, isLoading: boolean) => void;
  // Visibility settings
  showMACD?: boolean;
  showRSI?: boolean;
  showStochastic?: boolean;
  showBB?: boolean;
  showVolume?: boolean;
}

export default function TechnicalIndicatorsPanel({ 
  symbol, 
  className = '', 
  onDataLoaded,
  showMACD = true,
  showRSI = true,
  showStochastic = true,
  showBB = true,
  showVolume = true,
}: TechnicalIndicatorsPanelProps) {
  const [period, setPeriod] = useState<PeriodType>('1D');
  const [interval, setInterval] = useState<IntervalType>('15m');
  const [data, setData] = useState<ExtendedIndicatorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchIndicators = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    onDataLoaded?.(null, true);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
      const response = await fetch(
        `${apiUrl}/api/market-data/indicators/${encodeURIComponent(symbol)}/?period=${period}&interval=${interval}&indicator=ALL`
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle rate limiting
        if (response.status === 429) {
          throw new Error('Rate limited. Please wait a moment before refreshing.');
        }
        
        throw new Error(errorData.error || `Failed to fetch indicators: ${response.statusText}`);
      }
      
      const result = await response.json();
      setData(result);
      setLastUpdated(new Date());
      onDataLoaded?.(result, false);
    } catch (err) {
      console.error('Error fetching indicators:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      onDataLoaded?.(null, false);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, period, interval, onDataLoaded]);

  useEffect(() => {
    fetchIndicators();
  }, [fetchIndicators]);

  // Auto-refresh disabled to prevent rate limiting from yfinance
  // Data is cached for 5 minutes on the backend
  // useEffect(() => {
  //   if (period === '1D') {
  //     const interval = setInterval(fetchIndicators, 90000);
  //     return () => clearInterval(interval);
  //   }
  // }, [period, fetchIndicators]);

  const handlePeriodChange = useCallback((newPeriod: PeriodType) => {
    if (newPeriod !== period) {
      setPeriod(newPeriod);
      // Interval will be auto-corrected by TimeframeSelector
    }
  }, [period]);

  const handleIntervalChange = useCallback((newInterval: IntervalType) => {
    if (newInterval !== interval) {
      setInterval(newInterval);
    }
  }, [interval]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Timeframe Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-500" />
          <h2 className="font-semibold">Technical Indicators</h2>
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={fetchIndicators}
          disabled={isLoading}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh data"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Timeframe Selector */}
      <TimeframeSelector
        selectedPeriod={period}
        selectedInterval={interval}
        onPeriodChange={handlePeriodChange}
        onIntervalChange={handleIntervalChange}
        disabled={isLoading}
        compact={false}
      />

      {/* Last Updated */}
      {lastUpdated && !isLoading && (
        <p className="text-[10px] text-gray-400 text-right">
          Updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchIndicators}
            className="mt-2 text-xs text-red-500 hover:text-red-600 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Indicator Cards */}
      {!error && (
        <div className="space-y-4">
          {/* MACD */}
          {showMACD && (
            <IndicatorCard
              symbol={symbol}
              indicator="MACD"
              title="MACD (12, 26, 9)"
              icon={<BarChart3 className="w-5 h-5" />}
              iconColor="text-purple-500"
              data={data}
              isLoading={isLoading}
              period={period}
              interval={interval}
              height={150}
            />
          )}

          {/* RSI */}
          {showRSI && (
            <IndicatorCard
              symbol={symbol}
              indicator="RSI"
              title="RSI (14)"
              icon={<Gauge className="w-5 h-5" />}
              iconColor="text-blue-500"
              data={data}
              isLoading={isLoading}
              period={period}
              interval={interval}
              height={120}
            />
          )}

          {/* Stochastic */}
          {showStochastic && (
            <IndicatorCard
              symbol={symbol}
              indicator="STOCH"
              title="Stochastic (14, 3)"
              icon={<TrendingUp className="w-5 h-5" />}
              iconColor="text-green-500"
              data={data}
              isLoading={isLoading}
              period={period}
              interval={interval}
              height={130}
            />
          )}

          {/* Bollinger Bands */}
          {showBB && (
            <IndicatorCard
              symbol={symbol}
              indicator="BB"
              title="Bollinger Bands (20, 2)"
              icon={<Activity className="w-5 h-5" />}
              iconColor="text-cyan-500"
              data={data}
              isLoading={isLoading}
              period={period}
              interval={interval}
              height={130}
            />
          )}

          {/* Volume Analysis */}
          {showVolume && (
            <IndicatorCard
              symbol={symbol}
              indicator="VOL"
              title="Volume Analysis"
              icon={<BarChart className="w-5 h-5" />}
              iconColor="text-orange-500"
              data={data}
              isLoading={isLoading}
              period={period}
              interval={interval}
              height={120}
            />
          )}

          {/* No indicators selected message */}
          {!showMACD && !showRSI && !showStochastic && !showBB && !showVolume && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No indicators selected</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Enable indicators in Settings to view technical analysis
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
