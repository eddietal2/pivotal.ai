import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import TypewriterText from '@/components/ui/TypewriterText';
import { MarketOverviewSkeleton } from '@/components/ui/skeletons';

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

  if (isLoading) return <MarketOverviewSkeleton />;

  return (
    <Link href={href}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer flex flex-col justify-between h-48">
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
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 self-end mt-4" />
      </div>
    </Link>
  );
}
