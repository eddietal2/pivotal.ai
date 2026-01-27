"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

// Types for market data
export interface TimeframeData {
  closes: number[];
  latest: {
    close: string;
    change: number;
    value_change: number;
    is_after_hours: boolean;
  };
}

export interface WatchlistTickerData {
  timeframes?: {
    day?: TimeframeData;
    week?: TimeframeData;
    month?: TimeframeData;
    year?: TimeframeData;
  };
  // Legacy flat properties for backward compatibility
  price?: string | number;
  change?: number;
  valueChange?: number;
  sparkline?: number[];
}

export interface WatchlistMarketData {
  [symbol: string]: WatchlistTickerData;
}

interface UseWatchlistDataOptions {
  isActive: boolean;
  symbols: string[]; // Symbols from WatchlistContext
  pollingInterval?: number; // ms, default 30000 (30s)
}

interface UseWatchlistDataReturn {
  data: WatchlistMarketData;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  retryCount: number;
  backendReady: boolean;
  refresh: () => void;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

/**
 * Hook for fetching market data for My Watchlist symbols (Tab 2).
 * Features:
 * - Lazy loading: Only fetches when tab is active and has symbols
 * - Caching: Data persists when tab is inactive (not re-fetched)
 * - Tab-aware polling: Polling pauses when tab is inactive
 * - Auto-retry with exponential backoff on failure
 * - Batched fetching: Fetches all symbols in a single request
 */
export function useWatchlistData({
  isActive,
  symbols,
  pollingInterval = 30000, // 30 seconds default
}: UseWatchlistDataOptions): UseWatchlistDataReturn {
  // Data state
  const [data, setData] = useState<WatchlistMarketData>({});
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

      // Fetch market data for all symbols using the market-data endpoint
      const tickersParam = symbols.join(',');
      const response = await fetch(
        `${BACKEND_URL}/api/market-data/?tickers=${encodeURIComponent(tickersParam)}`,
        {
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!isMountedRef.current) return;

      // Update state
      setData(result);
      setLastFetched(Date.now());
      setError(null);
      setRetryCount(0);
      retryCountRef.current = 0;
      hasFetchedRef.current = true;
      previousSymbolsRef.current = [...symbols];
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      if (err instanceof Error && err.name === 'AbortError') return;

      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch watchlist data';
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
  }, [symbols, isActive, checkBackendHealth]);

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
