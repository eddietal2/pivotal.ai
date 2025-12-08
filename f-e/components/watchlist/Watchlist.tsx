"use client";

import React from "react";
import MarketPulseItem from './MarketPulseItem';

type Ticker = { ticker: string; price?: string; match?: boolean; change?: number; sparkline?: number[] };

type Props = {
  items: Ticker[];
};

export default function Watchlist({ items }: Props) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">My Watchlist</h3>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
        {items.length === 0 ? (
          <div className="text-gray-600 dark:text-gray-400">No tickers in your watchlist.</div>
        ) : (
          <div className="space-y-2">
            {items.map((it) => (
              <MarketPulseItem
                key={it.ticker}
                ticker={it.ticker}
                price={it.price ?? ''}
                change={it.change ?? (typeof it.match === 'boolean' ? (it.match ? 1.2 : -0.6) : 0)}
                sparkline={it.sparkline ?? [1, 2, 4, 3, 6]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
