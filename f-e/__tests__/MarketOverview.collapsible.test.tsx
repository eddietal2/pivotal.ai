import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '@/app/home/page';

describe('MarketOverview collapsible behavior', () => {
  test('MarketOverview hides when Market Pulse is collapsed', () => {
    render(<App />);
    // Overview should be visible initially
    expect(screen.getByText('Market Pulse Overview')).toBeInTheDocument();
    // Get the toggle button for Market Pulse (use the header text's closest button)
    const headerButton = screen.getByText('Market Pulse').closest('button');
    expect(headerButton).toBeTruthy();
    // Collapse the Market Pulse section
    fireEvent.click(headerButton as HTMLElement);
    // Now the Market Overview should not be in the document
    expect(screen.queryByText('Market Pulse Overview')).not.toBeInTheDocument();
  });

  // Pin behavior removed; no test for pinning necessary

  test('Overview modal opens from header when section is collapsed', () => {
    render(<App />);
    // Collapse the section
    const headerButton = screen.getByText('Market Pulse').closest('button');
    fireEvent.click(headerButton as HTMLElement);
    // Verify MarketOverview is collapsed
    expect(screen.queryByText('Market Pulse Overview')).not.toBeInTheDocument();
    // Click header overview info button and assert modal opens with combined content
    const overviewInfoBtn = screen.getByTestId('overview-info-btn');
    fireEvent.click(overviewInfoBtn);
    expect(screen.getByText('Market Overview Details')).toBeInTheDocument();
    // Combined modal should also show Market Pulse info
    expect(screen.getByText('About Market Pulse')).toBeInTheDocument();
    // Modal CPU indicator should be rendered
    expect(screen.getByTestId('modal-cpu-indicator')).toBeInTheDocument();
  });

  test('Regenerate button triggers MarketOverview regeneration', async () => {
    jest.useFakeTimers();
    render(<App />);
    // Wait for initial generation to complete
    act(() => jest.advanceTimersByTime(2600));
    // Click in-content Regenerate button inside the Market Overview component
    const inContentRegenerateBtn = screen.getByLabelText('Regenerate market overview');
    expect(inContentRegenerateBtn).toBeInTheDocument();
    fireEvent.click(inContentRegenerateBtn);
    // After clicking, the MarketOverview should show a loading-dot for the new generation
    const loadingDot = screen.getByTestId('loading-dot');
    expect(loadingDot).toBeInTheDocument();
    // Header CPU should be in loading state during regeneration
    const headerCpu = screen.getByTestId('header-cpu-indicator');
    expect(headerCpu).toHaveAttribute('data-state', 'loading');
    // Fast-forward generation delay and initial typing
    act(() => jest.advanceTimersByTime(600));
    // Typewriter should begin (caret visible)
    expect(screen.getByTestId('type-caret')).toBeInTheDocument();
    // Finish typing
    act(() => jest.advanceTimersByTime(2000));
    expect(screen.queryByTestId('type-caret')).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  // Note: Default expand / defaultOpen toggle removed from UI; no test required
});
