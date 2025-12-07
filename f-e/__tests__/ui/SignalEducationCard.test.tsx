import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, within } from '@testing-library/react';
import SignalEducationCard from '@/components/ui/SignalEducationCard';

describe('SignalEducationCard', () => {
  test('renders title, subtitle, description and list items', () => {
    render(
      <SignalEducationCard
        title="Moving Average (MA)"
        subtitle="Foundation (Trend)"
        description="The Pullback Entry: price dips back to a moving average and then shows a strong bounce."
        examples={["20/50 EMA alignment", "Bounce/reversal candle at MA"]}
        badge="Trend"
      />
    );

    expect(screen.getByText('Moving Average (MA)')).toBeInTheDocument();
    expect(screen.getByText('Foundation (Trend)')).toBeInTheDocument();
    // Description, examples, and the chart are present but not visible by default (collapsible)
    const descEl = screen.getByText(/The Pullback Entry/i);
    expect(descEl).not.toBeVisible();
    const exampleEl = screen.getByText('20/50 EMA alignment');
    expect(exampleEl).not.toBeVisible();
    // Chart placeholder is in the content but hidden initially
    const content = screen.getByTestId('card-content-Moving-Average-(MA)');
    const chart = within(content).getByTestId('signal-education-chart');
    expect(chart).toBeInTheDocument();
    expect(chart).not.toBeVisible();
    expect(screen.queryByText('Bounce/reversal candle at MA')).not.toBeInTheDocument();
    expect(screen.getByText('Trend')).toBeInTheDocument();

    // Clicking the toggle should expand the card and show description & list items
    const toggle = screen.getByRole('button', { name: /Toggle Moving Average/i });
    // aria-controls references content id
    // aria-controls references content id
    // const content = screen.getByTestId('card-content-Moving-Average-(MA)');
    expect(toggle).toHaveAttribute('aria-controls', content.getAttribute('id'));
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(content).toHaveAttribute('data-expanded', 'true');
    expect(content).toHaveAttribute('aria-hidden', 'false');
    expect(screen.getByText(/The Pullback Entry/i)).toBeVisible();
    expect(screen.getByText('20/50 EMA alignment')).toBeVisible();
    expect(screen.getByText('20/50 EMA alignment')).toBeInTheDocument();
    // Chart should now be visible too
    const chartAfter = within(content).getByTestId('signal-education-chart');
    expect(chartAfter).toBeVisible();
  });
});
