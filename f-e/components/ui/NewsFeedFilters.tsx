'use client';

import React from 'react';

export default function NewsFeedFilters({
  watchlists,
  selectedWatchlist,
  onWatchlistChange,
  sentiment,
  onSentimentChange,
  query,
  onQueryChange,
}: {
  watchlists: string[];
  selectedWatchlist: string;
  onWatchlistChange?: (w: string) => void;
  sentiment: 'all' | 'bullish' | 'bearish' | 'high';
  onSentimentChange?: (s: 'all'|'bullish'|'bearish'|'high') => void;
  query: string;
  onQueryChange?: (q: string) => void;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 w-full">
      <div className="flex items-center gap-3 w-full md:w-auto">
        <label className="sr-only" htmlFor="watchlist-select">Watchlist</label>
        <select
          id="watchlist-select"
          className="px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
          value={selectedWatchlist}
          onChange={(e) => onWatchlistChange && onWatchlistChange(e.target.value)}
        >
          {watchlists.map((w) => <option key={w} value={w}>{w}</option>)}
        </select>

        <div className="inline-flex items-center rounded-md bg-gray-50 border border-gray-200 p-1 dark:bg-gray-800 dark:border-gray-700">
          <button
            aria-pressed={sentiment === 'all'}
            className={`px-2 py-1 text-xs ${sentiment === 'all' ? 'bg-gray-200 dark:bg-gray-700 text-gray-900' : 'text-gray-600'}`}
            onClick={() => onSentimentChange && onSentimentChange('all')}
            aria-label="All sentiment"
          >
            All
          </button>
          <button
            aria-pressed={sentiment === 'bullish'}
            className={`px-2 py-1 text-xs ${sentiment === 'bullish' ? 'bg-green-50 text-green-800 dark:bg-green-900/30' : 'text-gray-600'}`}
            onClick={() => onSentimentChange && onSentimentChange('bullish')}
            aria-label="Bullish"
          >
            Bullish
          </button>
          <button
            aria-pressed={sentiment === 'bearish'}
            className={`px-2 py-1 text-xs ${sentiment === 'bearish' ? 'bg-red-50 text-red-800 dark:bg-red-900/30' : 'text-gray-600'}`}
            onClick={() => onSentimentChange && onSentimentChange('bearish')}
            aria-label="Bearish"
          >
            Bearish
          </button>
          <button
            aria-pressed={sentiment === 'high'}
            className={`px-2 py-1 text-xs ${sentiment === 'high' ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/30' : 'text-gray-600'}`}
            onClick={() => onSentimentChange && onSentimentChange('high')}
            aria-label="High Impact"
          >
            High
          </button>
        </div>
      </div>

      <div className="flex-1 md:flex-none">
        <label className="sr-only" htmlFor="news-search">Search news</label>
        <input
          id="news-search"
          type="search"
          value={query}
          onChange={(e) => onQueryChange && onQueryChange(e.target.value)}
          placeholder="Search articles, tickers, keywords..."
          className="w-full md:w-72 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded text-sm"
        />
      </div>
    </div>
  );
}
