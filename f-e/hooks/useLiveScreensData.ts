"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { LiveScreen, ScreenId } from '@/types/screens';

// Re-export types for convenience
export type { LiveScreen, LiveScreenStock, ScreenId, ScreenCategory } from '@/types/screens';

// Types
interface UseLiveScreensDataOptions {
  isActive: boolean;
  selectedScreenIds?: ScreenId[];
  pollingInterval?: number; // ms, default 60000 (1 minute - screens don't change often)
}

interface UseLiveScreensDataReturn {
  data: LiveScreen[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  retryCount: number;
  backendReady: boolean;
  warmingUp: boolean; // True when backend is doing cold-start market scan (can take 1-2 min)
  refresh: () => void;
}

/**
 * Hook for fetching Live Screens data (Tab 1).
 * Features:
 * - Lazy loading: Only fetches when tab is active
 * - Caching: Data persists when tab is inactive (not re-fetched)
 * - Tab-aware polling: Polling pauses when tab is inactive
 * - Auto-retry with exponential backoff on failure
 */
export function useLiveScreensData({
  isActive,
  selectedScreenIds,
  pollingInterval = 60000, // 1 minute default (screens refresh less frequently)
}: UseLiveScreensDataOptions): UseLiveScreensDataReturn {
  // Data state
  const [data, setData] = useState<LiveScreen[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [backendReady, setBackendReady] = useState(true);
  const [warmingUp, setWarmingUp] = useState(false); // True when backend is doing cold-start scan

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasFetchedRef = useRef(false);
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const fetchInProgressRef = useRef(false);
  const fetchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Health check
  const checkBackendHealth = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}/api/market-data/health/`,
        { signal: AbortSignal.timeout(3000) }
      );
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  // Main fetch function
  const fetchData = useCallback(async (isInitial = false, isRetry = false) => {
    // Skip in test environment
    if (process.env.NODE_ENV === 'test') return;

    // Skip if tab is inactive AND we already have data (use cached)
    if (!isActive && hasFetchedRef.current) return;

    // Skip if a fetch is already in progress (unless it's a retry)
    if (fetchInProgressRef.current && !isRetry) {
      return;
    }

    // Clear any pending retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Create new abort controller (don't abort previous - let it complete or timeout naturally)
    const controller = new AbortController();
    
    // Only abort previous if it's a manual refresh or retry
    if (isRetry && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = controller;
    fetchInProgressRef.current = true;

    // Track fetch start time to detect slow cold-start loads
    const fetchStartTime = Date.now();
    let warmingUpTimeout: NodeJS.Timeout | null = null;

    if (isInitial) {
      setLoading(true);
      setWarmingUp(false);
      setError(null);
      if (!isRetry) {
        retryCountRef.current = 0;
        setRetryCount(0);
      }
      
      // If loading takes more than 5s, it's likely a cold-start market scan
      warmingUpTimeout = setTimeout(() => {
        if (isMountedRef.current && fetchInProgressRef.current) {
          setWarmingUp(true);
        }
      }, 5000);
    }

    try {
      // Health check
      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        setBackendReady(false);
        throw new Error('Backend server is not available');
      }
      setBackendReady(true);

      // Build query string for selected screens
      const screensParam = selectedScreenIds && selectedScreenIds.length > 0
        ? `?screens=${selectedScreenIds.join(',')}`
        : '';

      // Use longer timeout on initial load
      const timeoutMs = isRetry ? 30000 : 60000;

      const timeoutId = setTimeout(() => {
        if (!controller.signal.aborted) {
          controller.abort();
        }
      }, timeoutMs);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}/api/market-data/live-screens/${screensParam}`,
        { 
          signal: controller.signal,
          credentials: 'include',
        }
      );

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText || 'Request failed'}`);
      }

      const json = await res.json();

      // Clear warming up timeout
      if (warmingUpTimeout) clearTimeout(warmingUpTimeout);

      if (!isMountedRef.current) return;

      // Extract screens from response
      const screens: LiveScreen[] = json.screens || [];

      setData(screens);
      setError(null);
      setLoading(false);
      setWarmingUp(false);
      setLastFetched(Date.now());
      hasFetchedRef.current = true;
      retryCountRef.current = 0;
      setRetryCount(0);
      fetchInProgressRef.current = false;

    } catch (err) {
      // Clear warming up timeout
      if (warmingUpTimeout) clearTimeout(warmingUpTimeout);
      
      fetchInProgressRef.current = false;
      setWarmingUp(false);
      if (!isMountedRef.current) return;
      if (controller.signal.aborted && !isInitial) return;

      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch live screens';
      console.error('[useLiveScreensData] Fetch error:', errorMessage);

      // Only show error and retry on initial load or if we have no data
      if (isInitial || !hasFetchedRef.current) {
        setError(errorMessage);
        setLoading(false);

        // Exponential backoff retry (max 10 retries)
        const MAX_RETRIES = 10;
        if (retryCountRef.current < MAX_RETRIES && isActive) {
          retryCountRef.current += 1;
          setRetryCount(retryCountRef.current);

          // Exponential backoff: 2s, 4s, 8s, 16s, 32s, 64s (cap at 64s)
          const delay = Math.min(Math.pow(2, retryCountRef.current) * 1000, 64000);
          console.log(`[useLiveScreensData] Retrying in ${delay / 1000}s (attempt ${retryCountRef.current}/${MAX_RETRIES})`);

          retryTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current && isActive) {
              fetchData(true, true);
            }
          }, delay);
        }
      }
    }
  }, [isActive, selectedScreenIds, checkBackendHealth]);

  // Manual refresh function
  const refresh = useCallback(() => {
    retryCountRef.current = 0;
    setRetryCount(0);
    fetchData(true, false);
  }, [fetchData]);

  // Initial fetch when tab becomes active (lazy loading)
  useEffect(() => {
    // Small debounce to prevent React StrictMode double-invocation issues
    const timeoutId = setTimeout(() => {
      if (isActive && !hasFetchedRef.current) {
        fetchData(true);
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [isActive, fetchData]);

  // Polling when tab is active
  useEffect(() => {
    // Clear existing polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    // Only poll if active and we have data
    if (isActive && hasFetchedRef.current) {
      pollingRef.current = setInterval(() => {
        fetchData(false);
      }, pollingInterval);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isActive, pollingInterval, fetchData]);

  // Refetch when selectedScreenIds changes (but not on initial mount)
  const prevScreenIdsRef = useRef<string>((selectedScreenIds ?? []).join(','));
  useEffect(() => {
    const currentIds = (selectedScreenIds ?? []).join(',');
    if (prevScreenIdsRef.current !== currentIds) {
      prevScreenIdsRef.current = currentIds;
      if (isActive && hasFetchedRef.current) {
        fetchData(true, false);
      }
    }
  }, [selectedScreenIds, isActive, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    lastFetched,
    retryCount,
    backendReady,
    warmingUp,
    refresh,
  };
}
