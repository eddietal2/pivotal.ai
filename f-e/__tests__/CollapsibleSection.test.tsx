import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CollapsibleSection from '@/components/ui/CollapsibleSection';

describe('CollapsibleSection', () => {
  test('toggles open/closed and triggers transitionend on content', () => {
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
    // get the content wrapper
    const contentWrapper = contentNode.parentElement as HTMLElement;
    expect(contentWrapper).toBeTruthy();
    expect(contentWrapper.style.display === 'none').toBe(false);

    // Click toggle to collapse
    const toggleButton = screen.getByLabelText('Collapse section');
    fireEvent.click(toggleButton);

    // Simulate transitionend with propertyName: 'height'
    const te: any = new Event('transitionend');
    te.propertyName = 'height';
    contentWrapper.dispatchEvent(te);

    expect(contentWrapper.style.display).toBe('none');
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
});
