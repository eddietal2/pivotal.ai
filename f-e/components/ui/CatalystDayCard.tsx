'use client';

import React from 'react';

type CatalystItem = {
  id: string;
  ticker: string;
  headline: string;
  sentiment?: 'bullish'|'bearish'|'catalyst'|'neutral'|'mixed';
};

type Props = {
  date: string; // iso or short label
  dayLabel?: string; // Mon, Tue, Wed
  eventsCount?: number;
  icons?: string[]; // emoji or icons
  catalysts?: CatalystItem[];
  active?: boolean;
  onClick?: () => void;
};

export default function CatalystDayCard({ date, dayLabel, eventsCount = 0, icons = [], catalysts = [], active, onClick }: Props) {
  const activeClass = active ? 'border-indigo-600 shadow-md' : 'border-transparent';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 w-36 sm:w-40 p-3 rounded-lg border ${activeClass} bg-white dark:bg-gray-800 hover:shadow-lg transition-colors text-left`}
      aria-pressed={active}
      aria-label={`Show events for ${date}`}
    >
      <div className="text-xs text-gray-400 dark:text-gray-400 mb-1 text-center">{dayLabel ?? date}</div>
      <div className="text-sm font-semibold text-gray-900 dark:text-white text-center">{date}</div>
      {icons.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-1">
          {icons.map((ic, i) => (
            <span key={i} title={ic} aria-hidden className="text-sm" aria-label={`icon-${i}`}>{ic}</span>
          ))}
        </div>
      )}
      <div className="mt-2">
        {catalysts.length > 0 ? (
          <div className="flex flex-col gap-1">
            {catalysts.slice(0,3).map(c => (
              <div key={c.id} className="flex items-center gap-2 truncate" title={c.headline}>
                <span
                  data-testid={`catalyst-chip-dot-${c.id}`}
                  className={`inline-flex h-2 w-2 rounded-full ${c.sentiment === 'bearish' ? 'bg-red-500' : (c.sentiment === 'mixed' || c.sentiment === 'catalyst' || c.sentiment === 'neutral') ? 'bg-orange-400' : 'bg-green-500'}`}
                  aria-hidden
                />
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 min-w-[44px]">{c.ticker}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{c.headline}</span>
              </div>
            ))}
            {catalysts.length > 3 && <div className="text-xs text-gray-400">+{catalysts.length - 3} more</div>}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <div className="text-xs text-gray-500 dark:text-gray-300">{eventsCount} Events</div>
          </div>
        )}
      </div>
    </button>
  );
}
