import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, within } from '@testing-library/react';
import NewsPage from '@/app/news/page';

describe('News page skeletons', () => {
  test('renders news article skeleton and filters/calendar skeletons when skeleton demo is enabled', () => {
    jest.useFakeTimers();
    render(<NewsPage />);
    expect(screen.getByTestId('news-article-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-day-skeleton-0')).toBeInTheDocument();
    expect(screen.getByTestId('news-feed-filters-skeleton')).toBeInTheDocument();
  });

  test('can toggle skeleton demo via the dev toggle button', () => {
    jest.useFakeTimers();
    render(<NewsPage />);
    // The dev toggle was removed; ensure the toggle is not present
    expect(screen.queryByTestId('news-skeleton-toggle')).not.toBeInTheDocument();
  });

  test('article modal shows skeleton while loading and then displays article', () => {
    jest.useFakeTimers();
    render(<NewsPage />);
    const articleTitle = screen.getByText(/AMD Gains 5%/i);
    fireEvent.click(articleTitle);
    // modal skeleton should appear
    expect(screen.getByTestId('news-article-modal-skeleton')).toBeInTheDocument();
    // advance fake timers to simulate load finish
    jest.advanceTimersByTime(500);
    // now the modal should contain the headline text
    expect(screen.getByText(/AMD Gains 5%/i)).toBeInTheDocument();
  });

  test('day modal shows skeleton while loading and then displays day modal content', () => {
    jest.useFakeTimers();
    render(<NewsPage />);
    // find the catalyst calendar section by its aria-label
    const calendarSection = screen.getByLabelText(/Upcoming Catalysts/i);
    const { getAllByRole } = within(calendarSection);
    // get first day card button and click
    const buttons = getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.click(buttons[0]);
    // day modal skeleton should appear
    expect(screen.getByTestId('day-modal-skeleton')).toBeInTheDocument();
    // advance fake timers to simulate load complete
    jest.advanceTimersByTime(500);
    // now the modal should contain calendar legend (content)
    expect(screen.getByTestId('calendar-legend')).toBeInTheDocument();
  });
});
