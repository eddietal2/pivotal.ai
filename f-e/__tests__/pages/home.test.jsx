import React from 'react';
import '@testing-library/jest-dom'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import { ThemeProvider } from '../../components/context/ThemeContext'
import { ToastProvider } from '@/components/context/ToastContext'
import { UIProvider } from '@/components/context/UIContext'
import { PaperTradingProvider } from '@/components/context/PaperTradingContext'
import App from '@/app/home/page'

// Mock next/navigation to provide router context
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => '/home',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock heavy animations/components to keep tests deterministic
jest.mock('@/components/ui/CandleStickAnim', () => () => <div data-testid="candlestick">CandleStick</div>);
jest.mock('@/components/home/PivyChatCard', () => (props) => <div data-testid="pivy-chat-card">Pivy Chat - {props.title || ''}</div>);

// Stub fetch globally so mount effects don't fail
beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ json: async () => ({}) });
});

describe('Home page (/app/home/page)', () => {
  afterEach(() => {
    // Clean up DOM and mocks
    cleanup();
    jest.resetAllMocks();
  });

  test('renders Pivy Chat section and Learn more link', async () => {
    render(
      <ThemeProvider>
        <ToastProvider>
          <UIProvider>
            <PaperTradingProvider>
              <App />
            </PaperTradingProvider>
          </UIProvider>
        </ToastProvider>
      </ThemeProvider>
    );

    // Header for Pivy Chat
    expect(await screen.findByText("Today's Pivy Chat")).toBeInTheDocument();

    // Learn more about Pivy Chat link should exist and point to the right href
    const learnMoreLink = screen.getByRole('link', { name: /Learn more about Pivy Chat/i });
    expect(learnMoreLink).toBeInTheDocument();
    expect(learnMoreLink).toHaveAttribute('href', '/pivy?drawer=open&about=open');
  });

  test('Live Setup Scans section renders and info modal opens', async () => {
    render(
      <ThemeProvider>
        <ToastProvider>
          <UIProvider>
            <PaperTradingProvider>
              <App />
            </PaperTradingProvider>
          </UIProvider>
        </ToastProvider>
      </ThemeProvider>
    );

    // Section title present inside the collapse button (disambiguate duplicate text nodes)
    const collapseBtn = screen.getByRole('button', { name: /Collapse section/i });
    expect(within(collapseBtn).getByText(/Live Setup Scans/)).toBeInTheDocument();

    // Timeframe buttons (D/W/M/Y) are present in the header info area
    const dBtn = screen.getByRole('button', { name: /Show D timeframe/i });
    const wBtn = screen.getByRole('button', { name: /Show W timeframe/i });
    expect(dBtn).toBeInTheDocument();
    expect(wBtn).toBeInTheDocument();

    // D should be pressed by default
    expect(dBtn).toHaveAttribute('aria-pressed', 'true');
    expect(wBtn).toHaveAttribute('aria-pressed', 'false');

    // Click on W to change timeframe (this updates aria-pressed state)
    fireEvent.click(wBtn);
    expect(wBtn).toHaveAttribute('aria-pressed', 'true');

    // Click the 'Learn more about Live Setup Scans' button to open its InfoModal
    const learnMoreBtn = screen.getByRole('button', { name: /Learn more about Live Setup Scans/i });
    fireEvent.click(learnMoreBtn);

    // Modal content should be visible (scope queries to the dialog to avoid duplicate text matches)
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    const dialogWithin = within(dialog);
    expect(dialogWithin.getByRole('heading', { name: /About Live Setup Scans/i })).toBeInTheDocument();
    expect(dialogWithin.getByText(/What is the Live Setup Scans Feed\?/i)).toBeInTheDocument();
  });
});

