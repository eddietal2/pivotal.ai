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
    <div className="p-5 rounded-2xl border-l-4 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex items-baseline">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mr-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
        </div>
        <div className="text-right">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-14 mb-1"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
      </div>
      <div className="mt-2 h-5 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      <div className="mt-3 flex flex-wrap gap-2">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
      </div>
      <div className="mt-4 flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
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