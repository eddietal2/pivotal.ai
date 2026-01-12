"use client";

import React, { useRef, useState, useCallback, useEffect } from 'react';
import Sparkline from '@/components/ui/Sparkline';
import { ArrowUpRight, ArrowDownRight, Star, TrendingUp, Trash2, GripVertical } from 'lucide-react';
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
  // Drag-to-reorder
  enableDrag?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  dragIndex?: number; // Index for touch drag detection
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOver?: () => void;
  onDrop?: () => void;
  onTouchDrag?: (touchY: number) => void; // Reports touch Y position during drag
};

export default function WatchListItem({ name, symbol, price, change = 0, valueChange, sparkline = [], timeframe, afterHours, rv, onClick, onLongPress, onDoubleTap, showQuickActions = false, isInWatchlist = false, isInSwingScreens = false, onSwipeRemove, enableSwipe = false, enableDrag = false, isDragging = false, isDragOver = false, dragIndex, onDragStart, onDragEnd, onDragOver, onDrop, onTouchDrag }: Props) {
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

  // Touch drag state
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const touchDragStartRef = useRef<{ x: number; y: number; scrollY: number } | null>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const dragActiveRef = useRef(false);

  // Handle drag via pointer events on the handle
  const handleDragPointerDown = useCallback((e: React.PointerEvent) => {
    console.log('[DRAG] handleDragPointerDown called!', e.pointerType);
    if (!enableDrag || dragActiveRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    dragActiveRef.current = true;
    touchDragStartRef.current = { x: e.clientX, y: e.clientY, scrollY: window.scrollY };
    setIsTouchDragging(true);
    console.log('[DRAG] calling onDragStart, exists:', !!onDragStart);
    try {
      onDragStart?.();
      console.log('[DRAG] onDragStart completed');
    } catch (err) {
      console.error('[DRAG] onDragStart error:', err);
    }
    
    const handleMove = (ev: PointerEvent) => {
      if (!dragActiveRef.current) return;
      ev.preventDefault();
      console.log('[DRAG] move Y:', ev.clientY);
      onTouchDrag?.(ev.clientY);
    };
    
    const handleUp = () => {
      console.log('[DRAG] pointerup/cancel, calling onDragEnd, exists:', !!onDragEnd);
      dragActiveRef.current = false;
      setIsTouchDragging(false);
      try {
        onDragEnd?.();
        console.log('[DRAG] onDragEnd completed');
      } catch (err) {
        console.error('[DRAG] onDragEnd error:', err);
      }
      touchDragStartRef.current = null;
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
      document.removeEventListener('pointercancel', handleUp);
    };
    
    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
    document.addEventListener('pointercancel', handleUp);
  }, [enableDrag, onDragStart, onDragEnd, onTouchDrag]);

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

  // Prevent page scroll during drag - use CSS only approach to avoid passive listener issues
  useEffect(() => {
    if (!isTouchDragging) return;
    
    // Lock body scroll using CSS
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;
    const scrollY = window.scrollY;
    
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isTouchDragging]);



  // Touch handlers for swipe (drag is handled separately on the drag handle)
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
  }, [enableSwipe, enableDrag, swipeX, isTouchDragging, onDragEnd]);

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
    
    // Long press starts drag mode (if drag is enabled)
    longPressRef.current = setTimeout(() => {
      if (enableDrag && pressStartPosRef.current) {
        // Haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        setIsTouchDragging(true);
        onDragStart?.();
      }
      setIsPressed(false);
    }, 500);
  }, [showQuickActions, enableDrag, onDragStart]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    // End drag if we were dragging
    if (isTouchDragging) {
      setIsTouchDragging(false);
      onDragEnd?.();
    }
    setIsPressed(false);
  }, [isTouchDragging, onDragEnd]);

  const handlePointerLeave = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    // End drag if we were dragging
    if (isTouchDragging) {
      setIsTouchDragging(false);
      onDragEnd?.();
    }
    setIsPressed(false);
  }, [isTouchDragging, onDragEnd]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // If dragging, report position
    if (isTouchDragging) {
      onTouchDrag?.(e.clientY);
      return;
    }
    
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
  }, [isTouchDragging, onTouchDrag]);

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
      // Double-tap detected - show QuickMenu
      e.preventDefault();
      e.stopPropagation();
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      // Show menu at tap position
      if (onLongPress) {
        onLongPress({ x: e.clientX, y: e.clientY });
      }
      lastTapRef.current = 0;
    } else {
      // Single tap - wait to see if it's a double tap
      lastTapRef.current = now;
      tapTimeoutRef.current = setTimeout(() => {
        onClick?.();
        lastTapRef.current = 0;
      }, 300);
    }
  }, [showQuickActions, onClick, onLongPress]);

  // Drag start handler for the whole item
  const handleItemDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', symbol);
    onDragStart?.();
  }, [symbol, onDragStart]);

  return (
    <div 
      ref={containerRef}
      data-drag-index={enableDrag ? dragIndex : undefined}
      draggable={enableDrag}
      className={`relative overflow-hidden rounded-xl transition-all duration-200 ${
        isDragging || isTouchDragging ? 'opacity-50 scale-95 z-50' : ''
      } ${
        isDragOver ? 'ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-gray-900' : ''
      } ${enableDrag ? 'cursor-grab active:cursor-grabbing' : ''}`}
      onDragStart={enableDrag ? handleItemDragStart : undefined}
      onDragEnd={enableDrag ? () => onDragEnd?.() : undefined}
      onDragEnter={(e) => {
        if (enableDrag) {
          e.preventDefault();
          onDragOver?.();
        }
      }}
      onDragOver={(e) => {
        if (enableDrag) {
          e.preventDefault();
        }
      }}
      onDrop={(e) => {
        if (enableDrag) {
          e.preventDefault();
          onDrop?.();
        }
      }}
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
      <div
        className={`flex items-stretch bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-lg border border-gray-200 dark:border-gray-700 transition duration-200 w-full h-24 ${isPressed ? 'scale-[0.98] opacity-90' : ''} relative z-20`}
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {/* Drag handle - touch here and drag to reorder (mobile) */}
        {enableDrag && (
          <div
            ref={dragHandleRef}
            draggable={false}
            className={`flex items-center justify-center w-10 flex-shrink-0 bg-gray-100 dark:bg-gray-700/70 rounded-l-xl border-r border-gray-200 dark:border-gray-700 select-none cursor-grab active:cursor-grabbing ${isTouchDragging ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}
            style={{ touchAction: 'none' }}
            onDragStart={(e) => e.preventDefault()}
            onPointerDown={handleDragPointerDown}
          >
            <GripVertical className="w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        )}
        
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
          className={`flex-1 p-2 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 item-press ${enableDrag ? 'rounded-r-xl' : 'rounded-xl'}`}
          aria-label={`More info about ${name} (${symbol})${timeframe ? ', timeframe ' + timeframe : ''}${afterHours ? ', after hours' : ''}${showQuickActions ? '. Double-tap for quick actions menu.' : ''}${enableSwipe ? ' Swipe left to remove.' : ''}${enableDrag ? ' Long-press and drag to reorder.' : ''}`}
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
    </div>
  );
}
