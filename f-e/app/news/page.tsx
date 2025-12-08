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
    id: '4',
    ticker: 'TSLA',
    headline: 'Tesla Recall Follow-up: Dealer Guidance Updated',
    summary: "Dealers report new inspection steps as interim guidance to owners.",
    source: 'Reuters',
    timeAgo: '3 hours ago',
    sentiment: 'bearish',
    date: MOCK_DAYS[1].id,
  },
  {
    id: '5',
    ticker: 'TSLA',
    headline: 'Tesla Supplier Issues Prompt Shortage Warning',
    summary: "Supplier cutbacks could slightly delay next-gen Model X parts.",
    source: 'Wall Street Journal',
    timeAgo: '4 hours ago',
    sentiment: 'bearish',
    date: MOCK_DAYS[1].id,
  },
  {
    id: '6',
    ticker: 'TSLA',
    headline: 'Tesla Expands Service Discounts',
    summary: "Cost-saving move to address recall repairs ahead of the holiday season.",
    source: 'CNBC',
    timeAgo: '5 hours ago',
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

// Calendar-specific events/data (separate from article news feed)
type CalendarEvent = { id: string; date: string; title: string; description: string; time: string; symbol?: string; tags?: string[]; sentiment?: 'bullish'|'bearish'|'catalyst'|'neutral'|'mixed' };
const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'c1',
    date: MOCK_DAYS[0].id,
    title: 'FOMC Rate Decision',
    description: 'Federal Reserve announces new monetary policy decision',
    time: '8:30 AM ET',
    symbol: 'FOMC',
    tags: ['macro', 'high-impact'],
    sentiment: 'bearish',
  },
  {
    id: 'c2',
    date: MOCK_DAYS[1].id,
    title: 'Earnings Call: AMD',
    description: 'AMD Q4 earnings call with management',
    time: '5:00 PM ET',
    symbol: 'AMD',
    tags: ['earnings'],
    sentiment: 'bullish',
  },
  {
    id: 'c3',
    date: MOCK_DAYS[1].id,
    title: 'IPO: New Fintech',
    description: 'New Fintech announces IPO pricing',
    time: '10:00 AM ET',
    symbol: 'NFIN',
    tags: ['ipo'],
    sentiment: 'catalyst',
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

  // Attach catalysts to each day based on a separate calendar data source (not MOCK_ARTICLES)
  const mapToSentiment = (s?: 'bullish'|'bearish'|'catalyst'|'neutral'|'mixed'): 'bullish'|'bearish'|'mixed' => {
    if (s === 'bearish') return 'bearish';
    if (s === 'bullish') return 'bullish';
    return 'mixed';
  };
  const daysWithCatalysts = MOCK_DAYS.map((d) => ({
    ...d,
    catalysts: MOCK_CALENDAR_EVENTS.filter(e => e.date === d.id).map(e => ({ id: e.id, ticker: e.symbol ?? e.title.split(' ')[0], headline: e.title, sentiment: mapToSentiment(e.sentiment) }))
  }));

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Top: Catalyst Calendar */}
      <header aria-label="Upcoming Catalysts (Next 7 Days)" className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 py-3 mb-4">
        <div className="max-w-5xl mx-auto px-2">
          <h2 className="text-sm text-center text-gray-600 dark:text-gray-400 mb-2">Upcoming Catalysts (Next 7 Days)</h2>
          <CatalystCalendar
            days={daysWithCatalysts}
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
              // Show calendar events in the day modal (separate from news articles)
              <>
                <div className="mb-2">
                  <div className="text-xs text-gray-500 mb-2">Legend</div>
                  <div className="flex gap-3 items-center" role="list" aria-label="Catalyst legend" data-testid="calendar-legend">
                    <div role="listitem" className="inline-flex items-center gap-2">
                      <span data-testid="legend-dot-bullish" className="inline-flex h-3 w-3 rounded-full bg-green-500" aria-hidden />
                      <span className="text-xs text-gray-700 dark:text-gray-300">Bullish</span>
                    </div>
                    <div role="listitem" className="inline-flex items-center gap-2">
                      <span data-testid="legend-dot-bearish" className="inline-flex h-3 w-3 rounded-full bg-red-500" aria-hidden />
                      <span className="text-xs text-gray-700 dark:text-gray-300">Bearish</span>
                    </div>
                    <div role="listitem" className="inline-flex items-center gap-2">
                      <span data-testid="legend-dot-neutral" className="inline-flex h-3 w-3 rounded-full bg-orange-400" aria-hidden />
                      <span className="text-xs text-gray-700 dark:text-gray-300">Neutral</span>
                    </div>
                  </div>
                </div>
              {MOCK_CALENDAR_EVENTS.filter(e => e.date === modalDay.id).length ? (
                MOCK_CALENDAR_EVENTS.filter(e => e.date === modalDay.id).map(e => (
                  <div key={e.id} className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span
                          data-testid={`calendar-modal-dot-${e.id}`}
                          className={`inline-flex h-2 w-2 rounded-full ${e.sentiment === 'bearish' ? 'bg-red-500' : e.sentiment === 'mixed' ? 'bg-orange-400' : 'bg-green-500'}`}
                          aria-hidden
                        />
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{e.title}</div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{e.time}{e.tags?.length ? ` • ${e.tags.join(', ')}` : ''}</div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-3">{e.description}</div>
                  </div>
                ))
              ) : (
                <div className="text-gray-600 dark:text-gray-400">No catalysts for {modalDay.dateLabel}</div>
              ) }
            </>
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
