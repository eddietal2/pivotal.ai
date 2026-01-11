'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const MAX_FAVORITES = 3;

export interface FavoriteAsset {
  symbol: string;
  name: string;
  addedAt: string; // ISO timestamp
}

interface FavoritesContextType {
  favorites: FavoriteAsset[];
  addFavorite: (asset: Omit<FavoriteAsset, 'addedAt'>) => boolean; // returns false if at limit
  removeFavorite: (symbol: string) => void;
  isFavorite: (symbol: string) => boolean;
  isFull: () => boolean;
  toggleFavorite: (asset: Omit<FavoriteAsset, 'addedAt'>) => boolean; // returns false if at limit when adding
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const FAVORITES_STORAGE_KEY = 'watchlist_favorites';

export const FavoritesProvider = ({ children }: { children: React.ReactNode }) => {
  const [favorites, setFavorites] = useState<FavoriteAsset[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
    setIsHydrated(true);
  }, []);

  // Persist to localStorage whenever favorites change
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (err) {
      console.error('Error saving favorites:', err);
    }
  }, [favorites, isHydrated]);

  const addFavorite = useCallback((asset: Omit<FavoriteAsset, 'addedAt'>): boolean => {
    let added = false;
    setFavorites((prev) => {
      // Don't add if already exists
      if (prev.some((a) => a.symbol === asset.symbol)) {
        return prev;
      }
      // Don't add if at limit
      if (prev.length >= MAX_FAVORITES) {
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

  const removeFavorite = useCallback((symbol: string) => {
    setFavorites((prev) => prev.filter((a) => a.symbol !== symbol));
  }, []);

  const isFavorite = useCallback(
    (symbol: string) => favorites.some((a) => a.symbol === symbol),
    [favorites]
  );

  const isFull = useCallback(
    () => favorites.length >= MAX_FAVORITES,
    [favorites]
  );

  const toggleFavorite = useCallback((asset: Omit<FavoriteAsset, 'addedAt'>): boolean => {
    let success = true;
    setFavorites((prev) => {
      const exists = prev.some((a) => a.symbol === asset.symbol);
      if (exists) {
        return prev.filter((a) => a.symbol !== asset.symbol);
      }
      // Don't add if at limit
      if (prev.length >= MAX_FAVORITES) {
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

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite,
        isFavorite,
        isFull,
        toggleFavorite,
        clearFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within a FavoritesProvider');
  return context;
};
