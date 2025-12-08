'use client';

import React from 'react';

type Props = {
  date: string; // iso or short label
  dayLabel?: string; // Mon, Tue, Wed
  eventsCount?: number;
  icons?: string[]; // emoji or icons
  active?: boolean;
  onClick?: () => void;
};

export default function CatalystDayCard({ date, dayLabel, eventsCount = 0, icons = [], active, onClick }: Props) {
  const activeClass = active ? 'border-indigo-600 shadow-md' : 'border-transparent';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 w-36 sm:w-40 p-3 rounded-lg border ${activeClass} bg-white dark:bg-gray-800 hover:shadow-lg transition-colors`}
      aria-pressed={active}
      aria-label={`Show events for ${date}`}
    >
      <div className="text-xs text-gray-400 dark:text-gray-400 mb-1 text-center">{dayLabel ?? date}</div>
      <div className="text-sm font-semibold text-gray-900 dark:text-white text-center">{date}</div>
      <div className="mt-2 flex items-center justify-center gap-2">
        <div className="text-xs text-gray-500 dark:text-gray-300">{eventsCount} Events</div>
      </div>
      <div className="mt-2 flex items-center justify-center gap-1 text-xs" aria-hidden>
        {icons.map((ic, i) => (
          <span key={i} className="inline-block" title={ic}>{ic}</span>
        ))}
      </div>
    </button>
  );
}
