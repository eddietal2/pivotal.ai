"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, ChevronRight, Star, TrendingUp, Trash2 } from 'lucide-react';

interface Favorite {
  symbol: string;
  name: string;
}

interface LiveScreenProps {
  favorites: Favorite[];
  onLongPress?: (symbol: string, name: string, position: { x: number; y: number }) => void;
  onDoubleTap?: (symbol: string, name: string) => void;
  isInWatchlist?: (symbol: string) => boolean;
  onSwipeRemove?: (symbol: string, name: string) => void;
  enableSwipe?: boolean;
}

export default function LiveScreen({ favorites, onLongPress, onDoubleTap, isInWatchlist, onSwipeRemove, enableSwipe = false }: LiveScreenProps) {
  const router = useRouter();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '1d'>('5m');
  
  // Placeholder for MACD histogram animation data
  const [macdHistory, setMacdHistory] = useState<Record<string, number[]>>({});

  // Long-press detection refs
  const longPressRefs = useRef<Record<string, NodeJS.Timeout | null>>({});
  const pressStartPosRefs = useRef<Record<string, { x: number; y: number } | null>>({});
  const [pressedSymbol, setPressedSymbol] = useState<string | null>(null);
  
  // Double-tap detection refs
  const lastTapRefs = useRef<Record<string, number>>({});
  const tapTimeoutRefs = useRef<Record<string, NodeJS.Timeout | null>>({});

  // Swipe-to-remove state
  const [swipeX, setSwipeX] = useState<Record<string, number>>({});
  const [swipingSymbol, setSwipingSymbol] = useState<string | null>(null);
  const [showRemoveButton, setShowRemoveButton] = useState<Record<string, boolean>>({});
  const swipeStartRef = useRef<{ x: number; y: number; time: number; symbol: string } | null>(null);
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const SWIPE_THRESHOLD = 80;
  const REMOVE_BUTTON_WIDTH = 80;

  // Reset swipe when clicking outside
  useEffect(() => {
    const symbolsWithRemoveButton = Object.keys(showRemoveButton).filter(s => showRemoveButton[s]);
    if (symbolsWithRemoveButton.length === 0) return;
    
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const clickedSymbol = symbolsWithRemoveButton.find(symbol => 
        containerRefs.current[symbol]?.contains(e.target as Node)
      );
      
      if (!clickedSymbol) {
        setSwipeX({});
        setShowRemoveButton({});
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
  const handleTouchStart = useCallback((e: React.TouchEvent, symbol: string) => {
    if (!enableSwipe) return;
    
    const touch = e.touches[0];
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now(), symbol };
    setSwipingSymbol(null);
  }, [enableSwipe]);

  const handleTouchMove = useCallback((e: React.TouchEvent, symbol: string) => {
    if (!enableSwipe || !swipeStartRef.current || swipeStartRef.current.symbol !== symbol) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeStartRef.current.x;
    const deltaY = touch.clientY - swipeStartRef.current.y;
    
    // Only allow left swipe, and only if horizontal movement is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setSwipingSymbol(symbol);
      
      // Cancel long-press when swiping
      if (longPressRefs.current[symbol]) {
        clearTimeout(longPressRefs.current[symbol]!);
        longPressRefs.current[symbol] = null;
        setPressedSymbol(null);
      }
      
      // Calculate swipe position (only allow left swipe, capped at remove button width)
      const currentlyShown = showRemoveButton[symbol];
      const newSwipeX = currentlyShown 
        ? Math.max(-REMOVE_BUTTON_WIDTH, Math.min(0, deltaX - REMOVE_BUTTON_WIDTH))
        : Math.max(-REMOVE_BUTTON_WIDTH, Math.min(0, deltaX));
      
      setSwipeX(prev => ({ ...prev, [symbol]: newSwipeX }));
    }
  }, [enableSwipe, showRemoveButton]);

  const handleTouchEnd = useCallback((symbol: string) => {
    if (!enableSwipe || !swipeStartRef.current || swipeStartRef.current.symbol !== symbol) return;
    
    const currentSwipeX = swipeX[symbol] || 0;
    const swipedPastThreshold = Math.abs(currentSwipeX) >= SWIPE_THRESHOLD;
    
    if (swipedPastThreshold) {
      // Snap to reveal remove button
      setSwipeX(prev => ({ ...prev, [symbol]: -REMOVE_BUTTON_WIDTH }));
      setShowRemoveButton(prev => ({ ...prev, [symbol]: true }));
    } else {
      // Snap back
      setSwipeX(prev => ({ ...prev, [symbol]: 0 }));
      setShowRemoveButton(prev => ({ ...prev, [symbol]: false }));
    }
    
    swipeStartRef.current = null;
    setSwipingSymbol(null);
  }, [enableSwipe, swipeX]);

  const handleRemoveClick = useCallback((e: React.MouseEvent | React.TouchEvent, symbol: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // Reset swipe state
    setSwipeX(prev => ({ ...prev, [symbol]: 0 }));
    setShowRemoveButton(prev => ({ ...prev, [symbol]: false }));
    
    // Call remove handler
    onSwipeRemove?.(symbol, name);
  }, [onSwipeRemove]);

  // Initialize with demo data for each favorite
  useEffect(() => {
    const history: Record<string, number[]> = {};
    favorites.forEach(fav => {
      history[fav.symbol] = Array.from({ length: 20 }, () => (Math.random() - 0.5) * 0.3);
    });
    setMacdHistory(history);
  }, [favorites]);

  const handlePointerDown = useCallback((e: React.PointerEvent, symbol: string, name: string) => {
    if (!onLongPress) return;
    
    setPressedSymbol(symbol);
    pressStartPosRefs.current[symbol] = { x: e.clientX, y: e.clientY };
    
    longPressRefs.current[symbol] = setTimeout(() => {
      if (pressStartPosRefs.current[symbol]) {
        // Haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        onLongPress(symbol, name, pressStartPosRefs.current[symbol]!);
      }
      setPressedSymbol(null);
    }, 500);
  }, [onLongPress]);

  const handlePointerUp = useCallback((symbol: string) => {
    if (longPressRefs.current[symbol]) {
      clearTimeout(longPressRefs.current[symbol]!);
      longPressRefs.current[symbol] = null;
    }
    setPressedSymbol(null);
  }, []);

  const handlePointerLeave = useCallback((symbol: string) => {
    if (longPressRefs.current[symbol]) {
      clearTimeout(longPressRefs.current[symbol]!);
      longPressRefs.current[symbol] = null;
    }
    setPressedSymbol(null);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent, symbol: string) => {
    // Cancel long-press if moved more than 10px
    if (pressStartPosRefs.current[symbol] && longPressRefs.current[symbol]) {
      const dx = Math.abs(e.clientX - pressStartPosRefs.current[symbol]!.x);
      const dy = Math.abs(e.clientY - pressStartPosRefs.current[symbol]!.y);
      if (dx > 10 || dy > 10) {
        clearTimeout(longPressRefs.current[symbol]!);
        longPressRefs.current[symbol] = null;
        setPressedSymbol(null);
      }
    }
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, symbol: string, name: string) => {
    if (!onLongPress) return;
    e.preventDefault();
    onLongPress(symbol, name, { x: e.clientX, y: e.clientY });
  }, [onLongPress]);

  const handleClick = useCallback((e: React.MouseEvent, symbol: string, name: string) => {
    const now = Date.now();
    const timeSinceLastTap = now - (lastTapRefs.current[symbol] || 0);
    
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0 && onDoubleTap) {
      // Double-tap detected
      e.preventDefault();
      e.stopPropagation();
      if (tapTimeoutRefs.current[symbol]) {
        clearTimeout(tapTimeoutRefs.current[symbol]!);
        tapTimeoutRefs.current[symbol] = null;
      }
      onDoubleTap(symbol, name);
      lastTapRefs.current[symbol] = 0;
    } else {
      // Single tap - wait to see if it's a double tap
      lastTapRefs.current[symbol] = now;
      tapTimeoutRefs.current[symbol] = setTimeout(() => {
        router.push(`/watchlist/live-screen/${encodeURIComponent(symbol)}`);
        lastTapRefs.current[symbol] = 0;
      }, 300);
    }
  }, [onDoubleTap, router]);

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

      {/* Hint for gestures */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
        Long-press for options • Double-tap to remove{enableSwipe ? ' • Swipe left to delete' : ''}
      </p>

      {/* List of favorited stocks with indicators */}
      {favorites.map((fav) => {
        const history = macdHistory[fav.symbol] || [];
        const inWatchlist = isInWatchlist?.(fav.symbol) ?? false;
        const currentSwipeX = swipeX[fav.symbol] || 0;
        const isSwiping = swipingSymbol === fav.symbol;
        
        return (
          <div
            key={fav.symbol}
            ref={(el) => { containerRefs.current[fav.symbol] = el; }}
            className="relative overflow-hidden rounded-xl"
          >
            {/* Remove button (revealed on swipe) - only show when swiping or revealed */}
            {enableSwipe && (currentSwipeX < 0 || showRemoveButton[fav.symbol]) && (
              <button
                type="button"
                onClick={(e) => handleRemoveClick(e, fav.symbol, fav.name)}
                className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
                style={{ zIndex: 5 }}
                aria-label={`Remove ${fav.symbol} from My Screens`}
              >
                <Trash2 className="w-5 h-5 text-white" />
              </button>
            )}
            
            {/* Main content (slides on swipe) */}
            <button
              onClick={(e) => handleClick(e, fav.symbol, fav.name)}
              onPointerDown={(e) => handlePointerDown(e, fav.symbol, fav.name)}
              onPointerUp={() => handlePointerUp(fav.symbol)}
              onPointerLeave={() => handlePointerLeave(fav.symbol)}
              onPointerMove={(e) => handlePointerMove(e, fav.symbol)}
              onContextMenu={(e) => handleContextMenu(e, fav.symbol, fav.name)}
              onTouchStart={(e) => handleTouchStart(e, fav.symbol)}
              onTouchMove={(e) => handleTouchMove(e, fav.symbol)}
              onTouchEnd={() => handleTouchEnd(fav.symbol)}
              style={{
                transform: `translateX(${currentSwipeX}px)`,
                transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
              }}
              className={`w-full bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all text-left relative ${
                pressedSymbol === fav.symbol ? 'scale-[0.98] opacity-90' : ''
              }`}
              style={{
                transform: `translateX(${currentSwipeX}px)`,
                transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
                zIndex: 10,
              }}
            >
              <div className="flex items-center justify-between px-4 py-3 gap-3">
                {/* Left: Icon + Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative flex-shrink-0">
                    <Activity className="w-4 h-4 text-purple-400" />
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  </div>
                  <div className="flex flex-col items-start min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-gray-900 dark:text-white text-sm">{fav.symbol}</span>
                      {/* Status indicators */}
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {inWatchlist && (
                          <span title="In Watchlist">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          </span>
                        )}
                        <span title="In My Screens">
                          <TrendingUp className="w-3 h-3 text-purple-500" />
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px] sm:max-w-none">{fav.name}</span>
                  </div>
                </div>
                
                {/* Right: Mini MACD preview + Chevron */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="h-6 w-12 sm:w-16 flex items-end justify-between gap-px">
                    {history.slice(-10).map((value, index) => (
                      <div
                        key={index}
                        className={`flex-1 rounded-t-sm ${value >= 0 ? 'bg-green-500/60' : 'bg-red-500/60'}`}
                        style={{ height: `${Math.abs(value) * 100}%` }}
                      />
                    ))}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
