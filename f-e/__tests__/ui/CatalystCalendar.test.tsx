import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import CatalystCalendar from '@/components/ui/CatalystCalendar';

const sampleDays = [
  { id: 'd1', dateLabel: 'NOV 1', dayLabel: 'MON', eventsCount: 1, icons: ['🗓️'], catalysts: [{ id: 'a1', ticker: 'AMD', headline: 'Earnings', sentiment: 'bullish' }] },
  { id: 'd2', dateLabel: 'NOV 2', dayLabel: 'TUE', eventsCount: 0, icons: [], catalysts: [] },
  { id: 'd3', dateLabel: 'NOV 3', dayLabel: 'WED', eventsCount: 3, icons: ['💎', '⚡️'], catalysts: [{ id: 'a3', ticker: 'TSLA', headline: 'Recall', sentiment: 'bearish' }] },
];

describe('CatalystCalendar', () => {
  test('renders days and calls onSelect when clicked', () => {
    const onSelect = jest.fn();
    render(<CatalystCalendar days={sampleDays} selectedId={sampleDays[1].id} onSelect={onSelect} />);

    // Check that day labels are shown
    expect(screen.getByText('MON')).toBeInTheDocument();
    expect(screen.getByText('NOV 2')).toBeInTheDocument();
    expect(screen.getByText('WED')).toBeInTheDocument();
    // Check that catalysts are displayed
    expect(screen.getByText('AMD')).toBeInTheDocument();

    const btn = screen.getByRole('button', { name: /Show events for NOV 3/i });
    fireEvent.click(btn);
    expect(onSelect).toHaveBeenCalledWith('d3');
  });

  test('displays the active day with aria-pressed true', () => {
    render(<CatalystCalendar days={sampleDays} selectedId={'d1'} />);
    const activeBtn = screen.getByRole('button', { name: /Show events for NOV 1/i });
    expect(activeBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('shows sentiment dots for catalysts in calendar day cards', () => {
    render(<CatalystCalendar days={sampleDays} selectedId={sampleDays[0].id} />);
    // AMD on day d1 is bullish -> dot should be green
    const amdDot = screen.getByTestId('catalyst-chip-dot-a1');
    expect(amdDot).toHaveClass('bg-green-500');
    // TSLA on day d3 is bearish -> dot should be red (present in the document even if not selected)
    const tslaDot = screen.getByTestId('catalyst-chip-dot-a3');
    expect(tslaDot).toHaveClass('bg-red-500');
  });
});
