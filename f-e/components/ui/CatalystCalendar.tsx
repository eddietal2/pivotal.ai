'use client';

import React from 'react';
import CatalystDayCard from './CatalystDayCard';

export type CalendarDay = {
  id: string;
  dateLabel: string; // e.g., NOV 14
  dayLabel?: string; // e.g., Thu
  eventsCount: number;
  icons?: string[];
};

type Props = {
  days: CalendarDay[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
};

export default function CatalystCalendar({ days, selectedId, onSelect }: Props) {
  return (
    <div className="w-full overflow-x-auto -mx-4 px-4">
      <div className="flex gap-3 items-stretch py-3">
        {days.map((d) => (
          <div key={d.id} className="shrink-0">
            <CatalystDayCard
              date={d.dateLabel}
              dayLabel={d.dayLabel}
              eventsCount={d.eventsCount}
              icons={d.icons}
              active={selectedId === d.id}
              onClick={() => onSelect && onSelect(d.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
