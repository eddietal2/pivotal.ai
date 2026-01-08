"use client";

import React from 'react';
import Sparkline from '@/components/ui/Sparkline';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

type Props = {
  ticker: string;
  price: string;
  change?: number; // percent change
  sparkline?: number[]; // numeric array for sparkline values
  timeframe?: string;
  afterHours?: boolean;
  rv?: number; // relative volume (e.g., 1.2 for 1.2x)
  onClick?: () => void;
};

export default function WatchListItem({ ticker, price, change = 0, sparkline = [], timeframe, afterHours, rv, onClick }: Props) {
  const isDown = change < 0;
  const changeClass = isDown ? 'text-red-600' : 'text-green-600';
  const sparkStroke = isDown ? '#EF4444' : '#34d399';

  return (
    <button
      data-testid={`watchlist-item-${ticker}`}
      type="button"
      onClick={onClick}
      className="bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm dark:shadow-lg border border-gray-200 dark:border-gray-700 transition duration-200 w-full h-24 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 item-press"
      aria-label={`More info about ${ticker}${timeframe ? ', timeframe ' + timeframe : ''}${afterHours ? ', after hours' : ''}`}
    >
      <div className="item-press-inner relative">
        <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-400">{ticker}</p>
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
            <span className="text-md lg:text-xl font-bold text-gray-900 dark:text-white">{price}</span>
            {typeof rv === 'number' && (
              <span className="text-xs text-gray-500 dark:text-gray-400">RV: {rv.toFixed(2)}x</span>
            )}
          </div>
        </div>
        <span className={`text-sm font-semibold ${changeClass} flex items-center`}>
          {isDown ? <ArrowDownRight className="w-4 h-4 mr-1" /> : <ArrowUpRight className="w-4 h-4 mr-1" />}
          {change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`}
        </span>
      </div>
    </button>
  );
}
