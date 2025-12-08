import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import NewsArticleCard from '@/components/ui/NewsArticleCard';

const sampleArticle = {
  id: 'a1',
  ticker: 'AMD',
  headline: 'AMD grows on server demand',
  summary: 'Server chip sales accelerate, boosting revenue',
  source: 'Bloomberg',
  timeAgo: '30 mins ago',
  sentiment: 'bullish',
};

describe('NewsArticleCard', () => {
  test('renders article fields', () => {
    render(<NewsArticleCard article={sampleArticle as any} />);
    expect(screen.getByText('AMD')).toBeInTheDocument();
    expect(screen.getByText(/AMD grows on server demand/)).toBeInTheDocument();
    expect(screen.getByText(/Server chip sales accelerate/)).toBeInTheDocument();
    expect(screen.getByText('Bloomberg')).toBeInTheDocument();
    expect(screen.getByText(/30 mins ago/)).toBeInTheDocument();
    expect(screen.getByText(/BULLISH/)).toBeInTheDocument();
  });

  test('onClick and keyboard open behavior', () => {
    const cb = jest.fn();
    render(<NewsArticleCard article={sampleArticle as any} onClick={cb} />);
    const card = screen.getByTestId('news-article-a1');
    expect(card).toHaveAttribute('role', 'button');
    fireEvent.click(card);
    expect(cb).toHaveBeenCalled();
    fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
    expect(cb).toHaveBeenCalledTimes(2);
  });

  test('clicking ticker link does not open the article modal', () => {
    const cb = jest.fn();
    render(<NewsArticleCard article={sampleArticle as any} onClick={cb} />);
    const link = screen.getByText('AMD');
    fireEvent.click(link);
    expect(cb).not.toHaveBeenCalled();
  });
});
