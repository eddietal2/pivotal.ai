"use client";

import React from 'react';

type Strategy = { id: string; name: string; lastEdited: string; matchingCount: number };

const MOCK: Strategy[] = [
  { id: 's1', name: 'Bull MACD High Vol', lastEdited: 'Dec 1', matchingCount: 12 },
  { id: 's2', name: 'Momentum RSI Dip', lastEdited: 'Nov 28', matchingCount: 3 },
];

export default function StrategyList() {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Strategies</div>
      <div className="space-y-2">
        {MOCK.map((s) => (
          <div key={s.id} className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{s.name}</div>
              <div className="text-xs text-gray-500">Last edited: {s.lastEdited}</div>
            </div>
            <div className="text-xs text-gray-500">Matches: {s.matchingCount}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
