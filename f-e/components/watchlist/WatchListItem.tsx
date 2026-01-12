"use client";

import React, { useRef, useState, useCallback, useEffect } from 'react';
import Sparkline from '@/components/ui/Sparkline';
import { ArrowUpRight, ArrowDownRight, Star, TrendingUp, Trash2 } from 'lucide-react';
import { getPricePrefix, getPriceSuffix } from '@/lib/priceUtils';

type Props = {
  name: string;
  symbol: string;
  price: string;
  change?: number; // percent change
  valueChange?: number; // absolute value change
  sparkline?: number[]; // numeric array for sparkline values
  timeframe?: string;
  afterHours?: boolean;
  rv?: number; // relative volume (e.g., 1.2 for 1.2x)
  onClick?: () => void;
  // Quick action props
  onLongPress?: (position: { x: number; y: number }) => void;
  onDoubleTap?: () => void;
  showQuickActions?: boolean;
  // Status indicators
  isInWatchlist?: boolean;
  isInSwingScreens?: boolean;
  // Swipe-to-remove
  onSwipeRemove?: () => void;
  enableSwipe?: boolean;
};

export default function WatchListItem({ name, symbol, price, change = 0, valueChange, sparkline = [], timeframe, afterHours, rv, onClick, onLongPress, onDoubleTap, showQuickActions = false, isInWatchlist = false, isInSwingScreens = false, onSwipeRemove, enableSwipe = false }: Props) {
  const isDown = change < 0;
  const changeClass = isDown ? 'text-red-600' : 'text-green-600';
  const sparkStroke = isDown ? '#EF4444' : '#34d399';
  const pricePrefix = getPricePrefix(symbol);
  const priceSuffix = getPriceSuffix(symbol);

  // Long-press detection
  const longPressRef = useRef<NodeJS.Timeout | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const pressStartPosRef = useRef<{ x: number; y: number } | null>(null);
  
  // Double-tap detection
  const lastTapRef = useRef<number>(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Swipe-to-remove state
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [showRemoveButton, setShowRemoveButton] = useState(false);
  const swipeStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const SWIPE_THRESHOLD = 80; // pixels to trigger remove button reveal
  const REMOVE_BUTTON_WIDTH = 80;

  // Reset swipe when clicking outside
  useEffect(() => {
    if (!showRemoveButton) return;
    
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSwipeX(0);
        setShowRemoveButton(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showRemoveButton]);

  // Touch handlers for swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enableSwipe) return;
    
    const touch = e.touches[0];
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    setIsSwiping(false);
  }, [enableSwipe]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enableSwipe || !swipeStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeStartRef.current.x;
    const deltaY = touch.clientY - swipeStartRef.current.y;
    
    // Only allow left swipe, and only if horizontal movement is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setIsSwiping(true);
      
      // Cancel long-press when swiping
      if (longPressRef.current) {
        clearTimeout(longPressRef.current);
        longPressRef.current = null;
        setIsPressed(false);
      }
      
      // Calculate swipe position (only allow left swipe, capped at remove button width)
      const newSwipeX = showRemoveButton 
        ? Math.max(-REMOVE_BUTTON_WIDTH, Math.min(0, deltaX - REMOVE_BUTTON_WIDTH))
        : Math.max(-REMOVE_BUTTON_WIDTH, Math.min(0, deltaX));
      
      setSwipeX(newSwipeX);
    }
  }, [enableSwipe, showRemoveButton]);

  const handleTouchEnd = useCallback(() => {
    if (!enableSwipe || !swipeStartRef.current) return;
    
    const swipedPastThreshold = Math.abs(swipeX) >= SWIPE_THRESHOLD;
    
    if (swipedPastThreshold) {
      // Snap to reveal remove button
      setSwipeX(-REMOVE_BUTTON_WIDTH);
      setShowRemoveButton(true);
    } else {
      // Snap back
      setSwipeX(0);
      setShowRemoveButton(false);
    }
    
    swipeStartRef.current = null;
    setIsSwiping(false);
  }, [enableSwipe, swipeX]);

  const handleRemoveClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // Reset swipe state
    setSwipeX(0);
    setShowRemoveButton(false);
    
    // Call remove handler
    onSwipeRemove?.();
  }, [onSwipeRemove]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!showQuickActions) return;
    
    setIsPressed(true);
    pressStartPosRef.current = { x: e.clientX, y: e.clientY };
    
    longPressRef.current = setTimeout(() => {
      if (onLongPress && pressStartPosRef.current) {
        // Haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        onLongPress(pressStartPosRef.current);
      }
      setIsPressed(false);
    }, 500);
  }, [showQuickActions, onLongPress]);

  const handlePointerUp = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    setIsPressed(false);
  }, []);

  const handlePointerLeave = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    setIsPressed(false);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // Cancel long-press if moved more than 10px
    if (pressStartPosRef.current && longPressRef.current) {
      const dx = Math.abs(e.clientX - pressStartPosRef.current.x);
      const dy = Math.abs(e.clientY - pressStartPosRef.current.y);
      if (dx > 10 || dy > 10) {
        clearTimeout(longPressRef.current);
        longPressRef.current = null;
        setIsPressed(false);
      }
    }
  }, []);

  // Context menu for right-click
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!showQuickActions || !onLongPress) return;
    e.preventDefault();
    onLongPress({ x: e.clientX, y: e.clientY });
  }, [showQuickActions, onLongPress]);

  // Handle click with double-tap detection
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!showQuickActions) {
      onClick?.();
      return;
    }

    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double-tap detected
      e.preventDefault();
      e.stopPropagation();
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      onDoubleTap?.();
      lastTapRef.current = 0;
    } else {
      // Single tap - wait to see if it's a double tap
      lastTapRef.current = now;
      tapTimeoutRef.current = setTimeout(() => {
        onClick?.();
        lastTapRef.current = 0;
      }, 300);
    }
  }, [showQuickActions, onClick, onDoubleTap]);

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden rounded-xl"
    >
      {/* Remove button (revealed on swipe) */}
      {enableSwipe && (
        <button
          type="button"
          onClick={handleRemoveClick}
          className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors z-10"
          aria-label={`Remove ${symbol} from list`}
        >
          <Trash2 className="w-5 h-5 text-white" />
        </button>
      )}
      
      {/* Main content (slides on swipe) */}
      <button
        data-testid={`watchlist-item-${symbol}`}
        type="button"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerMove={handlePointerMove}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
        }}
        className={`bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm dark:shadow-lg border border-gray-200 dark:border-gray-700 transition duration-200 w-full h-24 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 item-press ${isPressed ? 'scale-[0.98] opacity-90' : ''} relative z-20`}
        aria-label={`More info about ${name} (${symbol})${timeframe ? ', timeframe ' + timeframe : ''}${afterHours ? ', after hours' : ''}${showQuickActions ? '. Long-press or right-click for quick actions. Double-tap to favorite.' : ''}${enableSwipe ? ' Swipe left to remove.' : ''}`}
      >
      <div className="item-press-inner relative">
        <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-gray-400">{name} ({symbol})</p>
          {/* Status indicators */}
          {(isInWatchlist || isInSwingScreens) && (
            <div className="flex items-center gap-0.5">
              {isInWatchlist && (
                <span title="In Watchlist">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                </span>
              )}
              {isInSwingScreens && (
                <span title="In My Screens">
                  <TrendingUp className="w-3 h-3 text-purple-500" />
                </span>
              )}
            </div>
          )}
        </div>
        {/* timeframe chip */}
        {timeframe && (
          <span title={timeframe === '24H' ? '24 hours (around the clock)' : `Last ${timeframe}`} className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-50 border border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">{timeframe}{afterHours ? <span className="ml-1 text-[10px] text-orange-300 font-bold">AH</span> : null}</span>
        )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-3">
          {/* Sparkline */}
          <div className="flex-shrink-0">
            {sparkline && sparkline.length > 0 && (
              <Sparkline data={sparkline} width={72} height={28} stroke={sparkStroke} className="rounded" gradient={true} fillOpacity={0.12} />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-md lg:text-xl font-bold text-gray-900 dark:text-white">{pricePrefix}{price}{priceSuffix}</span>
            {typeof rv === 'number' && (
              <span className="text-xs text-gray-500 dark:text-gray-400">RV: {rv.toFixed(2)}x</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className={`text-sm font-semibold ${changeClass} flex items-center`}>
            {isDown ? <ArrowDownRight className="w-4 h-4 mr-1" /> : <ArrowUpRight className="w-4 h-4 mr-1" />}
            {change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`}
          </span>
          {valueChange !== undefined && valueChange !== 0 && (
            <span className={`text-xs ${changeClass} mt-0.5`}>
              {pricePrefix}{valueChange >= 0 ? `+${valueChange.toFixed(2)}` : `${valueChange.toFixed(2)}`}{priceSuffix}
            </span>
          )}
        </div>
      </div>
    </button>
    </div>
  );
}
