"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Activity, BarChart3, Gauge, TrendingUp, RefreshCw } from 'lucide-react';
import AnimatedIndicatorChart, { IndicatorData } from './AnimatedIndicatorChart';

type IndicatorType = 'MACD' | 'RSI' | 'STOCH' | 'BB';
type TimeframeType = 'D' | 'W' | 'M' | 'Y';

interface IndicatorCardProps {
  symbol: string;
  indicator: IndicatorType;
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  data: IndicatorData | null;
  isLoading: boolean;
  timeframe: TimeframeType;
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
  timeframe,
  height = 140 
}: IndicatorCardProps) {
  const getStatusBadge = () => {
    if (!data || isLoading) return null;

    if (indicator === 'MACD' && data.macd) {
      const hist = data.macd.current.histogram;
      return (
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          hist > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                   : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
        }`}>
          {hist > 0 ? 'Bullish' : 'Bearish'}
        </span>
      );
    }

    if (indicator === 'RSI' && data.rsi) {
      const val = data.rsi.current;
      if (val >= 70) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">Overbought</span>;
      if (val <= 30) return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">Oversold</span>;
      return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">Neutral</span>;
    }

    if (indicator === 'STOCH' && data.stochastic) {
      const val = data.stochastic.current.k;
      if (val >= 80) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">Overbought</span>;
      if (val <= 20) return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">Oversold</span>;
      return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">Neutral</span>;
    }

    if (indicator === 'BB' && data.bollingerBands) {
      const val = data.bollingerBands.current.percentB;
      if (val >= 80) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">Near Upper</span>;
      if (val <= 20) return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">Near Lower</span>;
      return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">Mid Band</span>;
    }

    return null;
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

    return null;
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-3">
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
      />
      
      {getCurrentValues()}
    </div>
  );
}

// Extended data interface for parent components
export interface ExtendedIndicatorData extends IndicatorData {
  overallSignal?: {
    signal: string;
    score: number;
    summary: string;
  };
  movingAverages?: {
    [key: string]: {
      value: number;
      signal: string;
      priceRelation: string;
    };
  };
  volume?: {
    current: {
      volume: number;
      avgVolume: number;
      ratio: number;
    };
    trend: string;
  };
}

interface TechnicalIndicatorsPanelProps {
  symbol: string;
  className?: string;
  onDataLoaded?: (data: ExtendedIndicatorData | null, isLoading: boolean) => void;
}

export default function TechnicalIndicatorsPanel({ symbol, className = '', onDataLoaded }: TechnicalIndicatorsPanelProps) {
  const [timeframe, setTimeframe] = useState<TimeframeType>('D');
  const [data, setData] = useState<ExtendedIndicatorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const timeframes: { id: TimeframeType; label: string }[] = [
    { id: 'D', label: '1D' },
    { id: 'W', label: '1W' },
    { id: 'M', label: '1M' },
    { id: 'Y', label: '1Y' },
  ];

  const fetchIndicators = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    onDataLoaded?.(null, true);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(
        `${apiUrl}/api/market-data/indicators/${encodeURIComponent(symbol)}/?timeframe=${timeframe}&indicator=ALL`
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
  }, [symbol, timeframe, onDataLoaded]);

  useEffect(() => {
    fetchIndicators();
  }, [fetchIndicators]);

  // Auto-refresh every 90 seconds for intraday timeframes (increased to reduce rate limiting)
  useEffect(() => {
    if (timeframe === 'D') {
      const interval = setInterval(fetchIndicators, 90000);
      return () => clearInterval(interval);
    }
  }, [timeframe, fetchIndicators]);

  const handleTimeframeChange = (newTimeframe: TimeframeType) => {
    if (newTimeframe !== timeframe) {
      setTimeframe(newTimeframe);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Timeframe Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-500" />
          <h2 className="font-semibold">Technical Indicators</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={fetchIndicators}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          {/* Timeframe Pills */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {timeframes.map((tf) => (
              <button
                key={tf.id}
                onClick={() => handleTimeframeChange(tf.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  timeframe === tf.id
                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

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
          <IndicatorCard
            symbol={symbol}
            indicator="MACD"
            title="MACD (12, 26, 9)"
            icon={<BarChart3 className="w-5 h-5" />}
            iconColor="text-purple-500"
            data={data}
            isLoading={isLoading}
            timeframe={timeframe}
            height={150}
          />

          {/* RSI */}
          <IndicatorCard
            symbol={symbol}
            indicator="RSI"
            title="RSI (14)"
            icon={<Gauge className="w-5 h-5" />}
            iconColor="text-blue-500"
            data={data}
            isLoading={isLoading}
            timeframe={timeframe}
            height={120}
          />

          {/* Stochastic */}
          <IndicatorCard
            symbol={symbol}
            indicator="STOCH"
            title="Stochastic (14, 3)"
            icon={<TrendingUp className="w-5 h-5" />}
            iconColor="text-green-500"
            data={data}
            isLoading={isLoading}
            timeframe={timeframe}
            height={130}
          />

          {/* Bollinger Bands */}
          <IndicatorCard
            symbol={symbol}
            indicator="BB"
            title="Bollinger Bands (20, 2)"
            icon={<Activity className="w-5 h-5" />}
            iconColor="text-cyan-500"
            data={data}
            isLoading={isLoading}
            timeframe={timeframe}
            height={130}
          />
        </div>
      )}
    </div>
  );
}
