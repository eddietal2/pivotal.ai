import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
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
});
