import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CollapsibleSection from '@/components/ui/CollapsibleSection';

// Mock timers for animation testing
jest.useFakeTimers();

describe('CollapsibleSection', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test('toggles open/closed state via button aria-label', () => {
    render(
      <CollapsibleSection
        title={<span>Test Title</span>}
        infoButton={<button aria-label="info-btn">i</button>}
      >
        <div>Collapsible Content</div>
      </CollapsibleSection>
    );

    // Content visible initially
    const contentNode = screen.getByText('Collapsible Content');
    expect(contentNode).toBeInTheDocument();

    // Initially should show "Collapse section" aria-label (open state)
    const toggleButton = screen.getByLabelText('Collapse section');
    expect(toggleButton).toBeInTheDocument();

    // Click toggle to collapse
    fireEvent.click(toggleButton);

    // Fast-forward animation duration (350ms + buffer)
    act(() => {
      jest.advanceTimersByTime(400);
    });

    // After animation, aria-label should change to "Expand section"
    expect(screen.getByLabelText('Expand section')).toBeInTheDocument();
  });

  test('clicking info button does not toggle collapse', () => {
    render(
      <CollapsibleSection
        title={<span>Test Title</span>}
        infoButton={<button aria-label="info-btn">i</button>}
      >
        <div>Collapsible Content</div>
      </CollapsibleSection>
    );

    const contentNode = screen.getByText('Collapsible Content');
    const contentWrapper = contentNode.parentElement as HTMLElement;
    expect(contentWrapper.style.display === 'none').toBe(false);

    const infoButton = screen.getByLabelText('info-btn');
    fireEvent.click(infoButton);

    // Should remain visible
    expect(contentWrapper.style.display === 'none').toBe(false);
  });

  test('openKey change triggers onOpenChange callback', () => {
    const onOpenChange = jest.fn();
    const { rerender } = render(
      <CollapsibleSection
        title={<span>Test Title</span>}
        infoButton={<button aria-label="info-btn">i</button>}
        defaultOpen={false}
        openKey={'D'}
        onOpenChange={onOpenChange}
      >
        <div>Collapsible Content</div>
      </CollapsibleSection>
    );

    // Initially closed - should show "Expand section"
    expect(screen.getByLabelText('Expand section')).toBeInTheDocument();
    
    // Clear any initial calls
    onOpenChange.mockClear();

    // Change the openKey to simulate timeframe change
    rerender(
      <CollapsibleSection
        title={<span>Test Title</span>}
        infoButton={<button aria-label="info-btn">i</button>}
        defaultOpen={false}
        openKey={'W'}
        onOpenChange={onOpenChange}
      >
        <div>Collapsible Content</div>
      </CollapsibleSection>
    );

    // onOpenChange should have been called with true
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});
