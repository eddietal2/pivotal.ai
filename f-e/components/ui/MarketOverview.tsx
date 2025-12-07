"use client";
import React from 'react';
import { Cpu, Eye } from 'lucide-react';
import InfoModal from '../modals/InfoModal';
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

async function generateAiOverview(_pulses: PulseItem[], timeframe: 'D'|'W'|'M'|'Y' = 'D') {
  // For development: return timeframe-specific placeholder messages
  const timeframeLabels = {
    D: 'daily',
    W: 'weekly',
    M: 'monthly',
    Y: 'yearly'
  };

  const timeframeContext = timeframeLabels[timeframe];

  const summary = `Market sentiment shows mixed signals with tech stocks leading gains while traditional indices remain cautious. Key drivers include AI developments and interest rate expectations. (Based on ${timeframeContext} data)`;

  const fullSentiment = `Market overview placeholder for ${timeframeContext} analysis; use this text to prototype and test the UI. This ${timeframeContext} sentiment analysis provides deeper insights into market psychology, technical indicators, and fundamental factors driving current price movements. It includes detailed analysis of sector rotations, institutional positioning, and macroeconomic influences that may not be immediately apparent from surface-level price action. This comprehensive view helps traders understand the broader context behind ${timeframeContext} market fluctuations and identify potential turning points in market sentiment.

The ${timeframeContext} market sentiment analysis delves into multiple layers of market dynamics, examining both quantitative and qualitative factors that influence price movements. Technical analysis reveals key support and resistance levels, while fundamental analysis considers earnings reports, economic indicators, and geopolitical events. Institutional positioning shows significant accumulation in defensive sectors, suggesting a risk-off mentality among large investors.

Sector rotation analysis indicates a shift towards technology and healthcare stocks, with energy and financials showing relative weakness. This rotation may be driven by expectations of interest rate cuts and renewed focus on growth-oriented companies. The analysis also considers market breadth indicators, which show improving participation across market caps, though large-cap stocks continue to lead.

Sentiment indicators, including put/call ratios, volatility indices, and investor surveys, point to cautious optimism rather than exuberance. This balanced sentiment suggests room for upside potential while acknowledging potential downside risks from economic uncertainty. The comprehensive sentiment model incorporates machine learning algorithms that analyze news sentiment, social media trends, and trading patterns to provide a holistic view of market psychology.

Furthermore, the analysis examines intermarket relationships, including correlations between equities, bonds, commodities, and currencies. Current data shows weakening correlations, which could indicate increasing market segmentation and the potential for more idiosyncratic stock performance. This environment favors active stock selection over passive index investing.

Risk assessment includes evaluation of tail risks, such as unexpected economic data releases or geopolitical tensions that could trigger market volatility. The model also considers liquidity conditions, with current tight spreads suggesting efficient markets but potential vulnerability to sudden shocks.

In conclusion, the full ${timeframeContext} sentiment analysis provides traders and investors with a comprehensive framework for understanding market dynamics, enabling more informed decision-making in an increasingly complex financial landscape. This detailed perspective goes beyond surface-level price action to uncover the underlying drivers of market behavior and sentiment shifts.`;
  // Keep simulated latency for UI timing
  await new Promise((r) => setTimeout(r, 600));
  return { summary, fullSentiment };
}

