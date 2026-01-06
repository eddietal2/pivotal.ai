"use client";
import React from 'react';
import { Cpu, Eye, Minus, Maximize2, Mic, Play, Pause, RefreshCw, X } from 'lucide-react';
import InfoModal from '../modals/InfoModal';
import { useToast } from '@/components/context/ToastContext';
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

export default function MarketOverview({ pulses, timeframe, onOpenInfo, onStateChange, devOverview, onVoiceToggle }: { pulses: PulseItem[]; timeframe?: 'D'|'W'|'M'|'Y'; onOpenInfo?: () => void; onStateChange?: (s: { loading: boolean; isTyping: boolean }) => void; devOverview?: 'placeholder' | 'long'; onVoiceToggle?: (active: boolean) => void; }) {
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
      const weekday = d.toLocaleDateString(undefined, { weekday: 'long' });
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      return `${time} (${weekday}, ${mm}/${dd}/${yy})`;
    } catch (e) {
      return new Date(iso).toLocaleString();
    }
  };
  // Voice selection moved to Settings -> Preferences -> Market Overview Voice
  const typingRef = React.useRef<number | null>(null);
  const [isTyping, setIsTyping] = React.useState(false);
  const TYPING_SPEED = 5; // ms per char
  const [collapsed, setCollapsed] = React.useState(false);
  const [fullscreenOpen, setFullscreenOpen] = React.useState(false);
  const bodyRef = React.useRef<HTMLDivElement | null>(null);
  const headerTitleRef = React.useRef<HTMLHeadingElement | null>(null);
  const { showToast } = useToast();
  const [voiceActive, setVoiceActive] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const voiceUtteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);
  const audioCtxRef = React.useRef<AudioContext | null>(null);

  // Try to speak text immediately (preferred during a user gesture click for browser autoplay rules)
  const trySpeakNow = (text: string, voiceName?: string | null) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text || text.length === 0) return;
    try {
      // Cancel any existing speech
      try { window.speechSynthesis.cancel(); } catch (_) { /* ignore */ }
      // Clear any existing fallback interval
      try { if (fallbackIntervalRef.current) { clearInterval(fallbackIntervalRef.current); fallbackIntervalRef.current = null; } } catch (_) { /* ignore */ }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = navigator.language ?? 'en-US';
      utterance.rate = 1.0; utterance.pitch = 1.0; utterance.volume = 1.0;
      // Try to pick a voice immediately
      try {
        const vlist = window.speechSynthesis.getVoices();
        voicesRef.current = vlist;
        if (vlist && vlist.length > 0) setVoices(vlist);
        // Prefer user-selected voice (by name), fallback to language match, then first
        let chosenVoice: SpeechSynthesisVoice | undefined = undefined;
        const preferName = voiceName ?? selectedVoiceName;
        if (preferName) {
          chosenVoice = vlist.find(v => v.name === preferName);
        }
        const lang = navigator.language ?? 'en-US';
        if (!chosenVoice) chosenVoice = vlist.find(v => v.lang && v.lang.includes(lang));
        if (!chosenVoice && vlist.length > 0) chosenVoice = vlist[0];
        if (chosenVoice) {
          utterance.voice = chosenVoice;
          // store/display only the voice name
          setSelectedVoiceName(chosenVoice.name);
          try { window.localStorage.setItem('mkt_overview_selected_voice', chosenVoice.name); } catch (_) { /* ignore */ }
        }
      } catch (err) { /* ignore */ }
        utterance.onstart = () => {
        setSpeaking(true);
        setIsPaused(false);
        setSpokenCharIndex(null);
        utteranceTextRef.current = text;
        hasBoundaryRef.current = false;
        utteranceStartTimeRef.current = Date.now();
        currentFallbackIndexRef.current = 0;
        lastUpdatedIndexRef.current = null;
        pauseUntilRef.current = null;
        isPausingRef.current = false;
        try {
          if (fallbackIntervalRef.current) { clearInterval(fallbackIntervalRef.current); fallbackIntervalRef.current = null; }
          fallbackIntervalRef.current = window.setInterval(() => {
            try {
              if (hasBoundaryRef.current) return;
              if (isPausingRef.current) {
                if (pauseUntilRef.current && Date.now() > pauseUntilRef.current) {
                  isPausingRef.current = false;
                  pauseUntilRef.current = null;
                } else {
                  // Stay at current index
                  setSpokenCharIndex(currentFallbackIndexRef.current);
                  return;
                }
              }
              currentFallbackIndexRef.current = Math.min((utteranceTextRef.current?.length || 0) - 1, currentFallbackIndexRef.current + 1);
              const estIndex = currentFallbackIndexRef.current;
              if (utteranceTextRef.current && utteranceTextRef.current[estIndex] && utteranceTextRef.current[estIndex].match(/[.,!?]/) && !hasBoundaryRef.current) {
                isPausingRef.current = true;
                pauseUntilRef.current = Date.now() + BOUNDARY_PAUSE_THRESHOLD;
                lastUpdatedIndexRef.current = estIndex;
              }
              setSpokenCharIndex(estIndex);
            } catch (_) { /* ignore */ }
          }, 40);
        } catch (_) { /* ignore */ }
        try { showToast?.(`Speaking Market Overview (${utterance.voice?.name ?? 'Default'})`, 'info'); } catch (_) {}
      };
      utterance.onend = () => {
        setSpeaking(false);
        setVoiceActive(false);
        setIsPaused(false);
        setSpokenCharIndex(null);
        utteranceTextRef.current = null;
        utteranceStartTimeRef.current = null;
        hasBoundaryRef.current = false;
        lastUpdatedIndexRef.current = null;
        pauseUntilRef.current = null;
        currentFallbackIndexRef.current = 0;
        isPausingRef.current = false;
        if (fallbackIntervalRef.current) { clearInterval(fallbackIntervalRef.current); fallbackIntervalRef.current = null; }
        try { onVoiceToggle?.(false); } catch (_) {}
      };
      utterance.onerror = () => {
        setSpeaking(false);
        setVoiceActive(false);
        setIsPaused(false);
        setSpokenCharIndex(null);
        utteranceTextRef.current = null;
        utteranceStartTimeRef.current = null;
        hasBoundaryRef.current = false;
        lastUpdatedIndexRef.current = null;
        pauseUntilRef.current = null;
        currentFallbackIndexRef.current = 0;
        isPausingRef.current = false;
        if (fallbackIntervalRef.current) { clearInterval(fallbackIntervalRef.current); fallbackIntervalRef.current = null; }
        try { onVoiceToggle?.(false); } catch (_) {}
      };
      utterance.onpause = () => { setIsPaused(true); };
      utterance.onresume = () => { setIsPaused(false); };
      utterance.onboundary = (e: any) => {
        try {
          hasBoundaryRef.current = true;
          const index = e.charIndex;
          // Check if previous char is punctuation
          if (index > 0 && text[index - 1] && text[index - 1].match(/[.,!?]/)) {
            if (!pauseUntilRef.current) {
              pauseUntilRef.current = Date.now() + BOUNDARY_PAUSE_THRESHOLD;
              lastUpdatedIndexRef.current = index - 1; // Pause at punctuation
            }
            if (Date.now() < pauseUntilRef.current) {
              setSpokenCharIndex(lastUpdatedIndexRef.current);
              return;
            } else {
              pauseUntilRef.current = null;
            }
          }
          setSpokenCharIndex(index);
        } catch (_) { /* ignore */ }
      };
      voiceUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      try { showToast?.('TTS failed', 'error'); } catch (_) { }
    }
  };
  const [speaking, setSpeaking] = React.useState(false);
  const [spokenCharIndex, setSpokenCharIndex] = React.useState<number | null>(null);
  const utteranceTextRef = React.useRef<string | null>(null);
  const fallbackIntervalRef = React.useRef<number | null>(null);
  const hasBoundaryRef = React.useRef(false);
  const utteranceStartTimeRef = React.useRef<number | null>(null);
  const lastUpdatedIndexRef = React.useRef<number | null>(null);
  const pauseUntilRef = React.useRef<number | null>(null);
  const currentFallbackIndexRef = React.useRef(0);
  const isPausingRef = React.useRef(false);
  const PER_CHAR_MS = 40; // ms per char used as a heuristic for fallback progress
  const BOUNDARY_PAUSE_THRESHOLD = 2000; // ms to pause highlight at punctuation
  const voicesRef = React.useRef<SpeechSynthesisVoice[] | null>(null);
  const [selectedVoiceName, setSelectedVoiceName] = React.useState<string | null>(null);
  const [voices, setVoices] = React.useState<SpeechSynthesisVoice[]>([]);

  // Helper to render the displayed overview with current word highlighted based on spokenCharIndex
  const renderHighlightedText = (text: string) => {
    if (!text || text.length === 0) return null;
    // Match tokens (word + following whitespace) so we preserve spacing
    const regex = /\S+\s*/g;
    const matches = Array.from(text.matchAll(regex)).map((m) => m[0]);
    let acc = 0;
    return matches.map((tok, idx) => {
      const start = acc;
      const end = acc + tok.length; // exclusive
      const isHighlighted = spokenCharIndex !== null && spokenCharIndex >= start && spokenCharIndex < end;
      acc += tok.length;
      // Make highlight classes theme-aware for light/dark mode using Tailwind
      const highlightClass = isHighlighted ? 'text-cyan-600 bg-cyan-100 dark:text-cyan-300 dark:bg-cyan-900/10 rounded px-1 py-0.5' : '';
      return (
        <span key={idx} className={highlightClass}>
          {tok}
        </span>
      );
    });
  };

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
    // Initialize voice list and restore selected voice from localStorage (if any)
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const tryLoadVoices = () => {
      try {
        const list = window.speechSynthesis.getVoices() || [];
        voicesRef.current = list;
        setVoices(list);
        // restore selected voice name from localStorage
        try {
          const stored = window.localStorage.getItem('mkt_overview_selected_voice');
          if (stored && list.some(v => v.name === stored)) {
            setSelectedVoiceName(stored);
          }
        } catch (_) { /* ignore */ }
      } catch (err) { /* ignore */ }
    };
    tryLoadVoices();
    // If voices are not loaded yet, listen for voiceschanged
    const onVoicesChanged = () => tryLoadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
    };
  }, []);

  // Handle voice activation: speak the current overview text when toggled on, cancel when off.
  React.useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      // Not supported in this environment
      if (voiceActive) {
        setVoiceActive(false);
        try { showToast?.('Speech synthesis not available in this browser', 'error'); } catch (e) { /* ignore */ }
      }
      return;
    }

    // Cancel any existing speech when voiceActive toggles off.
    if (!voiceActive) {
      try { window.speechSynthesis.cancel(); } catch (err) { /* ignore */ }
      if (voiceUtteranceRef.current) {
        voiceUtteranceRef.current.onend = null;
        voiceUtteranceRef.current.onerror = null;
        voiceUtteranceRef.current = null;
      }
      setSpeaking(false);
      setIsPaused(false);
      setSpokenCharIndex(null);
      utteranceTextRef.current = null;
      utteranceStartTimeRef.current = null;
      hasBoundaryRef.current = false;
      if (fallbackIntervalRef.current) { clearInterval(fallbackIntervalRef.current); fallbackIntervalRef.current = null; }
      return;
    }

    // Build the text to speak: prefer the displayed (typewriter) overview, then the summary, then the full sentiment.
    const textToSpeak = (displayedOverview && displayedOverview.length > 0) ? displayedOverview : (summaryOverview ?? fullSentiment ?? '');
    // If already speaking or already created the utterance, don't recreate — avoids repeated creation while typing.
    if (voiceUtteranceRef.current || (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking)) {
      return;
    }
    if (!textToSpeak || textToSpeak.length === 0) {
      // Nothing to say yet. Keep voiceActive true and wait for the text to be available.
      try { showToast?.('No overview to read yet — will speak when ready', 'info'); } catch (e) { /* ignore */ }
      return;
    }

    // Create an utterance and start speaking
    try {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = navigator.language ?? 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        setVoiceActive(false);
        setSpeaking(false);
        setIsPaused(false);
        utteranceTextRef.current = null;
        utteranceStartTimeRef.current = null;
        hasBoundaryRef.current = false;
        lastUpdatedIndexRef.current = null;
        pauseUntilRef.current = null;
        currentFallbackIndexRef.current = 0;
        isPausingRef.current = false;
        if (fallbackIntervalRef.current) { clearInterval(fallbackIntervalRef.current); fallbackIntervalRef.current = null; }
        try { onVoiceToggle?.(false); } catch (err) { /* ignore */ }
        try { showToast?.('Finished speaking', 'success'); } catch (e) { /* ignore */ }
        voiceUtteranceRef.current = null;
      };
      utterance.onstart = () => {
        setSpeaking(true);
        setIsPaused(false);
        setSpokenCharIndex(null);
        utteranceTextRef.current = textToSpeak;
        hasBoundaryRef.current = false;
        utteranceStartTimeRef.current = Date.now();
        try {
          if (fallbackIntervalRef.current) { clearInterval(fallbackIntervalRef.current); fallbackIntervalRef.current = null; }
          fallbackIntervalRef.current = window.setInterval(() => {
            try {
              if (hasBoundaryRef.current) return;
              const start = utteranceStartTimeRef.current ?? Date.now();
              const elapsed = Date.now() - start;
              const estIndex = Math.min((utteranceTextRef.current?.length ?? 1) - 1, Math.floor(elapsed / PER_CHAR_MS));
              setSpokenCharIndex(estIndex);
            } catch (_) { /* ignore */ }
          }, 150);
        } catch (_) { /* ignore */ }
        try { showToast?.(`Speaking Market Overview (${utterance.voice?.name ?? 'Default'})`, 'info'); } catch (e) { /* ignore */ }
      };
      utterance.onpause = () => { setIsPaused(true); };
      utterance.onresume = () => { setIsPaused(false); };
      utterance.onboundary = (e: any) => {
        try {
          hasBoundaryRef.current = true;
          const index = e.charIndex;
          // Check if previous char is punctuation
          if (index > 0 && textToSpeak[index - 1] && textToSpeak[index - 1].match(/[.,!?]/)) {
            if (!pauseUntilRef.current) {
              pauseUntilRef.current = Date.now() + BOUNDARY_PAUSE_THRESHOLD;
              lastUpdatedIndexRef.current = index - 1; // Pause at punctuation
            }
            if (Date.now() < pauseUntilRef.current) {
              setSpokenCharIndex(lastUpdatedIndexRef.current);
              return;
            } else {
              pauseUntilRef.current = null;
            }
          }
          setSpokenCharIndex(index);
        } catch (_) { /* ignore */ }
      };
      utterance.onerror = (e) => {
        setVoiceActive(false);
        setSpeaking(false);
        setIsPaused(false);
        utteranceTextRef.current = null;
        utteranceStartTimeRef.current = null;
        hasBoundaryRef.current = false;
        lastUpdatedIndexRef.current = null;
        pauseUntilRef.current = null;
        currentFallbackIndexRef.current = 0;
        isPausingRef.current = false;
        if (fallbackIntervalRef.current) { clearInterval(fallbackIntervalRef.current); fallbackIntervalRef.current = null; }
        try { onVoiceToggle?.(false); } catch (err) { /* ignore */ }
        try { showToast?.('Error speaking overview', 'error'); } catch (e) { /* ignore */ }
        voiceUtteranceRef.current = null;
      };
      // Select a voice if available
      try {
        const vlist = window.speechSynthesis.getVoices();
        voicesRef.current = vlist;
        let picked: SpeechSynthesisVoice | undefined = undefined;
        if (vlist && vlist.length > 0) {
          const lang = navigator.language ?? 'en-US';
          picked = vlist.find((v) => v.lang && v.lang.includes(lang));
          if (!picked) picked = vlist[0];
        }
        if (picked) {
          // If user has a stored selection, prefer it
          if (selectedVoiceName) {
            const byName = voicesRef.current?.find(v => v.name === selectedVoiceName);
            if (byName) {
              utterance.voice = byName;
            } else {
              utterance.voice = picked;
              setSelectedVoiceName(picked.name);
              try { window.localStorage.setItem('mkt_overview_selected_voice', picked.name); } catch (_) { /* ignore */ }
            }
          } else {
            utterance.voice = picked;
            setSelectedVoiceName(picked.name);
            try { window.localStorage.setItem('mkt_overview_selected_voice', picked.name); } catch (_) { /* ignore */ }
          }
        } else if (selectedVoiceName) {
          // If user previously selected a voice by name, prefer it
          const byName = voicesRef.current?.find(v => v.name === selectedVoiceName);
          if (byName) {
            utterance.voice = byName;
          }
        }
        // Debug log
        try { console.debug && console.debug('TTS voices available', vlist.map((v) => `${v.name} (${v.lang})`)); } catch (_) { /* ignore */ }
        // if no voice list currently available, listen for voiceschanged and re-assign
        if (!picked && vlist.length === 0) {
          const onVoicesChanged = () => {
            try {
              const loaded = window.speechSynthesis.getVoices();
              voicesRef.current = loaded;
              const lang = navigator.language ?? 'en-US';
              const found = loaded.find(v => v.lang && v.lang.includes(lang));
              if (found) {
                utterance.voice = found;
              }
            } catch (err) { /* ignore */ }
            window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
          };
          window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
        }
      } catch (err) {
        // ignore voice picking errors
      }
      voiceUtteranceRef.current = utterance;
      try { window.speechSynthesis.cancel(); } catch (err) { /* ignore */ }
      window.speechSynthesis.speak(utterance);
      setSpeaking(true);
      try { showToast?.(`Speaking Market Overview (${utterance.voice?.name ?? 'Default'})`, 'info'); } catch (e) { /* ignore */ }
    } catch (err) {
      // If SpeechSynthesis is unavailable or throws, try a short beep as fallback (must be user gesture) and disable voice flag.
      setVoiceActive(false);
      try { onVoiceToggle?.(false); } catch (e) { /* ignore */ }
      try { showToast?.('TTS error; playing short beep as fallback', 'warning'); } catch (_) { /* ignore */ }
      try { playBeep(); } catch (e) { /* ignore */ }
    }

    return () => {
      try { window.speechSynthesis.cancel(); } catch (err) { /* ignore */ }
      if (voiceUtteranceRef.current) {
        voiceUtteranceRef.current.onend = null;
        voiceUtteranceRef.current.onerror = null;
        voiceUtteranceRef.current = null;
      }
      // Clear any fallback interval in case the effect unmounts
      if (fallbackIntervalRef.current) { clearInterval(fallbackIntervalRef.current); fallbackIntervalRef.current = null; }
      utteranceTextRef.current = null;
      utteranceStartTimeRef.current = null;
      hasBoundaryRef.current = false;
    };
  }, [voiceActive, summaryOverview, fullSentiment, selectedVoiceName]);

  // Helper to play a short beep using WebAudio API (as fallback when TTS fails)
  const playBeep = () => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 600;
      g.gain.value = 0.0012; // subtle
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => {
        try { o.stop(); } catch (e) { /* ignore */ }
      }, 250);
    } catch (e) {
      // ignore audio errors
    }
  };

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
              data-state={loading ? 'loading' : isTyping ? 'typing' : speaking ? 'speaking' : 'idle'}
                    className={`${loading ? 'text-gray-500 animate-pulse' : isTyping ? 'text-cyan-400 animate-pulse' : speaking ? 'text-green-400 animate-pulse' : 'text-cyan-400'} w-5 h-5`}
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
          {/* Voice / Mic Toggle */}
          <button
            type="button"
            aria-label={!speaking ? 'Start voice summary' : (isPaused ? 'Resume voice summary' : 'Pause voice summary')}
            aria-pressed={voiceActive}
            title={!speaking ? 'Start voice summary' : (isPaused ? 'Resume voice summary' : 'Pause voice summary')}
            data-testid="market-overview-voice-toggle"
            className={`ml-2 p-1 rounded text-gray-300 hover:bg-zinc-800 focus:outline-none focus:ring ${voiceActive && !isPaused ? 'bg-cyan-600 text-white' : ''} ${isPaused ? 'bg-yellow-600 text-white' : ''}`}
            onClick={() => {
              if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
                try { showToast?.('Speech synthesis not available in this browser', 'error'); } catch (_) { /* ignore */ }
                return;
              }
              const synth = window.speechSynthesis;
              // If speaking and not paused -> pause
              if (synth.speaking && !synth.paused) {
                try {
                  synth.pause();
                  setIsPaused(true);
                  setVoiceActive(true);
                  try { showToast?.('Paused Market Overview', 'info'); } catch (_) {}
                } catch (e) { /* ignore */ }
                return;
              }
              // If paused -> resume (fallback to restart if resume doesn't take effect)
              if (synth.paused || isPaused) {
                try {
                  synth.resume();
                  setIsPaused(false);
                  setVoiceActive(true);
                  try { showToast?.('Resumed Market Overview', 'info'); } catch (_) {}
                  try { onVoiceToggle?.(true); } catch (_) {}
                  // If resume doesn't work in this browser, restart the speech
                  setTimeout(() => {
                    try {
                      if (synth.paused) {
                        try { synth.cancel(); } catch (_) { /* ignore */ }
                        const immediateText = displayedOverview && displayedOverview.length > 0 ? displayedOverview : (summaryOverview ?? fullSentiment ?? '');
                        if (immediateText && immediateText.length > 0) {
                          trySpeakNow(immediateText, selectedVoiceName);
                          try { onVoiceToggle?.(true); } catch (_) {}
                        }
                      }
                    } catch (_) { /* ignore */ }
                  }, 150);
                } catch (e) { /* ignore */ }
                return;
              }
              // Not speaking: start speaking
              setVoiceActive(true);
              try { onVoiceToggle?.(true); } catch (_) {}
              const immediateText = displayedOverview && displayedOverview.length > 0 ? displayedOverview : (summaryOverview ?? fullSentiment ?? '');
              if (immediateText && immediateText.length > 0) {
                trySpeakNow(immediateText, selectedVoiceName);
              } else {
                try { showToast?.('No overview yet; will speak when ready', 'info'); } catch (_e) { /* ignore */ }
              }
            }}
          >
            {(!speaking) ? <Mic className="w-4 h-4" /> : (isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />)}
            {speaking && !isPaused && (
              <span className="ml-2 inline-block w-2 h-2 rounded-full bg-white animate-pulse" aria-hidden />
            )}
          </button>
          <button
            type="button"
            aria-label="Restart voice summary"
            title="Restart voice summary"
            data-testid="market-overview-voice-restart"
            className="ml-2 p-1 rounded text-gray-300 hover:bg-zinc-800 focus:outline-none focus:ring"
            onClick={() => {
              if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
                try { showToast?.('Speech synthesis not available', 'error'); } catch (_) { /* ignore */ }
                return;
              }
              const synth = window.speechSynthesis;
              // Cancel any existing and restart from the beginning
              try { synth.cancel(); } catch (_) { /* ignore */ }
              setIsPaused(false);
              setVoiceActive(true);
              const immediateText = displayedOverview && displayedOverview.length > 0 ? displayedOverview : (summaryOverview ?? fullSentiment ?? '');
              if (immediateText && immediateText.length > 0) {
                trySpeakNow(immediateText, selectedVoiceName);
                try { onVoiceToggle?.(true); } catch (_) {}
              } else {
                try { showToast?.('No overview to restart', 'info'); } catch (_) {}
              }
            }}
          >
            <RefreshCw className="w-4 h-4" />
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
              <span className="inline-block lg:text-[1.15em] text-gray-200">{renderHighlightedText(displayedOverview)}</span>
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
            title="Regenerate Overview"
            className="regenerate-btn px-3 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            onClick={regenerate}
            aria-label="Regenerate market overview"
          >
            {loading ? 'Regenerating…' : 'Regenerate'}
          </button>
          <button
            type="button"
            title="View Fullscreen"
            className="view-sentiment-btn px-3 py-1 text-xs rounded bg-gray-600 hover:bg-gray-700 text-white transition-colors"
            onClick={() => setFullscreenOpen(true)}
            aria-label="View market overview in fullscreen"
          >
            <Eye className="w-3 h-3" />
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

      {/* Fullscreen Modal */}
      {fullscreenOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Cpu className="w-6 h-6 text-cyan-400" />
                Market Pulse Overview
                <span className="ml-2 px-2 py-1 text-xs rounded bg-cyan-600/20 text-cyan-300 border border-cyan-600/30">AI</span>
              </h3>
              <button
                type="button"
                onClick={() => setFullscreenOpen(false)}
                className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                aria-label="Close fullscreen view"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {timeframe && (
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-cyan-600/20 text-cyan-300 border border-cyan-600/30">
                  {timeframe === 'D' ? 'In the Last Day' : timeframe === 'W' ? 'In the Last Week' : timeframe === 'M' ? 'In the Last Month' : 'In the Last Year'}
                </span>
              </div>
            )}
            <div className="text-gray-200 leading-relaxed whitespace-pre-line">
              {displayedOverview || summaryOverview || fullSentiment || 'No overview available yet.'}
            </div>
          </div>
        </div>
      )}

      {/* InfoModal moved to parent */}
    </div>
  );
}
