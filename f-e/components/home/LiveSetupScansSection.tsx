import React from 'react';
import CollapsibleSection from '@/components/ui/CollapsibleSection';
import SignalFeedItem from '@/components/ui/SignalFeedItem';
import { SignalFeedSkeleton } from '@/components/ui/skeletons';
import SignalEducationCard from '@/components/ui/SignalEducationCard';
import signalEducationCards from '@/components/ui/signalEducationData';
import { ListChecks } from 'lucide-react';

interface Props {
  isLoading: boolean;
  filteredSignals: any[];
  signalTimeframe: 'D' | 'W' | 'M' | 'Y';
  setSignalTimeframe: (t: 'D'|'W'|'M'|'Y') => void;
  signalFeedInfoOpen: boolean;
  setSignalFeedInfoOpen: (open: boolean) => void;
}

export default function LiveSetupScansSection({ isLoading, filteredSignals, signalTimeframe, setSignalTimeframe, signalFeedInfoOpen, setSignalFeedInfoOpen }: Props) {
  return (
    <CollapsibleSection
      title={
        <span className="flex items-center gap-2">Live Setup Scans</span>
      }
      infoButton={(open) => open ? (
        <div className="flex items-center gap-2">
          <div className="ml-3 inline-flex items-center rounded-md bg-gray-50 border border-gray-200 p-1 dark:bg-gray-800 dark:border-gray-700">
            {( ['D','W','M','Y'] as const ).map((t) => (
              <button
                key={t}
                type="button"
                className={`min-w-[30px] px-2 py-1 text-xs rounded ${signalTimeframe === t ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                aria-pressed={signalTimeframe === t}
                aria-label={`Show ${t} timeframe`}
                onClick={(e) => { e.stopPropagation(); setSignalTimeframe(t); }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    >
      <p className='text-[#999]'>Daily market scans using key swing-trading indicators (MACD, RSI, volume, moving averages), producing up to 10 generated leads per trading day.</p>
      <h3 className='my-4 text-lg'>Leads: 12/09/25</h3>
      <div className="flex flex-row gap-4 overflow-x-auto snap-x snap-mandatory sm:grid sm:grid-cols-3 sm:gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SignalFeedSkeleton key={i} />)
        ) : (
          filteredSignals.map((signal, index) => (
            <SignalFeedItem key={index} {...signal} />
          ))
        )}

        <div className="text-center p-4 sm:col-span-3">
          <p className="text-indigo-400 font-semibold flex items-center justify-center">
            <ListChecks className="w-5 h-5 mr-2" />
            View & Customize Watchlist Scans
          </p>
        </div>
      </div>

      <div className="mt-6 text-right">
        <button
          type="button"
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium"
          onClick={(e) => { e.stopPropagation(); setSignalFeedInfoOpen(true); }}
        >
          Learn more about Live Setup Scans →
        </button>
      </div>

    </CollapsibleSection>
  );
}
