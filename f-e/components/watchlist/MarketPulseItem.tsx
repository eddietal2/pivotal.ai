"use client";

import React from 'react';
import Sparkline from '@/components/ui/Sparkline';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

type Props = {
  ticker: string;
  price: string;
  change?: number; // percent change
  sparkline?: number[]; // numeric array for sparkline values
};

export default function MarketPulseItem({ ticker, price, change = 0, sparkline = [] }: Props) {
  const isDown = change < 0;
  const changeClass = isDown ? 'text-red-600' : 'text-green-600';
  const sparkStroke = isDown ? '#EF4444' : '#34d399';

  return (
    <button
      data-testid={`market-pulse-${ticker}`}
      type="button"
      className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm dark:shadow-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-500 transition duration-200 w-full text-left focus:outline-none focus:ring-2 focus:ring-indigo-500"
      aria-label={`More info about ${ticker}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-400">{ticker}</p>
      </div>
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-3">
          {/* Sparkline */}
          <div className="flex-shrink-0">
            {sparkline && sparkline.length > 0 && (
              <Sparkline data={sparkline} width={72} height={28} stroke={sparkStroke} className="rounded" gradient={true} fillOpacity={0.12} />
            )}
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">{price}</span>
        </div>
        <span className={`text-sm font-semibold ${changeClass} flex items-center`}>
          {isDown ? <ArrowDownRight className="w-4 h-4 mr-1" /> : <ArrowUpRight className="w-4 h-4 mr-1" />}
          {change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`}
        </span>
      </div>
    </button>
  );
}

