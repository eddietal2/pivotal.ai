"use client";

import React, { useState, useEffect } from 'react';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';

interface Favorite {
  symbol: string;
  name: string;
}

interface LiveScreenProps {
  favorites: Favorite[];
}

export default function LiveScreen({ favorites }: LiveScreenProps) {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(favorites[0]?.symbol || '');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '1d'>('5m');
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(favorites[0]?.symbol || null);
  
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

  // Update selected symbol when favorites change
  useEffect(() => {
    if (favorites.length > 0 && !favorites.find(f => f.symbol === selectedSymbol)) {
      setSelectedSymbol(favorites[0].symbol);
      setExpandedSymbol(favorites[0].symbol);
    }
  }, [favorites, selectedSymbol]);

  // TODO: Connect to real technical indicators API
  // TODO: Add real-time updates via WebSocket or polling

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
        const isExpanded = expandedSymbol === fav.symbol;
        const history = macdHistory[fav.symbol] || [];
        
        return (
          <div
            key={fav.symbol}
            className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Header - always visible */}
            <button
              onClick={() => setExpandedSymbol(isExpanded ? null : fav.symbol)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
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
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                  {selectedTimeframe}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-gray-700">
                {/* MACD Histogram Placeholder */}
                <div className="space-y-2 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">MACD Histogram</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400">Coming Soon</span>
                  </div>
                  
                  {/* Animated bars placeholder */}
                  <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg p-2 flex items-end justify-between gap-0.5">
                    {history.map((value, index) => (
                      <div
                        key={index}
                        className={`flex-1 rounded-t-sm ${value >= 0 ? 'bg-green-500/50' : 'bg-red-500/50'}`}
                        style={{ height: `${Math.abs(value) * 100}%`, opacity: 0.3 + (index / history.length) * 0.7 }}
                      />
                    ))}
                  </div>
                </div>

                {/* RSI Placeholder */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">RSI (14)</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">--</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full w-1/2 bg-gray-300 dark:bg-gray-600 rounded-full" />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Oversold</span>
                    <span>Overbought</span>
                  </div>
                </div>

                {/* Signal placeholder */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Signal</span>
                  <span className="text-xs text-gray-400">--</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
