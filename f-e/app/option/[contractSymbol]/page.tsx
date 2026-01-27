"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, TrendingUp, TrendingDown, ExternalLink, RefreshCw, 
  Calendar, DollarSign, Activity, BarChart3, Clock, Info,
  Loader2, AlertCircle, LineChart, BarChart2
} from 'lucide-react';
import { usePaperTrading } from '@/components/context/PaperTradingContext';
import { useToast } from '@/components/context/ToastContext';
import AnimatedPrice from '@/components/ui/AnimatedPrice';

// Option contract data structure from API
interface OptionContractData {
  contract_symbol: string;
  underlying_symbol: string;
  underlying_price: number;
  option_type: 'call' | 'put';
  strike: number;
  expiration: string;
  bid: number;
  ask: number;
  last: number;
  mark: number;
  volume: number;
  open_interest: number;
  implied_volatility: number;
  in_the_money: boolean;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  rho?: number;
  historical_prices?: number[];
  timestamps?: string[];
}

type OptionAction = 'buy_to_open' | 'sell_to_close' | 'sell_to_open' | 'buy_to_close';

export default function OptionContractPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const contractSymbol = decodeURIComponent(params.contractSymbol as string);
  
  // Get optional params from URL for initial context
  const underlyingFromUrl = searchParams.get('underlying');
  const strikeFromUrl = searchParams.get('strike');
  const typeFromUrl = searchParams.get('type') as 'call' | 'put' | null;
  const expirationFromUrl = searchParams.get('expiration');
  
  const [contractData, setContractData] = useState<OptionContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Trade modal state
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeAction, setTradeAction] = useState<OptionAction>('buy_to_open');
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState<string>('');
  const [isTrading, setIsTrading] = useState(false);
  const [isClosingExpired, setIsClosingExpired] = useState(false);
  
  const { isEnabled, account, refreshAccount, optionPositions } = usePaperTrading();
  const { showToast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Scrubbing state for interactive chart
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);

  // Timeframe state for chart
  type PeriodType = '1D' | '1W' | '1M' | '1Y';
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('1M');
  const [chartLoading, setChartLoading] = useState(false);
  const [historicalData, setHistoricalData] = useState<{ prices: number[]; timestamps: string[] }>({ prices: [], timestamps: [] });
  const [chartMode, setChartMode] = useState<'line' | 'candle'>('line');

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

  const getUserEmail = (): string | null => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    if (!user) return null;
    try {
      return JSON.parse(user).email;
    } catch {
      return null;
    }
  };

  // Check if user has a position in this contract
  const position = useMemo(() => {
    return optionPositions?.find(p => p.contract.contract_symbol === contractSymbol);
  }, [optionPositions, contractSymbol]);

  // Fetch chart data for selected period
  const fetchChartData = useCallback(async (period: PeriodType) => {
    setChartLoading(true);
    try {
      const url = `${BACKEND_URL}/api/paper-trading/options/contract/?symbol=${encodeURIComponent(contractSymbol)}&period=${period}`;
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok && data.historical_prices) {
        setHistoricalData({
          prices: data.historical_prices,
          timestamps: data.timestamps || [],
        });
      }
    } catch (err) {
      console.error('Failed to fetch chart data:', err);
    } finally {
      setChartLoading(false);
    }
  }, [contractSymbol, BACKEND_URL]);

  // Track the last fetched period to avoid duplicate fetches
  const lastFetchedPeriodRef = useRef<string | null>(null);

  // Fetch chart data when period changes or initial load
  useEffect(() => {
    if (contractData && lastFetchedPeriodRef.current !== selectedPeriod) {
      lastFetchedPeriodRef.current = selectedPeriod;
      fetchChartData(selectedPeriod);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, contractData]);

  // Fetch contract data
  const fetchContractData = useCallback(async (showRefreshing = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    if (showRefreshing) {
      setIsRefreshing(true);
    } else if (!contractData) {
      setLoading(true);
    }
    setError(null);

    try {
      const url = `${BACKEND_URL}/api/paper-trading/options/contract/?symbol=${encodeURIComponent(contractSymbol)}`;
      const response = await fetch(url, { signal: controller.signal });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch contract data');
      }

      setContractData(data);
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return;
      const errorMessage = err instanceof Error ? err.message : 'Failed to load contract data';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [contractSymbol, BACKEND_URL, contractData]);

  useEffect(() => {
    fetchContractData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchContractData]);

  // Format expiration date for display
  const formatExpiration = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Calculate days to expiration
  const getDTE = (dateStr: string) => {
    const exp = new Date(dateStr);
    const today = new Date();
    const diff = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff; // Can be negative for expired
  };

  // Check if contract is expired
  const isExpired = (dateStr: string) => {
    const exp = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    exp.setHours(0, 0, 0, 0);
    return exp < today;
  };

  // Get scrubbed price when touching chart
  const scrubPrice = useMemo(() => {
    if (scrubIndex === null || !historicalData.prices || historicalData.prices.length === 0) return null;
    const idx = Math.max(0, Math.min(scrubIndex, historicalData.prices.length - 1));
    return historicalData.prices[idx];
  }, [scrubIndex, historicalData.prices]);

  // Calculate change from first data point to scrubbed point
  const scrubChange = useMemo(() => {
    if (scrubPrice === null || !historicalData.prices || historicalData.prices.length === 0) return null;
    const firstPrice = historicalData.prices[0];
    const valueChange = scrubPrice - firstPrice;
    const percentChange = firstPrice !== 0 ? ((scrubPrice - firstPrice) / firstPrice) * 100 : 0;
    return { valueChange, percentChange };
  }, [scrubPrice, historicalData.prices]);

  // Handle chart scrubbing (accounting for buffer)
  const handleChartScrub = useCallback((clientX: number) => {
    if (!chartRef.current || !historicalData.prices || historicalData.prices.length === 0) return;
    const rect = chartRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    
    // Account for buffer: 15% of data length or min 5 points
    const bufferSize = Math.max(Math.floor(historicalData.prices.length * 0.15), 5);
    const totalLength = historicalData.prices.length + bufferSize;
    const chartIndex = Math.round(percent * (totalLength - 1));
    
    // Map chart index to actual data index (clamp to 0 if in buffer zone)
    const dataIndex = Math.max(0, chartIndex - bufferSize);
    setScrubIndex(dataIndex);
  }, [historicalData.prices]);

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

  // Close expired position
  const closeExpiredPosition = async () => {
    if (!position) return;

    const email = getUserEmail();
    if (!email) {
      showToast('Please log in to close position', 'error', 5000);
      return;
    }

    setIsClosingExpired(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/paper-trading/options/close-expired/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': email,
        },
        body: JSON.stringify({
          contract_symbol: contractSymbol,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to close position');
      }

      const plText = parseFloat(data.settlement.realized_pl) >= 0 ? 'Profit' : 'Loss';
      const plAmount = Math.abs(parseFloat(data.settlement.realized_pl)).toFixed(2);
      showToast(
        `Position closed at $${data.settlement.settlement_price}. ${plText}: $${plAmount}`,
        parseFloat(data.settlement.realized_pl) >= 0 ? 'success' : 'info',
        5000,
        { link: '/watchlist?tab=4' }
      );

      await refreshAccount();
      router.push('/watchlist?tab=4');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to close position';
      showToast(errorMessage, 'error', 5000);
    } finally {
      setIsClosingExpired(false);
    }
  };

  // Calculate trade cost
  const calculateTradeCost = () => {
    if (!contractData) return 0;
    const premium = customPrice && parseFloat(customPrice) > 0 
      ? parseFloat(customPrice) 
      : (contractData.mark || contractData.last || contractData.ask);
    const multiplier = 100;
    const totalPremium = quantity * premium * multiplier;
    
    if (tradeAction === 'buy_to_open' || tradeAction === 'buy_to_close') {
      return totalPremium;
    } else {
      return -totalPremium;
    }
  };

  // Execute option trade
  const executeOptionTrade = async () => {
    if (!contractData) return;

    const email = getUserEmail();
    if (!email) {
      showToast('Please log in to trade', 'error', 5000);
      return;
    }

    setIsTrading(true);

    try {
      const premium = customPrice ? parseFloat(customPrice) : (contractData.mark || contractData.last || contractData.ask);
      
      const response = await fetch(`${BACKEND_URL}/api/paper-trading/options/trades/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': email,
        },
        body: JSON.stringify({
          contract_symbol: contractData.contract_symbol,
          action: tradeAction,
          quantity,
          premium,
          contract: {
            underlying_symbol: contractData.underlying_symbol,
            option_type: contractData.option_type,
            strike_price: contractData.strike,
            expiration_date: contractData.expiration,
            multiplier: 100,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Trade failed');
      }

      const actionText = tradeAction.replace(/_/g, ' ');
      const successMessage = `${actionText.charAt(0).toUpperCase() + actionText.slice(1)}: ${quantity} ${contractData.underlying_symbol} $${contractData.strike} ${contractData.option_type.toUpperCase()} @ $${premium.toFixed(2)}`;
      
      showToast(successMessage, 'success', 4000, { link: '/watchlist?tab=4' });
      
      setShowTradeModal(false);
      setQuantity(1);
      setCustomPrice('');
      
      await refreshAccount();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Trade failed';
      showToast(errorMessage, 'error', 5000);
    } finally {
      setIsTrading(false);
    }
  };

  // Render simple price chart (if historical data available)
  const renderPriceChart = () => {
    if (chartLoading) {
      return (
        <div className="h-40 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent"></div>
        </div>
      );
    }
    
    const data = historicalData.prices;
    if (data.length < 2) {
      return (
        <div className="h-40 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
          Historical price data not available
        </div>
      );
    }

    // Add buffer at the beginning (flat line at first price, like Robinhood)
    const bufferSize = Math.max(Math.floor(data.length * 0.15), 5); // 15% of data length or min 5 points
    const firstPrice = data[0];
    const bufferPoints = Array(bufferSize).fill(firstPrice);
    const chartData = [...bufferPoints, ...data];
    
    // Calculate min/max from actual data (not buffer)
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const paddedMin = min - range * 0.1;
    const paddedMax = max + range * 0.1;
    const paddedRange = paddedMax - paddedMin;
    
    const lastPrice = data[data.length - 1];
    const chartIsPositive = isScrubbing && scrubChange 
      ? scrubChange.percentChange >= 0 
      : lastPrice >= firstPrice;

    // Calculate scrub indicator position (accounting for buffer offset)
    const adjustedScrubIndex = scrubIndex !== null ? scrubIndex + bufferSize : null;
    const scrubX = adjustedScrubIndex !== null ? (adjustedScrubIndex / (chartData.length - 1)) * 100 : null;
    const scrubY = scrubIndex !== null && data[scrubIndex] !== undefined
      ? 100 - ((data[scrubIndex] - paddedMin) / paddedRange) * 100
      : null;

    // Candlestick mode
    if (chartMode === 'candle') {
      // Generate OHLC data from closes - group into candles
      const candleCount = Math.min(40, Math.floor(chartData.length / 2)); // More candles = thinner
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
      const gap = candleWidth * 0.4; // Larger gap for thinner candles

      return (
        <div 
          ref={chartRef}
          className={`h-40 relative touch-none ${isScrubbing ? 'cursor-grabbing' : 'cursor-crosshair'}`}
          onPointerDown={handleScrubStart}
          onPointerMove={handleScrubMove}
          onPointerUp={handleScrubEnd}
          onPointerCancel={handleScrubEnd}
          onPointerLeave={handleScrubEnd}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
            {/* Grid lines */}
            {[25, 50, 75].map((y) => (
              <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.3" />
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
                    fill={color}
                    stroke={color}
                    strokeWidth="0.3"
                  />
                </g>
              );
            })}
            {/* Scrub indicator */}
            {isScrubbing && scrubX !== null && scrubY !== null && (
              <>
                <line
                  x1={scrubX}
                  y1="0"
                  x2={scrubX}
                  y2="100"
                  stroke="#6b7280"
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                />
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
                  fill={chartIsPositive ? '#22c55e' : '#ef4444'}
                  stroke="white"
                  strokeWidth="0.5"
                />
              </>
            )}
          </svg>
          {/* Scrub timestamp label */}
          {isScrubbing && scrubIndex !== null && historicalData.timestamps[scrubIndex] && (
            <div 
              className="absolute bottom-0 transform -translate-x-1/2 text-[10px] text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 px-1 rounded"
              style={{ left: `${(adjustedScrubIndex! / (chartData.length - 1)) * 100}%` }}
            >
              {selectedPeriod === '1D' 
                ? new Date(historicalData.timestamps[scrubIndex]).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                : new Date(historicalData.timestamps[scrubIndex]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              }
            </div>
          )}
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

    const fillPoints = `0,100 ${points} 100,100`;

    return (
      <div 
        ref={chartRef}
        className={`h-40 relative touch-none ${isScrubbing ? 'cursor-grabbing' : 'cursor-crosshair'}`}
        onPointerDown={handleScrubStart}
        onPointerMove={handleScrubMove}
        onPointerUp={handleScrubEnd}
        onPointerCancel={handleScrubEnd}
        onPointerLeave={handleScrubEnd}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="optionChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={chartIsPositive ? '#22c55e' : '#ef4444'} stopOpacity="0.15" />
              <stop offset="100%" stopColor={chartIsPositive ? '#22c55e' : '#ef4444'} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          {[25, 50, 75].map((y) => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" strokeOpacity="0.05" strokeWidth="0.2" />
          ))}
          <polygon fill="url(#optionChartGradient)" points={fillPoints} />
          <polyline
            fill="none"
            stroke={chartIsPositive ? '#22c55e' : '#ef4444'}
            strokeWidth="0.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          {/* Scrub indicator line and dot */}
          {isScrubbing && scrubX !== null && scrubY !== null && (
            <>
              <line
                x1={scrubX}
                y1="0"
                x2={scrubX}
                y2="100"
                stroke={chartIsPositive ? '#22c55e' : '#ef4444'}
                strokeWidth="0.3"
                strokeDasharray="1.5,1.5"
              />
              {/* Pulsating outer ring */}
              <circle
                cx={scrubX}
                cy={scrubY}
                r="2.5"
                fill="none"
                stroke={chartIsPositive ? '#22c55e' : '#ef4444'}
                strokeWidth="0.3"
                opacity="0.6"
              >
                <animate attributeName="r" values="2;3.5;2" dur="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1s" repeatCount="indefinite" />
              </circle>
              {/* Inner solid dot */}
              <circle
                cx={scrubX}
                cy={scrubY}
                r="1.2"
                fill={chartIsPositive ? '#22c55e' : '#ef4444'}
              />
            </>
          )}
        </svg>
        {/* Scrub timestamp label */}
        {isScrubbing && scrubIndex !== null && historicalData.timestamps[scrubIndex] && (
          <div 
            className="absolute bottom-0 transform -translate-x-1/2 text-[10px] text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 px-1 rounded"
            style={{ left: `${(adjustedScrubIndex! / (chartData.length - 1)) * 100}%` }}
          >
            {selectedPeriod === '1D' 
              ? new Date(historicalData.timestamps[scrubIndex]).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
              : new Date(historicalData.timestamps[scrubIndex]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            }
          </div>
        )}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 p-4">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          </div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
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
          <h1 className="text-xl font-semibold truncate">{contractSymbol}</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => fetchContractData()}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!contractData) return null;

  const isCall = contractData.option_type === 'call';
  const dte = getDTE(contractData.expiration);
  const contractExpired = isExpired(contractData.expiration);
  const isITM = contractData.in_the_money;
  const premiumColor = contractExpired ? 'text-gray-500' : isCall ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const premiumBg = contractExpired ? 'bg-gray-100 dark:bg-gray-800' : isCall ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20';
  const premiumBorder = contractExpired ? 'border-gray-300 dark:border-gray-600' : isCall ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800';

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <button
            onClick={() => {
              // Navigate to watchlist with modal params to open the stock preview
              const symbol = contractData?.underlying_symbol || underlyingFromUrl || '';
              const price = contractData?.underlying_price || 0;
              router.push(`/watchlist?modal=${encodeURIComponent(symbol)}&price=${price}`);
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchContractData(true)}
              disabled={isRefreshing}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            {contractData.underlying_symbol && (
              <button
                onClick={() => router.push(`/stock/${encodeURIComponent(contractData.underlying_symbol)}`)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                title={`View ${contractData.underlying_symbol}`}
              >
                <ExternalLink className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto space-y-6">
        {/* Contract Title */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {isCall ? (
              <TrendingUp className="w-6 h-6 text-green-500" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-500" />
            )}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {contractData.underlying_symbol} ${contractData.strike} {contractData.option_type.toUpperCase()}
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatExpiration(contractData.expiration)}
            </span>
            {contractExpired ? (
              <span className="text-sm px-2 py-0.5 rounded-full bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900 font-semibold">
                EXPIRED
              </span>
            ) : (
              <span className={`text-sm px-2 py-0.5 rounded-full ${
                dte <= 7 
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                  : dte <= 30 
                  ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                {dte} DTE
              </span>
            )}
            {isITM && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isCall 
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                ITM
              </span>
            )}
            {position && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                {position.quantity}x {position.position_type}
              </span>
            )}
          </div>
        </div>

        {/* Price Section */}
        <div className={`${premiumBg} border ${premiumBorder} rounded-xl p-4`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isScrubbing ? 'Historical Price' : 'Mark Price'}
              </p>
              <div className={`text-3xl font-bold ${
                isScrubbing && scrubChange 
                  ? (scrubChange.percentChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')
                  : premiumColor
              }`}>
                {isScrubbing && scrubPrice !== null ? (
                  <AnimatedPrice 
                    value={scrubPrice} 
                    prefix="$" 
                    duration={150}
                  />
                ) : (
                  <>${contractData.mark.toFixed(2)}</>
                )}
              </div>
              {isScrubbing && scrubChange ? (
                <div className={`text-sm flex items-center gap-1 ${
                  scrubChange.percentChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {scrubChange.percentChange >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>
                    {scrubChange.percentChange >= 0 ? '+' : ''}{scrubChange.valueChange.toFixed(2)} ({scrubChange.percentChange >= 0 ? '+' : ''}{scrubChange.percentChange.toFixed(1)}%)
                  </span>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  = ${(contractData.mark * 100).toFixed(0)} per contract
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Underlying</p>
              <button 
                onClick={() => router.push(`/stock/${encodeURIComponent(contractData.underlying_symbol)}`)}
                className="text-xl font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                ${contractData.underlying_price.toFixed(2)}
              </button>
              <p className="text-sm text-gray-500">{contractData.underlying_symbol}</p>
            </div>
          </div>

          {/* Bid/Ask Spread */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Bid</p>
              <p className="font-mono font-semibold text-gray-900 dark:text-white">${contractData.bid.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Spread</p>
              <p className="font-mono font-semibold text-gray-900 dark:text-white">
                ${(contractData.ask - contractData.bid).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Ask</p>
              <p className="font-mono font-semibold text-gray-900 dark:text-white">${contractData.ask.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Price Chart */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Price History
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {(['1D', '1W', '1M', '1Y'] as PeriodType[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                      selectedPeriod === period
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
              {/* Chart mode toggle */}
              <button
                onClick={() => setChartMode(chartMode === 'line' ? 'candle' : 'line')}
                className={`p-1.5 rounded transition-colors ${
                  chartMode === 'candle'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                title={chartMode === 'line' ? 'Switch to candlestick' : 'Switch to line chart'}
              >
                {chartMode === 'line' ? <BarChart2 className="w-4 h-4" /> : <LineChart className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {renderPriceChart()}
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <Activity className="w-4 h-4" />
              Volume
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {contractData.volume.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <BarChart3 className="w-4 h-4" />
              Open Interest
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {contractData.open_interest.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <Activity className="w-4 h-4" />
              Implied Volatility
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {contractData.implied_volatility.toFixed(1)}%
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              Last Price
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              ${contractData.last.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Greeks Section (if available) */}
        {(contractData.delta !== undefined || contractData.gamma !== undefined || 
          contractData.theta !== undefined || contractData.vega !== undefined) && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              The Greeks
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {contractData.delta !== undefined && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Delta (Δ)</p>
                  <p className="font-mono font-semibold text-gray-900 dark:text-white">
                    {contractData.delta.toFixed(3)}
                  </p>
                </div>
              )}
              {contractData.gamma !== undefined && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Gamma (Γ)</p>
                  <p className="font-mono font-semibold text-gray-900 dark:text-white">
                    {contractData.gamma.toFixed(4)}
                  </p>
                </div>
              )}
              {contractData.theta !== undefined && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Theta (Θ)</p>
                  <p className="font-mono font-semibold text-gray-900 dark:text-white">
                    {contractData.theta.toFixed(3)}
                  </p>
                </div>
              )}
              {contractData.vega !== undefined && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Vega (ν)</p>
                  <p className="font-mono font-semibold text-gray-900 dark:text-white">
                    {contractData.vega.toFixed(3)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contract Details */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Contract Details
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Contract Symbol</span>
              <span className="font-mono text-gray-900 dark:text-white text-xs truncate max-w-[200px]">
                {contractData.contract_symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Underlying</span>
              <span className="text-gray-900 dark:text-white">{contractData.underlying_symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Type</span>
              <span className={isCall ? 'text-green-600' : 'text-red-600'}>
                {contractData.option_type.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Strike Price</span>
              <span className="text-gray-900 dark:text-white">${contractData.strike.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Expiration</span>
              <span className="text-gray-900 dark:text-white">{formatExpiration(contractData.expiration)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Contract Size</span>
              <span className="text-gray-900 dark:text-white">100 shares</span>
            </div>
          </div>
        </div>

        {/* Trade Button - Fixed at bottom when paper trading is enabled */}
        {isEnabled && (
          <div className="fixed bottom-20 left-0 right-0 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-700">
            <div className="max-w-4xl mx-auto">
              {contractExpired ? (
                // Expired contract - show close button if user has position, or disabled message
                position ? (
                  <button
                    onClick={closeExpiredPosition}
                    disabled={isClosingExpired}
                    className="w-full py-4 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors bg-gray-700 hover:bg-gray-800 text-white disabled:opacity-50"
                  >
                    {isClosingExpired ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Clock className="w-5 h-5" />
                        Close Expired Position
                      </>
                    )}
                  </button>
                ) : (
                  <div className="w-full py-4 text-center text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-xl">
                    <Clock className="w-5 h-5 inline mr-2" />
                    Contract Expired - Cannot Trade
                  </div>
                )
              ) : (
                <button
                  onClick={() => {
                    setShowTradeModal(true);
                    setTradeAction(position ? 'sell_to_close' : 'buy_to_open');
                  }}
                  className={`w-full py-4 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors ${
                    isCall
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {isCall ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  {position ? 'Trade Position' : 'Open Position'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Trade Modal */}
      {showTradeModal && contractData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Trade Option
            </h3>

            {/* Contract Info */}
            <div className={`p-4 rounded-lg mb-4 ${premiumBg} border ${premiumBorder}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg">
                  {contractData.underlying_symbol} ${contractData.strike} {contractData.option_type.toUpperCase()}
                </span>
                <span className={`text-sm font-medium ${premiumColor}`}>
                  {formatExpiration(contractData.expiration)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Mark Price</span>
                <span className="font-mono font-semibold">${contractData.mark.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Bid / Ask</span>
                <span className="font-mono">${contractData.bid.toFixed(2)} / ${contractData.ask.toFixed(2)}</span>
              </div>
            </div>

            {/* Trade Action */}
            <div className="space-y-2 mb-4">
              <label className="text-sm text-gray-500 dark:text-gray-400">Action</label>
              <div className="grid grid-cols-2 gap-2">
                {(['buy_to_open', 'sell_to_open', 'buy_to_close', 'sell_to_close'] as const).map((action) => (
                  <button
                    key={action}
                    onClick={() => setTradeAction(action)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      tradeAction === action
                        ? action.startsWith('buy')
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Per Contract */}
            <div className="space-y-2 mb-4">
              <label className="text-sm text-gray-500 dark:text-gray-400">Price Per Contract</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder={(contractData.mark || contractData.last || contractData.ask).toFixed(2)}
                  className="w-full h-12 pl-8 pr-4 font-mono text-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-400">
                Leave blank to use market price (${(contractData.mark || contractData.last || contractData.ask).toFixed(2)})
              </p>
            </div>

            {/* Quantity */}
            <div className="space-y-2 mb-4">
              <label className="text-sm text-gray-500 dark:text-gray-400">Contracts</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 h-10 text-center font-mono text-lg font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  +
                </button>
              </div>
            </div>

            {/* Cost/Credit Summary */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 dark:text-gray-400">
                  {calculateTradeCost() >= 0 ? 'Total Cost' : 'Total Credit'}
                </span>
                <span className={`font-mono font-bold text-lg ${
                  calculateTradeCost() >= 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  ${Math.abs(calculateTradeCost()).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Available Balance</span>
                <span className="font-mono">${account ? parseFloat(account.balance).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTradeModal(false);
                  setQuantity(1);
                  setCustomPrice('');
                }}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeOptionTrade}
                disabled={isTrading || (calculateTradeCost() > 0 && !!account && calculateTradeCost() > parseFloat(account.balance))}
                className={`flex-1 py-3 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors ${
                  tradeAction.startsWith('buy')
                    ? 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300'
                    : 'bg-red-500 hover:bg-red-600 text-white disabled:bg-gray-300'
                }`}
              >
                {isTrading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {tradeAction.startsWith('buy') ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    Confirm Trade
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
