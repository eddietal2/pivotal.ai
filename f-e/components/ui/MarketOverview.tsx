"use client";
import React from 'react';
import { Cpu } from 'lucide-react';
// Info icon removed; parent will render info button/modal

type PulseItem = {
  index: string;
  value: number;
  change: string;
  color: string;
  trend?: number[];
  timeframe?: string;
  afterHours?: boolean;
};

async function generateAiOverview(_pulses: PulseItem[]) {
  // For development: return a static placeholder message (deterministic)
  const overlay = 'Market overview placeholder; use this text to prototype and test the UI. This placeholder repeats the same value for development.';
  // Keep simulated latency for UI timing
  await new Promise((r) => setTimeout(r, 600));
  return overlay;
}

export default function MarketOverview({ pulses, onOpenInfo, onStateChange }: { pulses: PulseItem[]; onOpenInfo?: () => void; onStateChange?: (s: { loading: boolean; isTyping: boolean }) => void; }) {
  const [fullOverview, setFullOverview] = React.useState<string | null>(null);
  const [displayedOverview, setDisplayedOverview] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  // Info modal is handled by parent; accept onOpenInfo callback
  const typingRef = React.useRef<number | null>(null);
  const [isTyping, setIsTyping] = React.useState(false);
  const TYPING_SPEED = 20; // ms per char

  const regenerate = React.useCallback(async () => {
    // cancel any current typing
    if (typingRef.current) {
      clearInterval(typingRef.current);
      typingRef.current = null;
    }
    setLoading(true);
    onStateChange?.({ loading: true, isTyping: false });
    setDisplayedOverview('');
    const text = await generateAiOverview(pulses);
    setFullOverview(text);
    setLoading(false);
    onStateChange?.({ loading: false, isTyping: false });
  }, [pulses]);

  React.useEffect(() => {
    // generate initial overview on mount
    regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // No external regenerate trigger; user can regenerate using the in-content button

  // Start typewriter whenever fullOverview changes
  React.useEffect(() => {
    const text = fullOverview;
    if (!text) return;
    // cancel any previous
    if (typingRef.current) {
      clearInterval(typingRef.current);
      typingRef.current = null;
    }
    setDisplayedOverview('');
    let i = 0;
    setIsTyping(true);
    onStateChange?.({ loading: false, isTyping: true });
    typingRef.current = window.setInterval(() => {
      i += 1;
      setDisplayedOverview(text.slice(0, i));
      if (i >= text.length) {
        if (typingRef.current) {
          clearInterval(typingRef.current);
          typingRef.current = null;
        }
        setIsTyping(false);
        onStateChange?.({ loading: false, isTyping: false });
      }
    }, TYPING_SPEED);
    return () => {
      if (typingRef.current) {
        clearInterval(typingRef.current);
        typingRef.current = null;
      }
      setIsTyping(false);
      onStateChange?.({ loading: false, isTyping: false });
    };
  }, [fullOverview]);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <h5 className="text-sm font-bold text-gray-200 flex items-center gap-2">
            <Cpu
              data-testid="header-cpu-indicator"
              data-state={loading ? 'loading' : isTyping ? 'typing' : 'idle'}
              className={`${loading ? 'text-gray-400 animate-pulse' : isTyping ? 'text-orange-300 animate-pulse' : 'text-green-300'} w-5 h-5`}
              aria-hidden
            />
            AI Summary of Market Sentiment
          </h5>
        </div>
        <div className="flex items-center gap-2">
          {/* Header area: extra controls (info managed by parent) */}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-sm text-gray-300" aria-live="polite">
          {/* Placeholder (loading) element with fade */}
          <span
            className={`inline-flex items-center gap-2 overflow-hidden transition-all duration-200 ease-out ${loading && displayedOverview.length === 0 ? 'h-auto w-auto opacity-100' : 'h-0 w-0 opacity-0'}`}
            aria-hidden={!loading}
          >
            {loading && (
              <span data-testid="loading-dot" aria-hidden className="relative inline-flex mr-2 h-3 w-3 align-middle">
                <span className="absolute inline-flex h-3 w-3 rounded-full bg-gray-400 opacity-60 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gray-400" />
              </span>
            )}
            Generating Market Overview…
          </span>
          {/* Displayed overview (typing) element with fade */}
            <span className={`inline-block transition-opacity duration-200 ease-out ${displayedOverview.length > 0 ? 'opacity-100' : 'opacity-0'}`}>
              {/* Typewriter dot (green) — reserved space with padding to prevent layout shift */}
            
              {/* Display overlay text */}
              <span className="inline-block pl-0">{displayedOverview}</span>
            {/* caret while typing */}
            {displayedOverview.length < (fullOverview?.length ?? 0) && (
              <span data-testid="type-caret" aria-hidden className="ml-1 typewriter-caret">|</span>
            )}
          </span>
        </p>
        </div>
        <div className="mt-4">
          <button
            type="button"
            title="Regenerate Overview"
            className="px-3 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-700 transition-colors"
            onClick={regenerate}
            aria-label="Regenerate market overview"
          >
            {loading ? 'Regenerating…' : 'Regenerate'}
          </button>
        </div>
      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 0 }
          50% { opacity: 1 }
        }
        .typewriter-caret {
          animation: blink 1s step-end infinite;
        }
      `}</style>

      {/* InfoModal moved to parent */}
    </div>
  );
}
