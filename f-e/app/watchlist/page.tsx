"use client";

import React, { useState } from 'react';
import RuleBuilder from '../../components/watchlist/RuleBuilder';
import StrategyList from '../../components/watchlist/StrategyList';
import LivePreview from '../../components/watchlist/LivePreview';
import Watchlist from '../../components/watchlist/Watchlist';
import { WatchlistSkeleton, LivePreviewSkeleton } from '../../components/ui/skeletons';

export default function WatchlistPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [sample, setSample] = useState([
    { ticker: 'AAPL', price: '$180.50', match: true, change: 1.24, sparkline: [170, 175, 178, 180, 181, 180, 180.5] },
    { ticker: 'AMD', price: '$130.20', match: false, change: -2.34, sparkline: [140, 135, 138, 131, 130, 129, 128] },
    { ticker: 'TSLA', price: '$260.10', match: true, change: 0.65, sparkline: [250, 252, 255, 258, 260, 259, 260.1] },
  ]);
  const [view, setView] = useState<'watchlist' | 'strategy'>('watchlist');
  React.useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 py-3 mb-4">
        <div className="max-w-5xl mx-auto px-2">
          <div className="flex items-center justify-start gap-2">
            <div role="tablist" aria-label="Watchlist Segments" className="rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 inline-flex p-0.5">
              <button
                id="tab-watchlist"
                type="button"
                role="tab"
                aria-selected={view === 'watchlist'}
                aria-controls="panel-watchlist"
                onClick={() => setView('watchlist')}
                className={`px-4 py-2 text-sm ${view === 'watchlist' ? 'bg-indigo-600 text-white dark:bg-indigo-500 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
              >
                Watchlist
              </button>
              <button
                id="tab-strategy"
                type="button"
                role="tab"
                aria-selected={view === 'strategy'}
                aria-controls="panel-strategy"
                onClick={() => setView('strategy')}
                className={`px-4 py-2 text-sm ${view === 'strategy' ? 'bg-indigo-600 text-white dark:bg-indigo-500 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
              >
                Strategy Builder
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab panels */}
      <section id="panel-watchlist" role="tabpanel" aria-labelledby="tab-watchlist" hidden={view !== 'watchlist'}>
        <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6">
          <div>
            {isLoading ? (
              <div className="space-y-3">
                <WatchlistSkeleton />
                <WatchlistSkeleton />
                <WatchlistSkeleton />
              </div>
            ) : (
              <Watchlist items={sample} />
            )}
          </div>
          <aside>
            {isLoading ? (
              <LivePreviewSkeleton />
            ) : (
              <LivePreview sampleTickers={sample} ruleSummary="RSI less than 30 AND MACD crosses above Signal Line" />
            )}
          </aside>
        </div>
      </section>

      <section id="panel-strategy" role="tabpanel" aria-labelledby="tab-strategy" hidden={view !== 'strategy'}>
        <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6">
          <div>
            <RuleBuilder />
          </div>
          <aside>
            <StrategyList />
            <div className="mt-4">
              <LivePreview sampleTickers={sample} ruleSummary="RSI less than 30 AND MACD crosses above Signal Line" />
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
