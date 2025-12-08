'use client';

import React from 'react';
import { useState, useMemo } from 'react';
import CatalystCalendar, { CalendarDay } from '@/components/ui/CatalystCalendar';
import InfoModal from '@/components/modals/InfoModal';
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
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [modalDay, setModalDay] = useState<CalendarDay | null>(null);
  const [watchlists] = useState(() => ['All Watchlists','Tech Setups','Macro Alerts']);
  const [selectedWatchlist, setSelectedWatchlist] = useState(watchlists[0]);
  const [sentiment, setSentiment] = useState<'all'|'bullish'|'bearish'|'high'>('all');
  const [query, setQuery] = useState('');
  const [articleModalOpen, setArticleModalOpen] = useState(false);
  const [modalArticle, setModalArticle] = useState<NewsArticle | null>(null);

  const filteredArticles = useMemo(() => {
    return MOCK_ARTICLES.filter((a) => {
      if (sentiment !== 'all') {
        if (sentiment === 'high' && a.sentiment !== 'catalyst') return false;
        if (sentiment === 'bullish' && a.sentiment !== 'bullish') return false;
        if (sentiment === 'bearish' && a.sentiment !== 'bearish') return false;
      }
      if (query && !`${a.ticker} ${a.headline} ${a.summary}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [sentiment, query]);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Top: Catalyst Calendar */}
      <header aria-label="Upcoming Catalysts (Next 7 Days)" className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 py-3 mb-4">
        <div className="max-w-5xl mx-auto px-2">
          <h2 className="text-sm text-center text-gray-600 dark:text-gray-400 mb-2">Upcoming Catalysts (Next 7 Days)</h2>
          <CatalystCalendar
            days={MOCK_DAYS}
            selectedId={selectedDay ?? null}
            onSelect={(id) => {
              setSelectedDay(id);
              const day = MOCK_DAYS.find((d) => d.id === id) ?? null;
              setModalDay(day);
              setDayModalOpen(true);
            }}
          />
        </div>
      </header>

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
                <NewsArticleCard
                  key={a.id}
                  article={a}
                  onClick={() => { setModalArticle(a); setArticleModalOpen(true); }}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Day modal showing catalysts for the selected day */}
      <InfoModal
        open={dayModalOpen}
        onClose={() => setDayModalOpen(false)}
        onAfterClose={() => setModalDay(null)}
        title={modalDay ? `Catalysts for ${modalDay.dateLabel}` : 'Catalysts'}
        ariaLabel={`Catalysts for ${modalDay?.dateLabel ?? 'day'}`}
        verticalAlign="top"
      >
        <div className="w-full max-w-2xl mx-auto space-y-4 p-4">
          {modalDay ? (
            MOCK_ARTICLES.filter(a => a.date === modalDay.id).length ? (
              MOCK_ARTICLES.filter(a => a.date === modalDay.id).map(a => (
                <NewsArticleCard key={a.id} article={a} />
              ))
            ) : (
              <div className="text-gray-600 dark:text-gray-400">No catalysts for {modalDay.dateLabel}</div>
            )
          ) : null}
        </div>
      </InfoModal>
      {/* Article modal showing full article content */}
      <InfoModal
        open={articleModalOpen}
        onClose={() => setArticleModalOpen(false)}
        onAfterClose={() => setModalArticle(null)}
        title={modalArticle ? `${modalArticle.ticker} • ${modalArticle.headline}` : 'Article'}
        ariaLabel={`Article ${modalArticle?.ticker ?? ''}`}
        verticalAlign="top"
      >
        <div className="w-full max-w-2xl mx-auto p-4">
          {modalArticle ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-300">{modalArticle.ticker}</div>
                <div className={`px-2 py-0.5 text-xs font-semibold rounded-full ${modalArticle.sentiment === 'bullish' ? 'bg-green-50 text-green-800' : modalArticle.sentiment === 'bearish' ? 'bg-red-50 text-red-800' : 'bg-orange-50 text-orange-500'}`}>{modalArticle.sentiment.toUpperCase()}</div>
              </div>
              <h3 className="text-2xl font-semibold">{modalArticle.headline}</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">{modalArticle.summary}</div>
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between"><div>{modalArticle.source}</div><div>{modalArticle.timeAgo}</div></div>
              <div className="mt-4">
                <a href="#" className="text-indigo-600 dark:text-indigo-300 hover:underline">Read full article</a>
              </div>
            </div>
          ) : null }
        </div>
      </InfoModal>
    </div>
  );
}
