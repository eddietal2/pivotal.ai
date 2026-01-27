"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

// Types for indicator data (matches LiveScreen.tsx)
export interface StockIndicatorData {
  closes: number[];
  timestamps?: string[];
  rsi?: {
    current: number;
    status: 'overbought' | 'oversold' | 'neutral';
  };
  macdHistogram?: number[];
  trend?: 'bullish' | 'bearish' | 'neutral';
  isLoading: boolean;
  error?: string;
}

export interface MyScreensMarketData {
  [symbol: string]: StockIndicatorData;
}

interface UseMyScreensDataOptions {
  isActive: boolean;
  symbols: string[]; // Symbols from FavoritesContext
  period?: string; // Default '1D'
  interval?: string; // Default '15m'
  pollingInterval?: number; // ms, default 60000 (1 minute)
}

interface UseMyScreensDataReturn {
  data: MyScreensMarketData;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  retryCount: number;
  backendReady: boolean;
  refresh: () => void;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

/**
 * Hook for fetching indicator data for My Screens favorites (Tab 3).
 * Features:
 * - Lazy loading: Only fetches when tab is active and has symbols
 * - Caching: Data persists when tab is inactive (not re-fetched)
 * - Tab-aware polling: Polling pauses when tab is inactive
 * - Auto-retry with exponential backoff on failure
 * - Fetches technical indicators (RSI, MACD, trend) for each symbol
 */
export function useMyScreensData({
  isActive,
  symbols,
  period = '1D',
  interval = '15m',
  pollingInterval = 60000, // 1 minute default (indicators don't change as fast)
}: UseMyScreensDataOptions): UseMyScreensDataReturn {
  // Data state
  const [data, setData] = useState<MyScreensMarketData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [backendReady, setBackendReady] = useState(true);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasFetchedRef = useRef(false);
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const previousSymbolsRef = useRef<string[]>([]);

  // Health check
  const checkBackendHealth = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/market-data/health/`, {
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  // Fetch indicators for a single symbol
  const fetchSymbolIndicators = useCallback(async (
    symbol: string,
    signal: AbortSignal
  ): Promise<StockIndicatorData> => {
    try {
      const url = `${BACKEND_URL}/api/market-data/indicators/${encodeURIComponent(symbol)}/?period=${period}&interval=${interval}&indicator=ALL`;
      const response = await fetch(url, {
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      // Determine trend from indicators
      let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (result.rsi && result.macd_histogram) {
        const lastMacd = result.macd_histogram[result.macd_histogram.length - 1] || 0;
        if (result.rsi > 50 && lastMacd > 0) {
          trend = 'bullish';
        } else if (result.rsi < 50 && lastMacd < 0) {
          trend = 'bearish';
        }
      }

      return {
        closes: result.closes || [],
        timestamps: result.timestamps || [],
        rsi: result.rsi ? {
          current: result.rsi,
          status: result.rsi >= 70 ? 'overbought' : result.rsi <= 30 ? 'oversold' : 'neutral',
        } : undefined,
        macdHistogram: result.macd_histogram || [],
        trend,
        isLoading: false,
      };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw err;
      }
      return {
        closes: [],
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch',
      };
    }
  }, [period, interval]);

  // Main fetch function
  const fetchData = useCallback(async (isInitial = false, isRetry = false) => {
    // Skip in test environment
    if (process.env.NODE_ENV === 'test') return;

    // Skip if no symbols to fetch
    if (symbols.length === 0) {
      setData({});
      setLoading(false);
      return;
    }

    // Skip if tab is inactive AND we already have data (use cached)
    // Unless symbols changed
    const symbolsChanged = JSON.stringify(symbols) !== JSON.stringify(previousSymbolsRef.current);
    if (!isActive && hasFetchedRef.current && !symbolsChanged) return;

    // Clear any pending retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (isInitial || symbolsChanged) {
      setLoading(true);
      setError(null);
      if (!isRetry) {
        retryCountRef.current = 0;
        setRetryCount(0);
      }
    }

    try {
      // Health check
      const healthy = await checkBackendHealth();
      if (!healthy) {
        setBackendReady(false);
        throw new Error('Backend server is starting up...');
      }
      setBackendReady(true);

      // Check if aborted
      if (controller.signal.aborted) return;

      // Fetch indicators for all symbols in parallel (with delay to avoid 429)
      const results: MyScreensMarketData = {};
      
      // Fetch with staggered timing to avoid rate limiting
      for (let i = 0; i < symbols.length; i++) {
        if (controller.signal.aborted) return;
        
        const symbol = symbols[i];
        
        // Add delay between requests (300ms) to avoid 429
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        results[symbol] = await fetchSymbolIndicators(symbol, controller.signal);
      }

      if (!isMountedRef.current) return;

      // Update state
      setData(results);
      setLastFetched(Date.now());
      setError(null);
      setRetryCount(0);
      retryCountRef.current = 0;
      hasFetchedRef.current = true;
      previousSymbolsRef.current = [...symbols];
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      if (err instanceof Error && err.name === 'AbortError') return;

      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch screens data';
      setError(errorMessage);

      // Retry logic with exponential backoff
      if (retryCountRef.current < 10) {
        retryCountRef.current += 1;
        setRetryCount(retryCountRef.current);
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
        retryTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            fetchData(true, true);
          }
        }, delay);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [symbols, isActive, period, interval, checkBackendHealth, fetchSymbolIndicators]);

  // Effect: Initial fetch and polling
  useEffect(() => {
    isMountedRef.current = true;

    // Clear any existing polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    // Fetch if active and has symbols
    if (isActive && symbols.length > 0) {
      // Only show loading on first fetch or if symbols changed
      const symbolsChanged = JSON.stringify(symbols) !== JSON.stringify(previousSymbolsRef.current);
      fetchData(!hasFetchedRef.current || symbolsChanged);

      // Start polling
      pollingRef.current = setInterval(() => {
        if (isMountedRef.current) {
          fetchData(false);
        }
      }, pollingInterval);
    }

    return () => {
      isMountedRef.current = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isActive, symbols, pollingInterval, fetchData]);

  // Manual refresh
  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    lastFetched,
    retryCount,
    backendReady,
    refresh,
  };
}
