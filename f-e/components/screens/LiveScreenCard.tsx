"use client";

import React, { useState } from 'react';
import { ChevronDown, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
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
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1D' | '1W' | '1M' | '3M'>('1D');
  const categoryStyle = categoryConfig[screen.category];
  const timeUntilRefresh = getTimeUntilRefresh(screen.expiresAt);
  
  const timeframeOptions = [
    { value: '1D' as const, label: '1D' },
    { value: '1W' as const, label: '1W' },
    { value: '1M' as const, label: '1M' },
    { value: '3M' as const, label: '3M' },
  ];

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
        className="w-full p-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
      >
        {/* Top row: Icon, Title, Chevron */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {/* Icon with gradient background */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${categoryStyle.bgColor} ${categoryStyle.borderColor} border`}>
              {screen.icon}
            </div>
            
            <div className="flex flex-col items-start min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900 dark:text-white text-left">
                  {screen.title}
                </span>
                {/* Category Badge */}
                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full whitespace-nowrap ${categoryStyle.bgColor} ${categoryStyle.color} ${categoryStyle.borderColor} border`}>
                  {categoryStyle.label}
                </span>
              </div>
            </div>
          </div>

          {/* Chevron */}
          <div className={`flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700/50 transition-all duration-300 flex-shrink-0 ml-2 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
        </div>

        {/* Bottom row: Description and metadata */}
        <div className="flex items-center justify-between pl-[52px]">
          <span className={`text-xs text-gray-500 dark:text-gray-400 text-left flex-1 mr-3 ${isExpanded ? '' : 'line-clamp-1'}`}>
            {screen.description}
          </span>
          
          <div className="flex items-center gap-2 flex-shrink-0 text-xs text-gray-400 dark:text-gray-500">
            <span>{screen.stocks.length} stocks</span>
            {screen.refreshInterval && (
              <>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <div className="flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  <span className="hidden sm:inline">{timeUntilRefresh}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </button>

      {/* Expanded Content - Vertical List */}
      <div className={`overflow-hidden transition-all duration-300 ease-out ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4">
          {/* Timeframe Filter */}
          <div className="flex items-center gap-1 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700/50">
            {timeframeOptions.map((tf) => (
              <button
                key={tf.value}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTimeframe(tf.value);
                }}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200
                  ${selectedTimeframe === tf.value
                    ? `${categoryStyle.bgColor} ${categoryStyle.color} ${categoryStyle.borderColor} border`
                    : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 border border-transparent hover:bg-gray-200 dark:hover:bg-gray-600/50'
                  }
                `}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Vertical Stock List */}
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
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
                    flex items-center gap-3 py-3 cursor-pointer transition-all duration-200
                    ${isAdded 
                      ? 'bg-green-50 dark:bg-green-900/20 -mx-4 px-4' 
                      : isInList
                        ? 'bg-blue-50/30 dark:bg-blue-900/10 -mx-4 px-4'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/30 -mx-4 px-4'
                    }
                  `}
                >
                  {/* Rank Badge */}
                  <div className="w-6 flex-shrink-0 flex justify-center">
                    {stock.rank && stock.rank <= 3 ? (
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        stock.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                        stock.rank === 2 ? 'bg-gray-300 text-gray-700' :
                        'bg-amber-600 text-amber-100'
                      }`}>
                        {stock.rank}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                        {stock.rank || index + 1}
                      </span>
                    )}
                  </div>

                  {/* Stock Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">
                        {stock.symbol}
                      </span>
                      {stock.score && (
                        <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded ${
                          stock.score >= 85 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          stock.score >= 70 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                          'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400'
                        }`}>
                          {stock.score}
                        </span>
                      )}
                      {isInList && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="In watchlist" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {stock.name}
                    </p>
                  </div>

                  {/* Sparkline */}
                  <div className="w-16 h-8 flex-shrink-0">
                    <Sparkline
                      data={stock.sparkline}
                      width={64}
                      height={32}
                      stroke={isPositive ? '#22c55e' : '#ef4444'}
                      strokeWidth={1.5}
                    />
                  </div>

                  {/* Price & Change */}
                  <div className="text-right flex-shrink-0 w-20">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white block">
                      ${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <div className={`flex items-center justify-end gap-0.5 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span className="text-xs font-medium">
                        {isPositive ? '+' : ''}{stock.change.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
