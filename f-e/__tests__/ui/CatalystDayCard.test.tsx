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
});
