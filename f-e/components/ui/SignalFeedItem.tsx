'use client';

import React from 'react';
import { lockScroll, unlockScroll } from '@/components/modals/scrollLock';
import { ListChecks, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useUI } from '@/components/context/UIContext';

type SignalFeedItemProps = {
  ticker: string;
  signal: string;
  confluence: string[];
  timeframe: string;
  change: string;
  type: string;
};

export default function SignalFeedItem({ ticker, signal, confluence, timeframe, change, type }: SignalFeedItemProps) {
  const isBullish = type === 'Bullish';
  // Use softer/smaller contrast colors for readability
  const color = isBullish ? 'text-green-600' : type === 'Bearish' ? 'text-red-600' : 'text-yellow-600';
  // Soft gradient with light grey -> color, and a gentle dark-mode overlay
  const bgColor = isBullish
    ? 'bg-gradient-to-r from-gray-50 to-green-50 dark:from-gray-900 dark:to-green-900/20'
    : type === 'Bearish'
    ? 'bg-gradient-to-r from-gray-50 to-red-50 dark:from-gray-900 dark:to-red-900/20'
    : 'bg-gradient-to-r from-gray-50 to-yellow-50 dark:from-gray-900 dark:to-yellow-900/20';
  const borderColor = isBullish ? 'border-green-200 dark:border-green-500' : type === 'Bearish' ? 'border-red-200 dark:border-red-500' : 'border-yellow-200 dark:border-yellow-500';

  const { setModalOpen } = useUI();
  const [chartModalOpen, setChartModalOpen] = React.useState(false);
  React.useEffect(() => {
    let locked = false;
    if (chartModalOpen) {
      lockScroll();
      locked = true;
    }
    return () => {
      if (locked) {
        unlockScroll();
      }
    };
  }, [chartModalOpen]);

  return (
    <>
      <div className={`p-5 rounded-2xl border-l-4 ${borderColor} ${bgColor} transition duration-300 hover:shadow-2xl`}>
        <div className="flex justify-between items-start">
          <div className="flex items-baseline">
            <span className="text-2xl font-extrabold text-gray-900 dark:text-white mr-2">{ticker}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color} border ${borderColor} bg-gray-50 dark:bg-gray-900/70`}>
              {timeframe}
            </span>
          </div>
          <div className="text-right">
            <span className={`text-lg font-bold ${color}`}>{change}</span>
            <p className="text-xs text-gray-400">{type} Change</p>
          </div>
        </div>

        <p className={`mt-2 text-lg font-semibold ${color}`}>{signal}</p>

        {/* Confluence Tags */}
        <div className="mt-3 flex flex-wrap gap-2">
          {confluence.map((c, i) => (
            <span key={i} className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700">
              {c}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2 pt-3 border-t border-gray-700/50">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-700/50 rounded-lg transition-colors">
            <ListChecks className="w-3.5 h-3.5" />
            Add to Watchlist
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-900 dark:text-gray-200 bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
            onClick={() => setChartModalOpen(true)}
          >
            View Chart
          </button>
        </div>
      </div>
      {/* Chart Modal */}
      {chartModalOpen && (
        <div className="fixed inset-0 z-[101] min-h-screen h-screen w-screen bg-black/70" role="dialog" aria-modal="true" aria-label={`${ticker} Chart Modal`}>
          <div className="absolute inset-0 min-h-screen h-screen w-screen flex items-stretch justify-stretch">
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-t-2xl shadow-sm dark:shadow-2xl w-full min-h-screen h-screen mx-auto relative animate-slideUp flex flex-col">
              {/* Header with title and top X close button */}
              <div className="w-full px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">{ticker} Chart</h4>
                </div>
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-900 dark:hover:text-white text-2xl font-bold transition-colors"
                  onClick={() => setChartModalOpen(false)}
                  aria-label="Close chart modal"
                  data-testid="chart-modal-close-top"
                >
                  &times;
                </button>
              </div>

              {/* Content area */}
              <div className="flex-1 flex flex-col justify-start items-center pt-6 pb-8 px-8 overflow-y-auto w-full max-h-screen" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="space-y-6 w-full max-w-2xl mx-auto">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                    <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
                      {signal}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{change}</span>
                      <span className={`text-sm font-semibold ${color} flex items-center`}>
                        {type === 'Bullish' ? <ArrowUpRight className="w-4 h-4 mr-1" /> : type === 'Bearish' ? <ArrowDownRight className="w-4 h-4 mr-1" /> : null}
                        {type}
                      </span>
                    </div>
                  </div>

                  {/* Chart Placeholder */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                    <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center">
                      <span className="text-gray-600 dark:text-gray-400 text-lg">[Signal Chart Placeholder]</span>
                    </div>
                  </div>

                  {/* Confluence List */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {confluence.map((c, i) => (
                        <span key={i} className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer close button */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setChartModalOpen(false)}
                  aria-label="Close chart modal"
                  data-testid="chart-modal-close-bottom"
                >
                  Close
                </button>
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes slideUp {
              from { transform: translateY(100%); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            .animate-slideUp {
              animation: slideUp 0.4s cubic-bezier(0.4, 0.8, 0.2, 1) both;
            }
          `}</style>
        </div>
      )}
    </>
  );
}
