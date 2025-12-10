"use client";
import React from 'react';
import { Cpu, Eye, Minus, Maximize2 } from 'lucide-react';
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

export const DEV_OVERVIEW_SHORT = `Market sentiment shows mixed signals with tech stocks leading gains while traditional indices remain cautious. Key drivers include AI developments and interest rate expectations.`;

export const DEV_OVERVIEW_LONG = `The global market environment continues to evolve in a complex interplay of macroeconomic variables, sector rotations, and investor sentiment. In the short term, equities have experienced measured gains led by innovation sectors like AI, cloud services, and software providers. These gains have been driven by favorable earnings reports, robust forward guidance, and continued enterprise investment in digital transformation. Nevertheless, the landscape remains heterogeneous: cyclical sectors such as energy, industrials and some financials are demonstrating divergent behavior due to unique supply dynamics, interest-rate sensitivity, and regulatory constraints.

Monetary policy remains central to how investors position portfolios. When central banks shift or signal a policy stance, it re-prices assets across fixed income, cash, equities, and FX—prompting recalibration of discount rates, growth expectations, and yield curves. Importantly, the term structure of interest rates informs relative valuation across sectors; long-duration growth names are sensitive to yield changes, while financials often react asymmetrically to steepening or flattening curves. In practice, monitoring the flow of information and central bank commentary is vital for anticipating rapid repricing events.

Volatility metrics and options market signals are indispensable tools for assessing market health. Changes in implied volatility, term-structure squeezes, and unusual derivative positioning (such as concentrated open interest or pronounced skew) can signal the market’s appetite for risk and hint at potential inflection points. Traders should watch for converging indicators across surface-level breadth, the volume-weighted directional flow, and order book liquidity—especially during macro-data releases and geopolitical events that can change assumptions overnight.

Macroeconomic data continues to surprise on both sides, and it pays to separate noise from sustained trends. Employment, inflation, and consumption figures will shape both sentiment and fundamental expectations. Earnings season provides real-time microeconomic input—guidance changes, margin dynamics and demand signals point toward durable shifts in sector strength. Where possible, triangulate macro prints with micro-level indicators, such as industry-specific surveys and business-cycle measures, for a more robust view.

Risk management and trade construction cannot be overstated. In environments where downside risk is non-trivial, applying rigorous position sizing, layered stop mechanisms, and targeted hedges are essential. Managing the convexity of risk through options, or by constructing multi-legged strategies, can help balance potential returns while limiting downside exposure. For longer-term allocations, diversification across sources of return and uncorrelated strategies aids in reducing vulnerability to single-market shocks.

Cross-asset relationships and international flow dynamics add further complexity. FX movements, commodity changes and cross-border capital flows can alter the relative attractiveness of domestic versus international assets. For example, a strengthening USD often pressures commodity-linked equities and multi-national exporters, while regional policy shifts and tariffs may create idiosyncratic winners and losers. Investors should evaluate correlation matrices across asset classes to understand where dispersion might create trade opportunities or amplify risk.

Sector rotation is a durable theme in many market cycles. Rotations from growth to value or from cyclical to defensive sectors can be driven by re-pricing of rate expectations, momentum shifts, or capital reallocation as macro forecasts update. Identifying the early signals of rotation—such as improving breadth, leadership across mid-caps, and sector-relative strength—can provide an edge. Coupling technical confirmation with a fundamental thesis helps avoid chasing noisy trends.

On the structural side, regulatory and fiscal policy can have long-term consequences for sector profitability and investor behavior. Shifts in tax policy, incentives for certain types of capital expenditures, or regulation that impacts earnings quality can all catalyze multi-period re-rating events. Traders and strategists should interpret headline policy actions through the lens of long-term profitability and capital allocation changes rather than short-term market noise.

Execution and microstructure nuance matters more as stress increases. Large passive flows, ETF rebalances, and concentrated liquidity can amplify moves. When market liquidity thins, modest flows can cause outsized price movement. Practical considerations—such as executing trades across time windows, monitoring market depth, and using limit orders to reduce slippage—help protect returns. For systematic players, the interaction between execution strategy, signal persistence, and slippage must be integral to risk management.

Finally, contingency planning through scenario analysis helps manage surprise events. A robust approach considers multiple macro and market outcomes (e.g., inflation surprise, geopolitical escalation, or a sudden liquidity squeeze) and constructs hedging layers or contingency triggers to respond methodically. In user interfaces, this long-form content is ideal for stress-testing text rendering, UI overflow, typing animations, and accessibility considerations. It should reveal layout boundaries, overflow behaviors, and modal interactions under heavy content conditions, helping ensure a resilient, accessible presentation of long-form market insights.`;

