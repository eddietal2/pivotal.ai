"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { RefreshCw, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { LiveScreen, LiveScreenStock, ScreenId } from '@/types/screens';
import { getTimeUntilRefresh } from '@/data/mockLiveScreens';
import LiveScreenCard from './LiveScreenCard';

interface LiveScreensContainerProps {
  onStockClick: (stock: LiveScreenStock) => void;
  onStockLongPress: (stock: LiveScreenStock, position: { x: number; y: number }) => void;
  onStockDoubleTap: (stock: LiveScreenStock) => void;
  onSaveScreen: (screen: LiveScreen) => void;
  onSaveAllStocks: (stocks: LiveScreenStock[]) => void;
  isInWatchlist: (symbol: string) => boolean;
  isFavorite: (symbol: string) => boolean;
  recentlyAdded: Set<string>;
  recentlyAddedToScreens: Set<string>;
  selectedScreenIds?: ScreenId[];
}

export default function LiveScreensContainer({
  onStockClick,
  onStockLongPress,
  onStockDoubleTap,
  onSaveScreen,
  onSaveAllStocks,
  isInWatchlist,
  isFavorite,
  recentlyAdded,
  recentlyAddedToScreens,
  selectedScreenIds,
}: LiveScreensContainerProps) {
  // Track which screens are expanded (multiple can be open)
  const [expandedScreens, setExpandedScreens] = useState<Set<string>>(new Set(['morning-movers']));
  
  // API state
  const [screens, setScreens] = useState<LiveScreen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch screens from API
  const fetchScreens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const screensParam = selectedScreenIds && selectedScreenIds.length > 0
        ? `?screens=${selectedScreenIds.join(',')}`
        : '';
      
      const response = await fetch(
        `http://127.0.0.1:8000/api/market-data/live-screens/${screensParam}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch screens: ${response.status}`);
      }
      
      const data = await response.json();
      setScreens(data.screens || []);
      
      // Auto-expand first screen if none expanded
      if (data.screens?.length > 0 && expandedScreens.size === 0) {
        setExpandedScreens(new Set([data.screens[0].id]));
      }
    } catch (err) {
      console.error('Error fetching live screens:', err);
      setError(err instanceof Error ? err.message : 'Failed to load screens');
    } finally {
      setLoading(false);
    }
  }, [selectedScreenIds]);

  // Fetch on mount and when screen selection changes
  useEffect(() => {
    fetchScreens();
  }, [fetchScreens]);

  // Calculate next global refresh time
  const nextRefresh = useMemo(() => {
    if (screens.length === 0) return null;
    const earliestExpiry = screens.reduce((min, screen) => {
      const expiry = new Date(screen.expiresAt).getTime();
      return expiry < min ? expiry : min;
    }, Infinity);
    return getTimeUntilRefresh(new Date(earliestExpiry).toISOString());
  }, [screens]);

  const toggleScreen = (screenId: string) => {
    setExpandedScreens(prev => {
      const next = new Set(prev);
      if (next.has(screenId)) {
        next.delete(screenId);
      } else {
        next.add(screenId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedScreens(new Set(screens.map(s => s.id)));
  };

  const collapseAll = () => {
    setExpandedScreens(new Set());
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Loading Live Screens...
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
          Fetching AI-curated stock data
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-dashed border-red-300 dark:border-red-700">
        <AlertCircle className="w-10 h-10 text-red-400 dark:text-red-500 mb-3" />
        <p className="text-sm text-red-600 dark:text-red-400 text-center">
          Failed to load Live Screens
        </p>
        <p className="text-xs text-red-500 dark:text-red-500 text-center mt-1 mb-3">
          {error}
        </p>
        <button
          onClick={fetchScreens}
          className="px-4 py-2 text-sm bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty state
  if (screens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
        <Zap className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          No Live Screens available
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
          Check back at market open for today&apos;s AI-curated screens
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <button
            onClick={fetchScreens}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Refresh screens"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <span>Refreshes in {nextRefresh}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Expand All
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button
            onClick={collapseAll}
            className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Screen Cards */}
      <div className="space-y-3">
        {screens.map((screen) => (
          <LiveScreenCard
            key={screen.id}
            screen={screen}
            isExpanded={expandedScreens.has(screen.id)}
            onToggle={() => toggleScreen(screen.id)}
            onStockClick={onStockClick}
            onStockLongPress={onStockLongPress}
            onStockDoubleTap={onStockDoubleTap}
            onSaveScreen={onSaveScreen}
            isInWatchlist={isInWatchlist}
            isFavorite={isFavorite}
            recentlyAdded={recentlyAdded}
            recentlyAddedToScreens={recentlyAddedToScreens}
          />
        ))}
      </div>

      {/* Summary Footer */}
      <div className="flex items-center justify-center pt-2">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {screens.length} screens • {screens.reduce((sum, s) => sum + s.stocks.length, 0)} total stocks • AI-curated daily
        </p>
      </div>
    </div>
  );
}
