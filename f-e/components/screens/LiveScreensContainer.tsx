"use client";

import React, { useState, useMemo } from 'react';
import { RefreshCw, Zap } from 'lucide-react';
import { LiveScreen, LiveScreenStock, ScreenCategory } from '@/types/screens';
import { mockLiveScreens, getTimeUntilRefresh } from '@/data/mockLiveScreens';
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
  selectedCategories?: ScreenCategory[];
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
  selectedCategories,
}: LiveScreensContainerProps) {
  // Track which screens are expanded (multiple can be open)
  const [expandedScreens, setExpandedScreens] = useState<Set<string>>(new Set(['morning-movers']));

  // Filter screens by selected categories
  const screens = useMemo(() => {
    if (!selectedCategories || selectedCategories.length === 0) {
      return mockLiveScreens;
    }
    return mockLiveScreens.filter(screen => 
      selectedCategories.includes(screen.category as ScreenCategory)
    );
  }, [selectedCategories]);

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

  if (screens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
        <Zap className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          No Live Screens available
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
          Check back at market open for today's AI-curated screens
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <RefreshCw className="w-3.5 h-3.5" />
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
