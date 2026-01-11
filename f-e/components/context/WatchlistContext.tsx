'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const MAX_WATCHLIST = 10;

export interface WatchlistAsset {
  symbol: string;
  name: string;
  addedAt: string; // ISO timestamp
}

interface WatchlistContextType {
  watchlist: WatchlistAsset[];
  addToWatchlist: (asset: Omit<WatchlistAsset, 'addedAt'>) => boolean; // returns false if at limit
  removeFromWatchlist: (symbol: string) => void;
  isInWatchlist: (symbol: string) => boolean;
  isFull: () => boolean;
  toggleWatchlist: (asset: Omit<WatchlistAsset, 'addedAt'>) => boolean; // returns false if at limit when adding
  clearWatchlist: () => void;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

const WATCHLIST_STORAGE_KEY = 'my_watchlist';

export const WatchlistProvider = ({ children }: { children: React.ReactNode }) => {
  const [watchlist, setWatchlist] = useState<WatchlistAsset[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load watchlist from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (saved) {
        setWatchlist(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Error loading watchlist:', err);
    }
    setIsHydrated(true);
  }, []);

  // Persist to localStorage whenever watchlist changes
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
    } catch (err) {
      console.error('Error saving watchlist:', err);
    }
  }, [watchlist, isHydrated]);

  const addToWatchlist = useCallback((asset: Omit<WatchlistAsset, 'addedAt'>): boolean => {
    let added = false;
    setWatchlist((prev) => {
      // Don't add if already exists
      if (prev.some((a) => a.symbol === asset.symbol)) {
        return prev;
      }
      // Don't add if at limit
      if (prev.length >= MAX_WATCHLIST) {
        return prev;
      }
      added = true;
      return [
        ...prev,
        {
          ...asset,
          addedAt: new Date().toISOString(),
        },
      ];
    });
    return added;
  }, []);

  const removeFromWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => prev.filter((a) => a.symbol !== symbol));
  }, []);

  const isInWatchlist = useCallback(
    (symbol: string) => watchlist.some((a) => a.symbol === symbol),
    [watchlist]
  );

  const isFull = useCallback(
    () => watchlist.length >= MAX_WATCHLIST,
    [watchlist]
  );

  const toggleWatchlist = useCallback((asset: Omit<WatchlistAsset, 'addedAt'>): boolean => {
    let success = true;
    setWatchlist((prev) => {
      const exists = prev.some((a) => a.symbol === asset.symbol);
      if (exists) {
        return prev.filter((a) => a.symbol !== asset.symbol);
      }
      // Don't add if at limit
      if (prev.length >= MAX_WATCHLIST) {
        success = false;
        return prev;
      }
      return [
        ...prev,
        {
          ...asset,
          addedAt: new Date().toISOString(),
        },
      ];
    });
    return success;
  }, []);

  const clearWatchlist = useCallback(() => {
    setWatchlist([]);
  }, []);

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        isFull,
        toggleWatchlist,
        clearWatchlist,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};
