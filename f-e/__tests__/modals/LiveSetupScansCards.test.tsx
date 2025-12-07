import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, within } from '@testing-library/react';
import InfoModal from '@/components/modals/InfoModal';
import SignalEducationCard from '@/components/ui/SignalEducationCard';
import signalEducationCards from '@/components/ui/signalEducationData';

describe('Live Setup Scans InfoModal education cards', () => {
  test('renders multiple education cards in the modal', () => {
    const { container } = render(
      <InfoModal open={true} onClose={() => {}} title={<div>About Live Setup Scans</div>}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SignalEducationCard title="Moving Average (MA)" subtitle="Foundation (Trend)" description="desc" examples={["a"]} badge="Trend" />
            <SignalEducationCard title="MACD Crossover (Bullish)" subtitle="Foundation (Momentum)" description="desc" examples={["b"]} badge="Momentum" />
            <SignalEducationCard title="MACD Crossover (Bearish)" subtitle="Foundation (Momentum)" description="desc" examples={["b"]} badge="Momentum" />
            <SignalEducationCard title="RSI (Relative Strength Index)" subtitle="Foundation (Reversal)" description="desc" examples={["c"]} badge="Reversal" />
          </div>
        </div>
      </InfoModal>
    );

    expect(screen.getByText('Key Patterns & Signals')).toBeInTheDocument();
    expect(screen.getByText('Key Patterns & Signals')).toBeInTheDocument();
    expect(screen.getByText('Moving Average (MA)')).toBeInTheDocument();

    const grid = container.querySelector('.grid');
    // Ensure the grid container classes exist for responsive layout
    expect(grid).toHaveClass('grid-cols-1');

    // Ensure the card is collapsed by default
    const maCard = screen.getByText('Moving Average (MA)').closest('article');
    expect(maCard).toBeInTheDocument();
    const cardContent = maCard?.querySelector('[data-role="card-content"]') as HTMLElement | null;
    expect(cardContent).toBeInTheDocument();
    expect(cardContent?.getAttribute('data-expanded')).toBe('false');
    expect(cardContent?.getAttribute('aria-hidden')).toBe('true');

    // Content should not be visible by default
    const descElement = maCard?.querySelector('p');
    const exampleElement = maCard?.querySelector('li');
    expect(descElement).not.toBeVisible();
    expect(exampleElement).not.toBeVisible();
    // Chart placeholder present but not visible initially
    const chartEl = within(maCard as HTMLElement).getByTestId('signal-education-chart');
    expect(chartEl).toBeInTheDocument();
    expect(chartEl).not.toBeVisible();

    // Expand first card and assert change
    const toggleBtn = screen.getByRole('button', { name: /Toggle Moving Average/i });
    fireEvent.click(toggleBtn);
    expect(cardContent && cardContent.getAttribute('data-expanded')).toBe('true');
    expect(descElement).toBeVisible();
    expect(exampleElement).toBeVisible();
    expect(cardContent && cardContent.getAttribute('aria-hidden')).toBe('false');
    // Chart should also be visible after expansion
    const chartElAfter = within(maCard as HTMLElement).getByTestId('signal-education-chart');
    expect(chartElAfter).toBeVisible();

    // Assert number of cards matches data file
    const articles = screen.getAllByRole('article');
    expect(articles.length).toBeGreaterThanOrEqual(signalEducationCards.length);
    expect(screen.getByText('MACD Crossover (Bullish)')).toBeInTheDocument();
    expect(screen.getByText('MACD Crossover (Bearish)')).toBeInTheDocument();
    expect(screen.getByText('RSI (Relative Strength Index)')).toBeInTheDocument();

    // Verify the InfoModal vertical alignment is top (content aligns from top)
    const dialog = container.querySelector('[role="dialog"]');
    const contentWrapper = dialog && dialog.querySelector('.flex-1.flex.flex-col');
    expect(contentWrapper).toBeInTheDocument();
    expect(contentWrapper?.className.includes('justify-start')).toBe(true);
    expect(contentWrapper?.className.includes('items-start')).toBe(true);
  });
});
