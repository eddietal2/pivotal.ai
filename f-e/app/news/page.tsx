'use client';

import React from 'react';
import { useState, useMemo } from 'react';
import CatalystCalendar, { CalendarDay } from '@/components/ui/CatalystCalendar';
import NewsFeedFilters from '@/components/ui/NewsFeedFilters';
import NewsArticleCard, { NewsArticle } from '@/components/ui/NewsArticleCard';

const MOCK_DAYS: CalendarDay[] = Array.from({ length: 9 }).map((_, idx) => {
  const d = new Date();
  d.setDate(d.getDate() + idx);
  const dateLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase();
  return {
    id: `${d.toISOString().slice(0,10)}`,
    dateLabel,
    dayLabel: d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(),
    eventsCount: Math.floor(Math.random()*4),
    icons: ['🗓️','💎'].slice(0, Math.floor(Math.random()*2)+1),
  };
});

const MOCK_ARTICLES: NewsArticle[] = [
  {
    id: '1',
    ticker: 'AMD',
    headline: 'AMD Gains 5% After Strong Analyst Rating Upgrade',
    summary: "The analyst cited momentum in the server chip market and a potential margin expansion by Q4.",
    source: 'Bloomberg',
    timeAgo: '48 mins ago',
    sentiment: 'bullish',
    date: MOCK_DAYS[0].id,
  },
  {
    id: '2',
    ticker: 'AAPL',
    headline: 'Apple Files New Patent That Could Revolutionize AI Chips',
    summary: "New filings hint at an on-device AI chip architecture with power optimizations.",
    source: 'TechCrunch',
    timeAgo: '1 hour ago',
    sentiment: 'catalyst',
    date: MOCK_DAYS[1].id,
  },
  {
    id: '3',
    ticker: 'TSLA',
    headline: 'Tesla Recalls Model X Over Brake Component',
    summary: "Recall expected to cost the company an estimated $200M, analysts say caution ahead of earnings.",
    source: 'Reuters',
    timeAgo: '2 hours ago',
    sentiment: 'bearish',
    date: MOCK_DAYS[1].id,
  },
];

export default function NewsPage() {
  const [selectedDay, setSelectedDay] = useState<string | null>(MOCK_DAYS[0].id);
  const [watchlists] = useState(() => ['All Watchlists','Tech Setups','Macro Alerts']);
  const [selectedWatchlist, setSelectedWatchlist] = useState(watchlists[0]);
  const [sentiment, setSentiment] = useState<'all'|'bullish'|'bearish'|'high'>('all');
  const [query, setQuery] = useState('');

  const filteredArticles = useMemo(() => {
    return MOCK_ARTICLES.filter((a) => {
      if (selectedDay && a.date !== selectedDay) return false;
      if (sentiment !== 'all') {
        if (sentiment === 'high' && a.sentiment !== 'catalyst') return false;
        if (sentiment === 'bullish' && a.sentiment !== 'bullish') return false;
        if (sentiment === 'bearish' && a.sentiment !== 'bearish') return false;
      }
      if (query && !`${a.ticker} ${a.headline} ${a.summary}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [selectedDay, sentiment, query]);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Top: Catalyst Calendar */}
      <section aria-label="Upcoming Catalysts (Next 7 Days)" className="mb-6">
        <h2 className="text-sm text-center text-gray-600 dark:text-gray-400 mb-2">Upcoming Catalysts (Next 7 Days)</h2>
        <CatalystCalendar days={MOCK_DAYS} selectedId={selectedDay ?? null} onSelect={(id) => setSelectedDay(id)} />
      </section>

      {/* Main content */}
      <section className="grid grid-cols-1 lg:grid-cols-[1fr] gap-6">
        <div className="w-full">
          {/* Controls */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Watchlist News Feed</h3>
            </div>
            <NewsFeedFilters
              watchlists={watchlists}
              selectedWatchlist={selectedWatchlist}
              onWatchlistChange={setSelectedWatchlist}
              sentiment={sentiment}
              onSentimentChange={(s) => setSentiment(s)}
              query={query}
              onQueryChange={(q) => setQuery(q)}
            />
          </div>

          {/* News feed */}
          <div className="space-y-4">
            {filteredArticles.length === 0 ? (
              <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400">No articles found for the selected filters.</div>
            ) : (
              filteredArticles.map((a) => (
                <NewsArticleCard key={a.id} article={a} />
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
