'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface PivyChatAsset {
  symbol: string;
  name: string;
  price: number | string;
  change: number;
  addedAt: string; // ISO timestamp
}

interface PivyChatContextType {
  // Today's chat assets
  todaysAssets: PivyChatAsset[];
  addAssetToTodaysChat: (asset: Omit<PivyChatAsset, 'addedAt'>) => void;
  removeAssetFromTodaysChat: (symbol: string) => void;
  isAssetInTodaysChat: (symbol: string) => boolean;
  clearTodaysAssets: () => void;
}

const PivyChatContext = createContext<PivyChatContextType | undefined>(undefined);

// Get today's date key for localStorage
const getTodayKey = () => {
  const today = new Date();
  return `pivy_chat_assets_${today.getFullYear()}_${today.getMonth() + 1}_${today.getDate()}`;
};

export const PivyChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [todaysAssets, setTodaysAssets] = useState<PivyChatAsset[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load assets from localStorage on mount
  useEffect(() => {
    const todayKey = getTodayKey();
    try {
      const saved = localStorage.getItem(todayKey);
      if (saved) {
        setTodaysAssets(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Error loading Pivy Chat assets:', err);
    }
    setIsHydrated(true);
  }, []);

  // Persist to localStorage whenever assets change
  useEffect(() => {
    if (!isHydrated) return;
    const todayKey = getTodayKey();
    try {
      localStorage.setItem(todayKey, JSON.stringify(todaysAssets));
    } catch (err) {
      console.error('Error saving Pivy Chat assets:', err);
    }
  }, [todaysAssets, isHydrated]);

  const addAssetToTodaysChat = useCallback((asset: Omit<PivyChatAsset, 'addedAt'>) => {
    setTodaysAssets((prev) => {
      // Don't add if already exists
      if (prev.some((a) => a.symbol === asset.symbol)) {
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
  }, []);

  const removeAssetFromTodaysChat = useCallback((symbol: string) => {
    setTodaysAssets((prev) => prev.filter((a) => a.symbol !== symbol));
  }, []);

  const isAssetInTodaysChat = useCallback(
    (symbol: string) => todaysAssets.some((a) => a.symbol === symbol),
    [todaysAssets]
  );

  const clearTodaysAssets = useCallback(() => {
    setTodaysAssets([]);
  }, []);

  return (
    <PivyChatContext.Provider
      value={{
        todaysAssets,
        addAssetToTodaysChat,
        removeAssetFromTodaysChat,
        isAssetInTodaysChat,
        clearTodaysAssets,
      }}
    >
      {children}
    </PivyChatContext.Provider>
  );
};

export const usePivyChat = () => {
  const context = useContext(PivyChatContext);
  if (!context) throw new Error('usePivyChat must be used within a PivyChatProvider');
  return context;
};
