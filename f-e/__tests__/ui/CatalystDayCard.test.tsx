import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import CatalystDayCard from '@/components/ui/CatalystDayCard';

describe('CatalystDayCard', () => {
  test('renders with labels and events', () => {
    render(<CatalystDayCard date="NOV 20" dayLabel="MON" eventsCount={2} icons={["🗓️","💎"]} active={false} />);
    expect(screen.getByText('MON')).toBeInTheDocument();
    expect(screen.getByText('NOV 20')).toBeInTheDocument();
    expect(screen.getByText(/2 Events/)).toBeInTheDocument();
    expect(screen.getByTitle('🗓️')).toBeInTheDocument();
  });

  test('calls onClick and shows active state via aria-pressed', () => {
    const cb = jest.fn();
    render(<CatalystDayCard date="NOV 21" onClick={cb} active={true} />);
    const btn = screen.getByRole('button', { name: /Show events for NOV 21/i });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(btn);
    expect(cb).toHaveBeenCalled();
  });

  test('renders catalysts list when provided', () => {
    const catalysts = [
      { id: 'a1', ticker: 'AMD', headline: 'Earnings beat' },
      { id: 'a2', ticker: 'AAPL', headline: 'Patent filing' },
    ];
    render(<CatalystDayCard date="NOV 22" catalysts={catalysts} />);
    expect(screen.getByText('AMD')).toBeInTheDocument();
    expect(screen.getByText('Earnings beat')).toBeInTheDocument();
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('Patent filing')).toBeInTheDocument();
  });

  test('renders sentiment dot and ticker in chip', () => {
    const catalysts = [
      { id: 'a1', ticker: 'AMD', headline: 'Earnings beat', sentiment: 'bullish' as 'bullish' },
    ];
    render(<CatalystDayCard date="NOV 22" catalysts={catalysts} />);
    expect(screen.getByText('AMD')).toBeInTheDocument();
    // ensure the colored dot exists by checking the data-testid
    const dot = screen.getByTestId('catalyst-chip-dot-a1');
    expect(dot).toHaveClass('bg-green-500');
  });

  test('renders bearish and fallback/mixed sentiments correctly', () => {
    const catalysts = [
      { id: 'b1', ticker: 'TSLA', headline: 'Recall', sentiment: 'bearish' as 'bearish' },
      { id: 'c1', ticker: 'AAPL', headline: 'Catalyst Event', sentiment: 'catalyst' as 'catalyst' },
      { id: 'n1', ticker: 'MSFT', headline: 'Neutral Event', sentiment: 'neutral' as 'neutral' },
    ];
    render(<CatalystDayCard date="NOV 22" catalysts={catalysts} />);
    const dotB = screen.getByTestId('catalyst-chip-dot-b1');
    const dotC = screen.getByTestId('catalyst-chip-dot-c1');
    const dotN = screen.getByTestId('catalyst-chip-dot-n1');
    expect(dotB).toHaveClass('bg-red-500');
    expect(dotC).toHaveClass('bg-orange-400');
    expect(dotN).toHaveClass('bg-orange-400');
  });
});
