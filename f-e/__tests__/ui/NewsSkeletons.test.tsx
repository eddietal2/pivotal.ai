import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { NewsArticleSkeleton, CatalystCalendarSkeleton, NewsFeedFiltersSkeleton } from '@/components/ui/skeletons';

describe('News skeletons', () => {
  test('renders news article skeleton', () => {
    render(<NewsArticleSkeleton />);
    expect(screen.getByTestId('news-article-skeleton')).toBeInTheDocument();
  });

  test('renders calendar skeleton days', () => {
    render(<CatalystCalendarSkeleton />);
    expect(screen.getByTestId('calendar-day-skeleton-0')).toBeInTheDocument();
  });

  test('renders news feed filters skeleton', () => {
    render(<NewsFeedFiltersSkeleton />);
    expect(screen.getByTestId('news-feed-filters-skeleton')).toBeInTheDocument();
  });
});
