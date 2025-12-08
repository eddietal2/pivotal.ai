"use client";

import React from 'react';

type Props = {
  sampleTickers?: { ticker: string; price: string; match: boolean }[];
  ruleSummary?: string;
};

export default function LivePreview({ sampleTickers = [], ruleSummary }: Props) {
  return (
    <div className="mt-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Live Preview</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">Rule: {ruleSummary ?? '—'}</div>
      <div className="mt-2 space-y-1">
        {sampleTickers.map((t) => (
          <div key={t.ticker} className="flex items-center justify-between text-sm">
            <div className="font-medium">{t.ticker}</div>
            <div className={t.match ? 'text-green-600' : 'text-red-600'}>{t.price}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
