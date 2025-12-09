'use client';

import React from 'react';

// Skeleton component for MarketPulse cards
export function MarketPulseSkeleton() {
  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl shadow-sm dark:shadow-lg border border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="flex items-center justify-between gap-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
      </div>
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-3">
          <div className="w-18 h-7 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-14"></div>
      </div>
    </div>
  );
}

// Skeleton for MarketOverview
export function MarketOverviewSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm dark:shadow-lg animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
      </div>
      <div className="mt-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      </div>
      <div className="mt-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
      </div>
    </div>
  );
}

// Skeleton for SignalFeedItem
export function SignalFeedSkeleton() {
  return (
    <div className="relative p-5 lg:p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 animate-pulse">
      {/* Placeholder sentiment tag in top-right */}
      <div className="absolute right-3 top-3 w-10 h-3 rounded-full bg-gray-200 dark:bg-gray-700"></div>
      <div className="flex justify-between items-start">
        <div className="flex items-baseline">
          <div className="h-8 lg:h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 mr-2"></div>
          <div className="h-4 lg:h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
        </div>
        <div className="text-right pr-14 lg:pr-16">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-14 mb-1"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
      </div>
      <div className="mt-2 h-5 lg:h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      <div className="mt-3 flex flex-wrap gap-2">
        <div className="h-6 lg:h-5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        <div className="h-6 lg:h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        <div className="h-6 lg:h-5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
      </div>
      <div className="mt-4 flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="h-8 lg:h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 lg:w-24"></div>
        <div className="h-8 lg:h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 lg:w-20"></div>
      </div>
    </div>
  );
}

// Skeleton for WatchlistItem / Watchlist page list
export function WatchlistSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm dark:shadow-lg animate-pulse">
      <div className="flex items-center justify-between gap-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3">
          <div className="w-18 h-7 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-14"></div>
      </div>
    </div>
  );
}

// Skeleton for LivePreview on the Watchlist page
export function LivePreviewSkeleton() {
  return (
    <div className="mt-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3"></div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
}

// Skeleton for News Article Card
export function NewsArticleSkeleton() {
  return (
    <div data-testid="news-article-skeleton" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-sm animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
      </div>
      <div className="mt-2 h-5 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      <div className="mt-2 h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
      </div>
    </div>
  );
}

// Skeleton for the Catalyst Calendar
export function CatalystCalendarSkeleton() {
  return (
    <div className="w-full overflow-x-auto -mx-4 px-4">
      <div className="flex gap-3 items-stretch py-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} data-testid={`calendar-day-skeleton-${i}`} className="shrink-0 w-36 sm:w-40 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton for NewsFeed filters (controls)
export function NewsFeedFiltersSkeleton() {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
      </div>
      <div data-testid="news-feed-filters-skeleton" className="flex items-center gap-3">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
      </div>
    </div>
  );
}

// Skeleton used for the article modal while loading the full article content
export function NewsArticleModalSkeleton() {
  return (
    <div data-testid="news-article-modal-skeleton" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg shadow-sm animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 mb-2"></div>
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
      <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
    </div>
  );
}

// Skeleton used for day modal while loading catalysts/events for a day
export function DayModalSkeleton() {
  return (
    <div data-testid="day-modal-skeleton" className="p-4 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  );
}