"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Star, Share2, Bell, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';

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
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

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
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Render sparkline as SVG
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
    const isPositive = (stockData?.change ?? 0) >= 0;

    const points = data
      .map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 100;
        return `${x},${y}`;
      })
      .join(' ');

    // Create gradient fill
    const fillPoints = `0,100 ${points} 100,100`;

    return (
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity="0.3" />
            <stop offset="100%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon fill="url(#chartGradient)" points={fillPoints} />
        <polyline
          fill="none"
          stroke={isPositive ? '#22c55e' : '#ef4444'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
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
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-24">
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
              onClick={() => setIsWatchlisted(!isWatchlisted)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
            >
              <Star className={`w-6 h-6 ${isWatchlisted ? 'fill-yellow-400 text-yellow-400' : ''}`} />
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
                  {(stockData.change ?? 0) >= 0 ? '+' : ''}{stockData.valueChange?.toFixed(2) || '0.00'} ({(stockData.change ?? 0) >= 0 ? '+' : ''}{stockData.change?.toFixed(2) || '0.00'}%)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 h-64">
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
      `}</style>
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
