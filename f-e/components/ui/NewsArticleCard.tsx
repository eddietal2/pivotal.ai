'use client';

import React from 'react';

export type NewsArticle = {
  id: string;
  ticker: string;
  headline: string;
  summary: string;
  source: string;
  timeAgo: string;
  sentiment: 'bullish'|'bearish'|'catalyst'|'neutral'|'mixed';
  date?: string; // iso date used for filtering
};

export default function NewsArticleCard({ article, onClick }: { article: NewsArticle; onClick?: () => void }) {
  const sentimentColor = article.sentiment === 'bullish' ? 'bg-green-50 text-green-800' : article.sentiment === 'bearish' ? 'bg-red-50 text-red-800' : article.sentiment === 'mixed' ? 'bg-orange-50 text-orange-500' : article.sentiment === 'catalyst' ? 'bg-orange-50 text-orange-500' : 'bg-gray-50 text-gray-700';

  return (
    <article
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      data-testid={`news-article-${article.id}`}
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <a href="#" className="text-indigo-600 dark:text-indigo-300 font-bold" onClick={(e) => e.stopPropagation()}>{article.ticker}</a>
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${sentimentColor}`}>{article.sentiment.toUpperCase()}</span>
      </div>
      <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white"><a href="#" className="hover:underline">{article.headline}</a></h3>
      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{article.summary}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div>{article.source}</div>
        <div>{article.timeAgo}</div>
      </div>
    </article>
  );
}
