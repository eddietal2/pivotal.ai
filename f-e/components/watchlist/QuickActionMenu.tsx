"use client";

import React, { useEffect, useRef } from 'react';
import { Star, TrendingUp, X, Check } from 'lucide-react';
import { useFavorites, MAX_FAVORITES } from '@/components/context/FavoritesContext';
import { useWatchlist, MAX_WATCHLIST } from '@/components/context/WatchlistContext';

interface QuickActionMenuProps {
  symbol: string;
  name: string;
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  onActionComplete?: (action: 'favorite' | 'watchlist', added: boolean, symbol: string) => void;
}

export default function QuickActionMenu({
  symbol,
  name,
  isOpen,
  onClose,
  position,
  onActionComplete,
}: QuickActionMenuProps) {
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const menuRef = useRef<HTMLDivElement>(null);

  const isFav = isFavorite(symbol);
  const isWatched = isInWatchlist(symbol);
  const canAddFavorite = favorites.length < MAX_FAVORITES;
  const canAddWatchlist = watchlist.length < MAX_WATCHLIST;
  // Tiered system: can only add to My Screens if already in watchlist
  const canPromoteToScreens = isWatched && canAddFavorite;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFavoriteToggle = () => {
    if (isFav) {
      removeFavorite(symbol);
      onActionComplete?.('favorite', false, symbol);
    } else if (!isWatched) {
      // Can't add to My Screens if not in watchlist - show warning via callback
      onActionComplete?.('favorite', false, symbol);
    } else if (canAddFavorite) {
      addFavorite({ symbol, name });
      onActionComplete?.('favorite', true, symbol);
    }
    onClose();
  };

  const handleWatchlistToggle = () => {
    if (isWatched) {
      removeFromWatchlist(symbol);
      onActionComplete?.('watchlist', false, symbol);
    } else if (canAddWatchlist) {
      addToWatchlist({ symbol, name });
      onActionComplete?.('watchlist', true, symbol);
    }
    onClose();
  };

  // Adjust position to keep menu on screen
  const menuWidth = 220;
  const menuHeight = 180;
  const adjustedPosition = {
    x: Math.min(Math.max(10, position.x - menuWidth / 2), (typeof window !== 'undefined' ? window.innerWidth : 400) - menuWidth - 10),
    y: Math.min(position.y, (typeof window !== 'undefined' ? window.innerHeight : 600) - menuHeight - 10),
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[200] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        minWidth: `${menuWidth}px`,
      }}
    >
      {/* Header */}
      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm text-gray-900 dark:text-white truncate max-w-[140px]">
            {symbol}
          </span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
          >
            <X className="w-3 h-3 text-gray-500" />
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{name}</p>
      </div>

      {/* Actions */}
      <div className="p-1">
        <button
          onClick={handleWatchlistToggle}
          disabled={!isWatched && !canAddWatchlist}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            !isWatched && !canAddWatchlist
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Star
            className={`w-5 h-5 ${
              isWatched
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-gray-400'
            }`}
          />
          <span className="text-sm text-gray-700 dark:text-gray-200 flex-1 text-left">
            {isWatched ? 'Remove from Watchlist' : 'Add to Watchlist'}
          </span>
          {isWatched && <Check className="w-4 h-4 text-green-500" />}
        </button>

        <button
          onClick={handleFavoriteToggle}
          disabled={!isFav && (!canAddFavorite || !isWatched)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            !isFav && (!canAddFavorite || !isWatched)
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <TrendingUp
            className={`w-5 h-5 ${
              isFav
                ? 'text-purple-500'
                : 'text-gray-400'
            }`}
          />
          <span className="text-sm text-gray-700 dark:text-gray-200 flex-1 text-left">
            {isFav ? 'Remove from My Screens' : !isWatched ? 'Add to Watchlist first' : 'Add to My Screens'}
          </span>
          {isFav && <Check className="w-4 h-4 text-green-500" />}
        </button>
      </div>

      {/* Capacity warnings */}
      {((!canAddWatchlist && !isWatched) || (!canAddFavorite && !isFav) || (!isWatched && !isFav)) && (
        <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {!canAddWatchlist && !isWatched && `Watchlist full (${MAX_WATCHLIST}/${MAX_WATCHLIST})`}
            {!canAddWatchlist && !isWatched && ((!canAddFavorite && !isFav) || (!isWatched && !isFav)) && ' • '}
            {!isWatched && !isFav && 'Add to Watchlist to enable My Screens'}
            {isWatched && !canAddFavorite && !isFav && `My Screens full (${MAX_FAVORITES}/${MAX_FAVORITES})`}
          </p>
        </div>
      )}
    </div>
  );
}