export default function MarketOverview({ pulses, timeframe, onOpenInfo, onStateChange }: { pulses: PulseItem[]; timeframe?: 'D'|'W'|'M'|'Y'; onOpenInfo?: () => void; onStateChange?: (s: { loading: boolean; isTyping: boolean }) => void; }) {
  const [summaryOverview, setSummaryOverview] = React.useState<string | null>(null);
  const [fullSentiment, setFullSentiment] = React.useState<string | null>(null);
  const [displayedOverview, setDisplayedOverview] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  // Info modal is handled by parent; accept onOpenInfo callback
  const typingRef = React.useRef<number | null>(null);
  const [isTyping, setIsTyping] = React.useState(false);
  const [fullSentimentModalOpen, setFullSentimentModalOpen] = React.useState(false);
  const [modalDisplayedText, setModalDisplayedText] = React.useState<string>('');
  const [modalTyping, setModalTyping] = React.useState(false);
  const modalTypingRef = React.useRef<number | null>(null);
  const TYPING_SPEED = 5; // ms per char

  const regenerate = React.useCallback(async () => {
    // cancel any current typing
    if (typingRef.current) {
      clearInterval(typingRef.current);
      typingRef.current = null;
    }
    // If there are no pulses to generate from, set a small message and avoid a fake generation
    if (!pulses || pulses.length === 0) {
      setDisplayedOverview('No data available for the selected timeframe.');
      setSummaryOverview('No data available for the selected timeframe.');
      setFullSentiment('No data available for the selected timeframe.');
      setLoading(false);
      onStateChange?.({ loading: false, isTyping: false });
      return;
    }
    setLoading(true);
    onStateChange?.({ loading: true, isTyping: false });
    setDisplayedOverview('');
    const result = await generateAiOverview(pulses, timeframe);
    setSummaryOverview(result.summary);
    setFullSentiment(result.fullSentiment);
    setLoading(false);
    onStateChange?.({ loading: false, isTyping: false });
  }, [pulses, timeframe]);

  React.useEffect(() => {
    // generate initial overview on mount and whenever pulses or timeframe change
    regenerate();
  }, [regenerate]);

  // No external regenerate trigger; user can regenerate using the in-content button

  // Start typewriter whenever summaryOverview changes
  React.useEffect(() => {
    const text = summaryOverview;
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
  }, [summaryOverview]);

  // Modal typewriter effect
  React.useEffect(() => {
    if (!fullSentimentModalOpen || !fullSentiment) {
      setModalDisplayedText('');
      setModalTyping(false);
      return;
    }

    // cancel any previous modal typing
    if (modalTypingRef.current) {
      clearInterval(modalTypingRef.current);
      modalTypingRef.current = null;
    }

    setModalDisplayedText('');
    let i = 0;
    setModalTyping(true);
    modalTypingRef.current = window.setInterval(() => {
      i += 1;
      setModalDisplayedText(fullSentiment.slice(0, i));
      if (i >= fullSentiment.length) {
        if (modalTypingRef.current) {
          clearInterval(modalTypingRef.current);
          modalTypingRef.current = null;
        }
        setModalTyping(false);
      }
    }, TYPING_SPEED);

    return () => {
      if (modalTypingRef.current) {
        clearInterval(modalTypingRef.current);
        modalTypingRef.current = null;
      }
      setModalTyping(false);
    };
  }, [fullSentimentModalOpen, fullSentiment]);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm dark:shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <h5 className="text-sm font-bold text-gray-900 dark:text-gray-200 flex items-center gap-2">
            <Cpu
              data-testid="header-cpu-indicator"
              data-state={loading ? 'loading' : isTyping ? 'typing' : 'idle'}
              className={`${loading ? 'text-gray-500 dark:text-gray-400 animate-pulse' : isTyping ? 'text-orange-600 dark:text-orange-300 animate-pulse' : 'text-green-600 dark:text-green-300'} w-5 h-5`}
              aria-hidden
            />
            AI Market Overview
            {timeframe && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700">
                {timeframe === 'D' ? 'In the Last Day' : timeframe === 'W' ? 'In the Last Week' : timeframe === 'M' ? 'In the Last Month' : 'In the Last Year'}
              </span>
            )}
          </h5>
        </div>
        <div className="flex items-center gap-2">
          {/* Header area: extra controls (info managed by parent) */}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-sm text-gray-700 dark:text-gray-300" aria-live="polite">
          {/* Placeholder (loading) element with fade */}
          <span
            className={`inline-flex items-center gap-2 overflow-hidden transition-all duration-200 ease-out ${loading && displayedOverview.length === 0 ? 'h-auto w-auto opacity-100' : 'h-0 w-0 opacity-0'}`}
            aria-hidden={!loading}
          >
            {loading && (
              <span data-testid="loading-dot" aria-hidden className="relative inline-flex mr-2 h-3 w-3 align-middle">
                <span className="absolute inline-flex h-3 w-3 rounded-full bg-gray-400/70 dark:bg-gray-500/70 opacity-70 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500" />
              </span>
            )}
            Generating Market Overview…
          </span>
          {/* Displayed overview (typing) element with fade */}
            <span className={`inline-block transition-opacity duration-200 ease-out ${displayedOverview.length > 0 ? 'opacity-100' : 'opacity-0'}`}>
              {/* Typewriter dot (green) — reserved space with padding to prevent layout shift */}
            
              {/* Display overlay text */}
              <span className="inline-block pl-0 text-gray-900 dark:text-gray-100">{displayedOverview}</span>
            {/* caret while typing */}
            {displayedOverview.length < (summaryOverview?.length ?? 0) && (
              <span data-testid="type-caret" aria-hidden className="ml-1 typewriter-caret text-gray-900 dark:text-gray-100">|</span>
            )}
          </span>
        </p>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            title="View Full Sentiment Analysis"
            className="px-3 py-1 text-xs rounded bg-gray-600 hover:bg-gray-700 text-white transition-colors flex items-center gap-1"
            onClick={() => setFullSentimentModalOpen(true)}
            aria-label="View full sentiment analysis"
          >
            <Eye className="w-3 h-3" />
            View Full Sentiment
          </button>
          <button
            type="button"
            title="Regenerate Overview"
            className="px-3 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
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

      {/* Full Sentiment Modal */}
      <InfoModal
        open={fullSentimentModalOpen}
        onClose={() => setFullSentimentModalOpen(false)}
        title={
          <>
            <Eye className="w-6 h-6" />
            Full Sentiment Analysis
          </>
        }
        ariaLabel="Full sentiment analysis modal"
      >
        <div className="max-w-4xl mx-auto">
          {timeframe && (
            <div className="mb-4 flex justify-start">
              <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700">
                {timeframe === 'D' ? 'Sentiment of the Last Day' : timeframe === 'W' ? 'Sentiment of the Last Week' : timeframe === 'M' ? 'Sentiment of the Last Month' : 'Sentiment of the Last Year'}
              </span>
            </div>
          )}
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {modalDisplayedText || 'No full sentiment analysis available.'}
            {modalTyping && modalDisplayedText.length < (fullSentiment?.length ?? 0) && (
              <span data-testid="modal-type-caret" aria-hidden className="ml-1 typewriter-caret text-gray-700 dark:text-gray-300">|</span>
            )}
          </p>
        </div>
      </InfoModal>

      {/* InfoModal moved to parent */}
    </div>
  );
}
