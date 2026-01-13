"use client";

import React, { useState } from 'react';
import { ChevronDown, Bookmark, RefreshCw } from 'lucide-react';
import { LiveScreen, LiveScreenStock, categoryConfig } from '@/types/screens';
import { getTimeUntilRefresh } from '@/data/mockLiveScreens';
import WatchListItem from '@/components/watchlist/WatchListItem';

interface LiveScreenCardProps {
  screen: LiveScreen;
  isExpanded: boolean;
  onToggle: () => void;
  onStockClick: (stock: LiveScreenStock) => void;
  onStockLongPress: (stock: LiveScreenStock, position: { x: number; y: number }) => void;
  onStockDoubleTap: (stock: LiveScreenStock) => void;
  onSaveScreen: (screen: LiveScreen) => void;
  isInWatchlist: (symbol: string) => boolean;
  isFavorite: (symbol: string) => boolean;
  recentlyAdded: Set<string>;
  recentlyAddedToScreens: Set<string>;
}

export default function LiveScreenCard({
  screen,
  isExpanded,
  onToggle,
  onStockClick,
  onStockLongPress,
  onStockDoubleTap,
  onSaveScreen,
  isInWatchlist,
  isFavorite,
  recentlyAdded,
  recentlyAddedToScreens,
}: LiveScreenCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const categoryStyle = categoryConfig[screen.category];
  const timeUntilRefresh = getTimeUntilRefresh(screen.expiresAt);

  return (
    <div 
      className="rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Icon with gradient background */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${categoryStyle.bgColor} ${categoryStyle.borderColor} border`}>
            {screen.icon}
          </div>
          
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                {screen.title}
              </span>
              {/* Category Badge */}
              <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${categoryStyle.bgColor} ${categoryStyle.color} ${categoryStyle.borderColor} border`}>
                {categoryStyle.label}
              </span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {screen.description}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Stock count */}
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {screen.stocks.length} stocks
          </span>
          
          {/* Refresh indicator */}
          {screen.refreshInterval && (
            <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <RefreshCw className="w-3 h-3" />
              <span>{timeUntilRefresh}</span>
            </div>
          )}
          
          {/* Chevron */}
          <div className={`flex items-center justify-center w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-700/50 transition-all duration-300 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      <div className={`overflow-hidden transition-all duration-300 ease-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4 space-y-2">
          {/* Save Screen Button */}
          <div className="flex items-center justify-between py-2 mb-2 border-b border-gray-100 dark:border-gray-700/50">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Double-tap stocks to add to Watchlist
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSaveScreen(screen);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5" />
              Save All to My Screens
            </button>
          </div>

          {/* Stock List */}
          {screen.stocks.map((stock, index) => (
            <div key={stock.symbol} className="relative">
              {/* Rank Badge */}
              {stock.rank && stock.rank <= 3 && (
                <div className={`absolute -left-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold z-10 ${
                  stock.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                  stock.rank === 2 ? 'bg-gray-300 text-gray-700' :
                  'bg-amber-600 text-amber-100'
                }`}>
                  {stock.rank}
                </div>
              )}
              
              <div className={`${stock.rank && stock.rank <= 3 ? 'ml-4' : ''}`}>
                <WatchListItem
                  name={stock.name}
                  symbol={stock.symbol}
                  price={stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  change={stock.change}
                  valueChange={stock.valueChange}
                  sparkline={stock.sparkline}
                  timeframe={stock.timeframe}
                  isInWatchlist={isInWatchlist(stock.symbol)}
                  isInSwingScreens={isFavorite(stock.symbol)}
                  isRecentlyAdded={recentlyAdded.has(stock.symbol)}
                  isRecentlyAddedToScreens={recentlyAddedToScreens.has(stock.symbol)}
                  showQuickActions
                  onClick={() => onStockClick(stock)}
                  onLongPress={(position) => onStockLongPress(stock, position)}
                  onDoubleTap={() => onStockDoubleTap(stock)}
                />
                
                {/* Stock Reason & Signals */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1 ml-2 mb-2">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 italic">
                    {stock.screenReason}
                  </span>
                  {stock.signals && stock.signals.slice(0, 3).map((signal) => (
                    <span 
                      key={signal}
                      className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400"
                    >
                      {signal}
                    </span>
                  ))}
                  {stock.score && (
                    <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded ${
                      stock.score >= 85 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                      stock.score >= 70 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                      'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400'
                    }`}>
                      Score: {stock.score}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
