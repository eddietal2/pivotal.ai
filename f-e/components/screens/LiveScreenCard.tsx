"use client";

import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Bookmark, RefreshCw } from 'lucide-react';
import { LiveScreen, LiveScreenStock, categoryConfig } from '@/types/screens';
import { getTimeUntilRefresh } from '@/data/mockLiveScreens';
import Sparkline from '@/components/ui/Sparkline';

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
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const categoryStyle = categoryConfig[screen.category];
  const timeUntilRefresh = getTimeUntilRefresh(screen.expiresAt);

  // Check scroll position to show/hide arrows
  const checkScrollPosition = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  // Scroll slider left/right
  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = 280; // Card width + gap
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScrollPosition, 300);
    }
  };

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

      {/* Expanded Content - Horizontal Slider */}
      <div className={`overflow-hidden transition-all duration-300 ease-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4">
          {/* Save Screen Button */}
          <div className="flex items-center justify-between py-2 mb-3 border-b border-gray-100 dark:border-gray-700/50">
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

          {/* Horizontal Slider Container */}
          <div className="relative group">
            {/* Left Arrow */}
            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            )}

            {/* Right Arrow */}
            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            )}

            {/* Scrollable Stock Cards */}
            <div 
              ref={sliderRef}
              onScroll={checkScrollPosition}
              className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {screen.stocks.map((stock, index) => {
                const isPositive = stock.change >= 0;
                const isAdded = recentlyAdded.has(stock.symbol);
                const isInList = isInWatchlist(stock.symbol);
                
                return (
                  <div
                    key={stock.symbol}
                    onClick={() => onStockClick(stock)}
                    onDoubleClick={() => onStockDoubleTap(stock)}
                    className={`
                      flex-shrink-0 w-[260px] snap-start cursor-pointer
                      rounded-xl border p-3 transition-all duration-200
                      ${isAdded 
                        ? 'border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/20' 
                        : isInList
                          ? 'border-blue-300 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50'
                      }
                      hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600
                    `}
                  >
                    {/* Card Header - Symbol, Name, Rank */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {/* Rank Badge */}
                        {stock.rank && stock.rank <= 3 && (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            stock.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                            stock.rank === 2 ? 'bg-gray-300 text-gray-700' :
                            'bg-amber-600 text-amber-100'
                          }`}>
                            {stock.rank}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-sm text-gray-900 dark:text-white">
                            {stock.symbol}
                          </span>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
                            {stock.name}
                          </p>
                        </div>
                      </div>
                      
                      {/* Score Badge */}
                      {stock.score && (
                        <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded ${
                          stock.score >= 85 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          stock.score >= 70 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                          'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400'
                        }`}>
                          {stock.score}
                        </span>
                      )}
                    </div>

                    {/* Price & Change */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        ${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <div className="text-right">
                        <span className={`text-sm font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {isPositive ? '+' : ''}{stock.change.toFixed(2)}%
                        </span>
                        <p className={`text-[10px] ${isPositive ? 'text-green-500 dark:text-green-500' : 'text-red-500 dark:text-red-500'}`}>
                          {isPositive ? '+' : ''}{stock.valueChange?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>

                    {/* Sparkline */}
                    <div className="h-10 mb-2">
                      <Sparkline
                        data={stock.sparkline}
                        width={236}
                        height={40}
                        stroke={isPositive ? '#22c55e' : '#ef4444'}
                        gradient={true}
                        fillOpacity={0.15}
                      />
                    </div>

                    {/* Reason */}
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 italic mb-2 line-clamp-1">
                      {stock.screenReason}
                    </p>

                    {/* Signals */}
                    <div className="flex flex-wrap gap-1">
                      {stock.signals && stock.signals.slice(0, 3).map((signal) => (
                        <span 
                          key={signal}
                          className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400"
                        >
                          {signal}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Gradient Fade on edges */}
            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-white dark:from-gray-800/30 to-transparent pointer-events-none" />
            )}
            {canScrollRight && (
              <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white dark:from-gray-800/30 to-transparent pointer-events-none" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
