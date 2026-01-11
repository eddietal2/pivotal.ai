'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import TypewriterText from '@/components/ui/TypewriterText';
import { MarketOverviewSkeleton } from '@/components/ui/skeletons';
import { usePivyChat, PivyChatAsset } from '@/components/context/PivyChatContext';

interface Props {
  isLoading: boolean;
  href?: string;
  date?: string;
  time?: string;
  title?: string;
  message?: string;
}

export default function PivyChatCard({ isLoading, href = '/pivy/chat/0', date = '01/07/26', time = '10:30 AM', title = '', message = '' }: Props) {
  const [titleComplete, setTitleComplete] = React.useState(false);
  const { todaysAssets } = usePivyChat();

  if (isLoading) return <MarketOverviewSkeleton />;

  return (
    <Link href={href}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer flex flex-col justify-between min-h-48">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">{date}</span>
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse ml-2"></span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{time}</span>
          </div>

          <h3 className="py-2 text-base font-semibold text-gray-900 dark:text-white mb-2">
            <TypewriterText text={title} speed={50} delay={500} className="inline" onComplete={() => setTitleComplete(true)} />
          </h3>

          <div className="space-y-1">
            <div className="text-sm">
              <span className="font-medium">🤖</span>{' '}
              {titleComplete && (
                <TypewriterText text={message} speed={80} delay={0} className="inline" />
              )}
              <span className="text-xs text-gray-400"> ({time})</span>
            </div>
          </div>

          {/* Show assets added to today's chat */}
          {todaysAssets.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Tracking {todaysAssets.length} asset{todaysAssets.length > 1 ? 's' : ''}:</p>
              <div className="flex flex-wrap gap-1.5">
                {todaysAssets.slice(0, 4).map((asset: PivyChatAsset) => (
                  <span
                    key={asset.symbol}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      asset.change >= 0
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {asset.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {asset.symbol.replace('-USD', '').replace('=F', '').replace('^', '')}
                  </span>
                ))}
                {todaysAssets.length > 4 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                    +{todaysAssets.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 self-end mt-4" />
      </div>
    </Link>
  );
}
