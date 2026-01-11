"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, ChevronRight } from 'lucide-react';

interface Favorite {
  symbol: string;
  name: string;
}

interface LiveScreenProps {
  favorites: Favorite[];
}

export default function LiveScreen({ favorites }: LiveScreenProps) {
  const router = useRouter();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '1d'>('5m');
  
  // Placeholder for MACD histogram animation data
  const [macdHistory, setMacdHistory] = useState<Record<string, number[]>>({});

  // Initialize with demo data for each favorite
  useEffect(() => {
    const history: Record<string, number[]> = {};
    favorites.forEach(fav => {
      history[fav.symbol] = Array.from({ length: 20 }, () => (Math.random() - 0.5) * 0.3);
    });
    setMacdHistory(history);
  }, [favorites]);

  // TODO: Connect to real technical indicators API
  // TODO: Add real-time updates via WebSocket or polling

  const handleCardClick = (symbol: string) => {
    router.push(`/watchlist/live-screen/${encodeURIComponent(symbol)}`);
  };

  return (
    <div className="space-y-3">
      {/* Timeframe selector */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">Technical Indicators</span>
        <select
          value={selectedTimeframe}
          onChange={(e) => setSelectedTimeframe(e.target.value as any)}
          className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 outline-none"
        >
          <option value="1m">1m</option>
          <option value="5m">5m</option>
          <option value="15m">15m</option>
          <option value="1h">1h</option>
          <option value="1d">1D</option>
        </select>
      </div>

      {/* List of favorited stocks with indicators */}
      {favorites.map((fav) => {
        const history = macdHistory[fav.symbol] || [];
        
        return (
          <button
            key={fav.symbol}
            onClick={() => handleCardClick(fav.symbol)}
            className="w-full bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all text-left"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-medium text-gray-900 dark:text-white text-sm">{fav.symbol}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{fav.name}</span>
                </div>
              </div>
              
              {/* Mini MACD preview */}
              <div className="flex items-center gap-3">
                <div className="h-6 w-16 flex items-end justify-between gap-px">
                  {history.slice(-10).map((value, index) => (
                    <div
                      key={index}
                      className={`flex-1 rounded-t-sm ${value >= 0 ? 'bg-green-500/60' : 'bg-red-500/60'}`}
                      style={{ height: `${Math.abs(value) * 100}%` }}
                    />
                  ))}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