export default function MarketOverview({ pulses, timeframe, onOpenInfo, onStateChange, devOverview }: { pulses: PulseItem[]; timeframe?: 'D'|'W'|'M'|'Y'; onOpenInfo?: () => void; onStateChange?: (s: { loading: boolean; isTyping: boolean }) => void; devOverview?: 'placeholder' | 'long'; }) {
  const [summaryOverview, setSummaryOverview] = React.useState<string | null>(null);
  const [fullSentiment, setFullSentiment] = React.useState<string | null>(null);
  const [displayedOverview, setDisplayedOverview] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  // Track last generated time for each timeframe (D/W/M/Y)
  const [lastGeneratedMap, setLastGeneratedMap] = React.useState<Record<'D'|'W'|'M'|'Y', string | null>>(() => ({ D: null, W: null, M: null, Y: null }));
  // Format the stored ISO timestamp into a readable time + date string
  const formatLastGenerated = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const time = d.toLocaleTimeString();
      // Weekday, mm/dd/yy
      const weekday = d.toLocaleDateString(undefined, { weekday: 'long' });
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      return `${time} (${weekday}, ${mm}/${dd}/${yy})`;
    } catch (e) {
      return new Date(iso).toLocaleString();
    }
  };
  // Info modal is handled by parent; accept onOpenInfo callback
  const typingRef = React.useRef<number | null>(null);
  const [isTyping, setIsTyping] = React.useState(false);
  const [fullSentimentModalOpen, setFullSentimentModalOpen] = React.useState(false);
  const [modalDisplayedText, setModalDisplayedText] = React.useState<string>('');
  const [modalTyping, setModalTyping] = React.useState(false);
  const modalTypingRef = React.useRef<number | null>(null);
  const TYPING_SPEED = 5; // ms per char
  const [collapsed, setCollapsed] = React.useState(false);
  const bodyRef = React.useRef<HTMLDivElement | null>(null);
  const headerTitleRef = React.useRef<HTMLHeadingElement | null>(null);

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
    if (devOverview === 'placeholder') {
      // Use the short dev text
      setLoading(false);
      setSummaryOverview(DEV_OVERVIEW_SHORT);
      setFullSentiment(DEV_OVERVIEW_SHORT);
      // allow the typewriter effect to run by clearing displayedOverview
      setDisplayedOverview('');
      onStateChange?.({ loading: false, isTyping: false });
      const tfKey = (timeframe ?? 'D') as 'D'|'W'|'M'|'Y';
      setLastGeneratedMap((prev) => ({ ...prev, [tfKey]: new Date().toISOString() }));
      return;
    }

    if (devOverview === 'long') {
      setLoading(false);
      setSummaryOverview(DEV_OVERVIEW_LONG);
      setFullSentiment(DEV_OVERVIEW_LONG);
      setDisplayedOverview('');
      onStateChange?.({ loading: false, isTyping: false });
      const tfKey = (timeframe ?? 'D') as 'D'|'W'|'M'|'Y';
      setLastGeneratedMap((prev) => ({ ...prev, [tfKey]: new Date().toISOString() }));
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
    // Mark last generated time for the current timeframe
    const tfKey = (timeframe ?? 'D') as 'D'|'W'|'M'|'Y';
    setLastGeneratedMap((prev) => ({ ...prev, [tfKey]: new Date().toISOString() }));
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
      // Keep displayed text while the modal plays its closing animation; cleanup handled in onAfterClose
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
    <div className={`market-overview-cli bg-black border border-zinc-800 rounded-xl p-4 shadow-sm ${collapsed ? 'collapsed' : ''}`} aria-expanded={!collapsed}>
      <div className="flex items-start justify-between gap-2 cli-header">
        <div className="flex flex-col">
          <h5
            ref={headerTitleRef}
            role="button"
            tabIndex={0}
            aria-controls="market-overview-body"
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((c) => !c)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCollapsed((c) => !c); } }}
            className="market-overview-title text-sm font-bold text-yellow-300 font-mono flex items-center gap-2"
          >
            <Cpu
              data-testid="header-cpu-indicator"
              data-state={loading ? 'loading' : isTyping ? 'typing' : 'idle'}
                    className={`${loading ? 'text-gray-500 animate-pulse' : isTyping ? 'text-cyan-400 animate-pulse' : 'text-cyan-400'} w-5 h-5`}
              aria-hidden
            />
            Market Pulse Overview
            <span className="ai-badge ml-2 px-1 py-0.5 text-[10px] rounded bg-white/5 text-cyan-300 border border-zinc-800 font-mono">AI</span>
          </h5>
          {/* Hint shown when collapsed so user knows how to restore */}
          <div className="maximize-hint text-xs text-gray-400 mt-1" aria-hidden>
            Maximize to see overview
          </div>
          {timeframe && (
              <div className="mt-2 flex flex-col items-start gap-1 market-overview-meta">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-white/5 text-cyan-300 border border-zinc-800">
                  {timeframe === 'D' ? 'In the Last Day' : timeframe === 'W' ? 'In the Last Week' : timeframe === 'M' ? 'In the Last Month' : 'In the Last Year'}
                </span>
              </div>
              <div data-testid="last-generated-label" className="text-xs text-gray-500 dark:text-gray-400">{lastGeneratedMap[timeframe as 'D'|'W'|'M'|'Y'] ? `Last generated @ ${formatLastGenerated(lastGeneratedMap[timeframe as 'D'|'W'|'M'|'Y'] as string)}` : ''}</div>
            </div>
          )}
        </div>
          <div className="header-controls flex items-center gap-2">
          {/* Header area: extra controls (info managed by parent) */}
          <button
            type="button"
            aria-label={collapsed ? 'Open Market Overview' : 'Minimize Market Overview'}
            aria-expanded={!collapsed}
            aria-controls="market-overview-body"
            title={collapsed ? 'Open' : 'Minimize'}
            className="collapse-toggle ml-2 p-1 rounded text-gray-300 hover:bg-zinc-800 focus:outline-none focus:ring"
            onClick={() => setCollapsed((c) => !c)}
            data-testid="market-overview-collapse"
          >
            {collapsed ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          </button>
        </div>
        <span className="cli-close-anim" aria-hidden />
      </div>

      <div ref={bodyRef} id="market-overview-body" className="market-overview-body mt-3">
        <p className="text-sm text-gray-300" aria-live="polite">
          {/* Placeholder (loading) element with fade */}
          <span
            className={`inline-flex items-center gap-2 overflow-hidden transition-all duration-200 ease-out ${loading && displayedOverview.length === 0 ? 'h-auto w-auto opacity-100' : 'h-0 w-0 opacity-0'}`}
            aria-hidden={!loading}
          >
            {loading && (
              <span data-testid="loading-dot" aria-hidden className="relative inline-flex mr-2 h-3 w-3 align-middle">
                <span className="absolute inline-flex h-3 w-3 rounded-full bg-cyan-400/70 opacity-70 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
              </span>
            )}
            Generating Market Overview…
          </span>
          {/* Displayed overview (typing) element with fade */}
            <span className={`inline-block transition-opacity duration-200 ease-out whitespace-pre-line break-words ${displayedOverview.length > 0 ? 'opacity-100' : 'opacity-0'}`}>
              {/* Typewriter dot (green) — reserved space with padding to prevent layout shift */}
            
              {/* Display overlay text */}
              <span className="inline-block pl-0 lg:text-lg text-gray-200">{displayedOverview}</span>
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
            className="view-sentiment-btn px-3 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-white transition-colors flex items-center gap-1"
            onClick={() => setFullSentimentModalOpen(true)}
            aria-label="View full sentiment analysis"
          >
            <Eye className="w-3 h-3" />
            View Full Sentiment
          </button>
          <button
            type="button"
            title="Regenerate Overview"
            className="regenerate-btn px-3 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
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
        verticalAlign="top"
        title={
          <>
            <Eye className="w-6 h-6" />
            Full Sentiment Analysis
          </>
        }
        ariaLabel="Full sentiment analysis modal"
        onAfterClose={() => {
          // clear modal typing text only after animation ends and modal is fully closed
          if (modalTypingRef.current) {
            clearInterval(modalTypingRef.current);
            modalTypingRef.current = null;
          }
          setModalDisplayedText('');
          setModalTyping(false);
        }}
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
