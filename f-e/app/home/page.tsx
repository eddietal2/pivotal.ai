'use client';
  
import React from 'react';
import InfoModal from '@/components/modals/InfoModal';
import { lockScroll, unlockScroll } from '@/components/modals/scrollLock';
import CollapsibleSection from '@/components/ui/CollapsibleSection';
import { useToast } from '@/components/context/ToastContext';
import SignalFeedItem from '@/components/ui/SignalFeedItem';
import { useUI } from '@/components/context/UIContext';
import { ListChecks, ArrowUpRight, ArrowDownRight, TrendingUp, Info, X, Cpu, List, Grid, AlertTriangle, FileText, ChevronRight } from 'lucide-react';
import SignalEducationCard from '@/components/ui/SignalEducationCard';
import signalEducationCards from '@/components/ui/signalEducationData';
import WatchListItem from '@/components/watchlist/WatchListItem';
import MarketOverview from '@/components/ui/MarketOverview';
import { MarketPulseSkeleton, MarketOverviewSkeleton, SignalFeedSkeleton, DisclaimersSkeleton } from '@/components/ui/skeletons';
import Link from 'next/link';
import CandleStickAnim from '@/components/ui/CandleStickAnim';
import PivyChatCard from '@/components/home/PivyChatCard';
import LiveSetupScansSection from '@/components/home/LiveSetupScansSection';
import DisclaimersSection from '@/components/home/DisclaimersSection';
import PostLoginToastHandler from '@/components/ui/PostLoginToastHandler';

// CollapsibleSection is now an extracted component in components/CollapsibleSection.tsx

// --- MOCK DATA ---

// Mapping of display names to API tickers
const tickerMapping: Record<string, string> = {
  'S&P 500': '^GSPC',
  'DOW': '^DJI',
  'Nasdaq': '^IXIC',
  'VIX (Fear Index)': '^VIX',
  '10-Yr Yield': '^TNX',
  'Bitcoin': 'BTC-USD',
  'Gold': 'GC=F',
  'Silver': 'SI=F',
  'Crude Oil': 'CL=F',
  'Russell 2000': '^RUT',
  '2-Yr Yield': '^IRX',
  'Ethereum': 'ETH-USD',
  'Copper': 'HG=F',
  'Natural Gas': 'NG=F',
  'CALL/PUT Ratio': 'CPC=F', // Placeholder
  'AAII Retailer Investor Sentiment': 'AAII', // Placeholder
};

// Mock data for the Real-time Confluence Feed (The most important component)
const mockSignals = [
  {
    ticker: 'TSLA',
    signal: 'Strong Bullish Entry',
    confluence: ['MACD Crossover', 'RSI below 30 (Oversold)', 'High Volume Spike'],
    timeframe: '4H',
    change: '+3.45%',
    type: 'Bullish',
  },
  {
    ticker: 'NVDA',
    signal: 'Confirmed Bearish Reversal',
    confluence: ['RSI above 70 (Overbought)', 'MACD Bearish Cross', 'Declining Volume'],
    timeframe: '1D',
    change: '-1.89%',
    type: 'Bearish',
  },
  {
    ticker: 'GOOGL',
    signal: 'Momentum Breakout Alert',
    confluence: ['Volume 2x 20-Day Avg', 'Price action above resistance'],
    timeframe: '1H',
    change: '+1.12%',
    type: 'Bullish',
  },
  {
    ticker: 'AAPL',
    signal: 'Consolidation Watch',
    confluence: ['RSI Neutral (50)', 'MACD Flat'],
    timeframe: '30M',
    change: '-0.21%',
    type: 'Neutral',
  },
];



// --- Using shared WatchListItem from components/watchlist



// 4. Main Application Layout
export default function App() {
  const { modalOpen, setModalOpen } = useUI();
  const [signalFeedInfoOpen, setSignalFeedInfoOpen] = React.useState(false);
  // Combined info modal (replaces Market Pulse and Market Overview modals)
  const [infoModalOpen, setInfoModalOpen] = React.useState(false);
  const [disclaimerModalOpen, setDisclaimerModalOpen] = React.useState(false);
  const [stopLossModalOpen, setStopLossModalOpen] = React.useState(false);
  const [aiUsageModalOpen, setAiUsageModalOpen] = React.useState(false);
  const [overviewCpuState, setOverviewCpuState] = React.useState({ loading: false, isTyping: false });
  // Timeframe filter for Market Pulse (D, W, M, Y)
  const [pulseTimeframe, setPulseTimeframe] = React.useState<'D'|'W'|'M'|'Y'>('D');
  // view mode for Market Pulse cards: 'slider' (horizontal) on mobile vs 'list' (vertical)
  const [pulseViewMode, setPulseViewMode] = React.useState<'slider'|'list'>(() => {
    try {
      if (typeof window === 'undefined') return 'slider';
      const saved = window.localStorage.getItem('pulse_view_mode');
      return saved === 'list' ? 'list' : 'slider';
    } catch (err) {
      return 'slider';
    }
  });
  // Animation state for toggling view modes
  const [pulseViewAnimating, setPulseViewAnimating] = React.useState(false);
  // Real market data state
  const [realMarketData, setRealMarketData] = React.useState<Record<string, any>>({});
  const [marketDataLoading, setMarketDataLoading] = React.useState(false);

  const handleSetPulseViewMode = (view: 'slider'|'list') => {
    if (view === pulseViewMode) return;
    // Start a short fade/scale animation, switch mode mid-way
    setPulseViewAnimating(true);
    setTimeout(() => {
      setPulseViewMode(view);
      try { if (typeof window !== 'undefined') window.localStorage.setItem('pulse_view_mode', view); } catch (err) { /* ignore */ }
      // small delay for a smooth return to full opacity/scale
      setTimeout(() => setPulseViewAnimating(false), 160);
    }, 160);
  };

  // Persist view mode choice
  React.useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem('pulse_view_mode', pulseViewMode);
    } catch (err) { /* ignore */ }
  }, [pulseViewMode]);
  // Timeframe filter for Live Setup Scans (D, W, M, Y)
  const [signalTimeframe, setSignalTimeframe] = React.useState<'D'|'W'|'M'|'Y'>('D');
  // Default expansion for Market Pulse is always true; removed UI toggle
  // Instead of inline alerts, disclaimers live in a collapsible section at the bottom
  // Loading state for skeletons
  const [isLoading, setIsLoading] = React.useState(true);
  const { showToast } = useToast();

  // Track open state of sections


  // Simulate loading on mount
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000); // 2 second loading simulation
    return () => clearTimeout(timer);
  }, []);

  // Post-login toast handler has been moved to RootLayout's PostLoginToastHandler.

  // prevent background scrolling when the pulse info modal is open
  React.useEffect(() => {
    let locked = false;
    if (modalOpen) {
      lockScroll();
      locked = true;
    }
    return () => {
      if (locked) {
        unlockScroll();
      }
    };
  }, [modalOpen]);

  // Normalize timeframe string to a category: D, W, M, Y (kept for signal/timeframe helpers)
  const normalizeTimeframe = (tf?: string) => {
    if (!tf) return 'D';
    const t = tf.toUpperCase();
    if (t.includes('24H') || t.endsWith('D') || t.includes('DAY') || t === '1D') return 'D';
    if (t.includes('W') || t.includes('WEEK')) return 'W';
    if (t.includes('M') && !t.includes('MS')) return 'M';
    if (t.includes('Y') || t.includes('YEAR')) return 'Y';
    return 'D';
  };
  // Human-friendly label for timeframe used in the modal pill (capitalized like MarketOverview)
  const humanTimeframeLabel = (tf?: string) => {
    if (!tf) return '';
    const t = tf.toUpperCase();
    if (t === '24H') return '24H';
    if (t === '1D') return 'In the Last Day';
    if (t === '1W') return 'In the Last Week';
    if (t === '1M') return 'In the Last Month';
    if (t === '1Y') return 'In the Last Year';
    return tf;
  };
  
  // Fetch real market data
  const fetchRealMarketData = React.useCallback(async () => {
    setMarketDataLoading(true);
    try {
      const data: Record<string, any> = {};
      
      // Fetch data for each unique ticker
      const uniqueTickers = [...new Set(Object.values(tickerMapping))];
      
      for (const ticker of uniqueTickers) {
        try {
          // Fetch price data
          const priceResponse = await fetch(`/api/financial/data/?ticker=${ticker}&type=price`);
          const priceData = await priceResponse.json();
          
          // Fetch RV data
          const rvResponse = await fetch(`/api/financial/data/?ticker=${ticker}&type=rv`);
          const rvData = await rvResponse.json();
          
          data[ticker] = {
            price: priceData,
            rv: rvData
          };
        } catch (error) {
          console.error(`Error fetching data for ${ticker}:`, error);
        }
      }
      
      setRealMarketData(data);
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setMarketDataLoading(false);
    }
  }, []);

  // Fetch data on mount
  React.useEffect(() => {
    fetchRealMarketData();
  }, [fetchRealMarketData]);
  
  // Example descriptions for each index
  const pulseDescriptions: Record<string, string> = {
    'S&P 500': 'The S&P 500 is a stock market index tracking the performance of 500 large companies listed on stock exchanges in the United States. It is widely regarded as the best single gauge of large-cap U.S. equities.',
    'VIX (Fear Index)': 'The VIX, or Volatility Index, measures the market’s expectation of volatility over the next 30 days. It is often referred to as the "fear index" and spikes during market turmoil.',
    'CALL/PUT Ratio': 'The CALL/PUT Ratio measures the number of call options traded relative to put options. It is often used as a sentiment indicator, with higher ratios indicating bullish sentiment and lower ratios indicating bearish sentiment.',
    '10-Yr Yield': 'The 10-Year Treasury Yield reflects the return on investment for U.S. government bonds maturing in 10 years. It is a key indicator for interest rates and economic outlook.',
    'Bitcoin': 'Bitcoin (BTC) is the world’s largest cryptocurrency by market capitalization. It is a decentralized digital currency that operates without a central bank and is traded globally 24/7. Bitcoin is often seen as a store of value and a hedge against inflation.',    'AAII Retailer Investor Sentiment': 'The AAII Investor Sentiment Survey measures the percentage of individual investors who are bullish, bearish, or neutral on the stock market for the next six months.',
    'Gold': 'Gold is a precious metal that has been used as a store of value and a hedge against inflation for centuries. It is traded globally and often moves inversely to the U.S. dollar.',
    'Silver': 'Silver is a precious metal used in industrial applications as well as investment. It is more volatile than gold and often follows industrial demand trends.',
    'Crude Oil': 'Crude Oil is a fossil fuel that is refined into various petroleum products. Its price is influenced by global supply and demand, geopolitical events, and economic indicators.',
    'DOW': 'The Dow Jones Industrial Average (DJIA) is a stock market index that tracks 30 large, publicly-owned companies trading on the New York Stock Exchange and the Nasdaq.',
    'Nasdaq': 'The Nasdaq Composite is a stock market index that includes almost all stocks listed on the Nasdaq stock exchange. It is heavily weighted towards technology companies.',
    'Russell 2000': 'The Russell 2000 Index measures the performance of approximately 2,000 small-cap companies in the U.S. equity market. It is a benchmark for small-cap stocks and often moves differently from large-cap indices.',
    '2-Yr Yield': 'The 2-Year Treasury Yield reflects the return on investment for U.S. government bonds maturing in 2 years. It is sensitive to short-term interest rate expectations and Federal Reserve policy.',
    'Ethereum': 'Ethereum (ETH) is the second-largest cryptocurrency by market capitalization. It is a decentralized platform for smart contracts and decentralized applications (dApps), often used for DeFi and NFTs.',
    'Copper': 'Copper is an industrial metal used in construction, electronics, and manufacturing. Its price is a leading indicator of global economic activity and industrial demand.',
    'Natural Gas': 'Natural Gas is a fossil fuel used for heating, electricity generation, and industrial processes. Its price is influenced by weather patterns, supply levels, and energy demand.',
  };


  // Filter signals by chosen timeframe
  const filteredSignals = React.useMemo(() => mockSignals.filter((s) => normalizeTimeframe(s.timeframe) === signalTimeframe), [signalTimeframe]);

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900/20 dark:text-white font-sans">

      {/* Custom scrollbar styles */}
      <style>
        {`
          .scrollbar-hide {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;  /* Chrome, Safari and Opera */
          }
        `}
      </style>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto lg:px-64">
        <div className="space-y-8 p-4 sm:p-8 md:mt-10">

          {/* Current Day Pivy Chat */}
          <div className="mb-4">
            <CandleStickAnim />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Today's Pivy Chat</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Catch up on today's conversation with your AI assistant.</p>
          </div>

          <PivyChatCard
            isLoading={isLoading}
            href="/pivy/chat/0"
            date="01/07/26"
            time="10:30 AM"
            title="This is a very long title that should test the maximum length for display purposes and see how it wraps."
            message="I'm good, thanks!"
          />
          <div className="mt-6 text-right">
            <Link href="/pivy?drawer=open&about=open" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium">
              Learn more about Pivy Chat →
            </Link>
          </div>
          
          {/* Spacer */}
          <div className='mt-4'></div>

          {/* Real-time Confluence Feed */}
          <LiveSetupScansSection
            isLoading={isLoading}
            filteredSignals={filteredSignals}
            signalTimeframe={signalTimeframe}
            setSignalTimeframe={setSignalTimeframe}
            signalFeedInfoOpen={signalFeedInfoOpen}
            setSignalFeedInfoOpen={setSignalFeedInfoOpen}
          />

          {/* Market Pulse Info Modal (refactored to InfoModal) */}
          {/* Unified Info Modal: includes both Market Pulse details and Market Overview details */}
          <InfoModal
            open={infoModalOpen}
            onClose={() => setInfoModalOpen(false)}
            title={<><Info className="w-5 h-5 text-gray-900 dark:text-orange-300" />Market Info</>}
            ariaLabel="Market Info"
          >
            <div className="w-full max-w-2xl mx-auto space-y-6">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h4 className="text-xl font-bold text-gray-900 dark:text-orange-300 flex items-center gap-2 mb-3">
                  <Cpu
                    data-testid="modal-cpu-indicator"
                    data-state={overviewCpuState.loading ? 'loading' : overviewCpuState.isTyping ? 'typing' : 'idle'}
                    className={`${overviewCpuState.loading ? 'text-gray-400 animate-pulse' : overviewCpuState.isTyping ? 'text-green-300 animate-pulse' : 'text-gray-900 dark:text-orange-300'} w-5 h-5`}
                    aria-hidden
                  />
                  Market Overview Details
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Market Overview is generated by an AI engine to summarize the current Market Pulse items. It interprets recent data and highlights potential areas of interest to investigate further using the detailed charts.</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Note: AI output shown is illustrative; use with judgment and confirm with chart analysis. This feature currently uses a simple local heuristic as a placeholder for a real AI endpoint.</p>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h4 className="text-xl font-bold text-gray-900 dark:text-green-300 flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5" />
                  About Market Pulse
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">Market Pulse provides a quick overview of key market indicators to help you gauge the current financial environment.</p>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h5 className="text-lg font-bold text-gray-900 dark:text-green-300 mb-2">S&P 500</h5>
                <p className="text-sm text-gray-700 dark:text-gray-300">The S&P 500 is a stock market index tracking the performance of 500 large companies listed on stock exchanges in the United States. It is widely regarded as the best single gauge of large-cap U.S. equities.</p>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h5 className="text-lg font-bold text-gray-900 dark:text-green-300 mb-2">VIX (Fear Index)</h5>
                <p className="text-sm text-gray-700 dark:text-gray-300">The VIX, or Volatility Index, measures the market's expectation of volatility over the next 30 days. It is often referred to as the "fear index" and spikes during market turmoil.</p>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h5 className="text-lg font-bold text-gray-900 dark:text-green-300 mb-2">10-Year Treasury Yield</h5>
                <p className="text-sm text-gray-700 dark:text-gray-300">The 10-Year Treasury Yield reflects the return on investment for U.S. government bonds maturing in 10 years. It is a key indicator for interest rates and economic outlook.</p>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h5 className="text-lg font-bold text-gray-900 dark:text-green-300 mb-2">Bitcoin</h5>
                <p className="text-sm text-gray-700 dark:text-gray-300">Bitcoin (BTC) is the world's largest cryptocurrency by market capitalization. It is a decentralized digital currency that operates without a central bank and is traded globally 24/7. Bitcoin is often seen as a store of value and a hedge against inflation.</p>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h5 className="text-lg font-bold text-gray-900 dark:text-green-300 mb-2">How to Use</h5>
                <p className="text-sm text-gray-700 dark:text-gray-300">Monitor these indices to understand the current market environment. Rising S&P 500 values indicate bullish sentiment, while spikes in the VIX suggest increased fear or volatility. The 10-Year Yield reflects interest rate expectations and economic outlook.</p>
              </div>
            </div>
          </InfoModal>


          {/* Legal Disclaimer Modal (detailed) */}
          <InfoModal
            open={disclaimerModalOpen}
            onClose={() => setDisclaimerModalOpen(false)}
            title={<><Info className="w-6 h-6 text-orange-300" />Legal Disclaimer</>}
            ariaLabel="Legal Disclaimer"
          >
            <div className="w-full max-w-2xl mx-auto space-y-6">
              <div className="h-52"></div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <p className="text-sm text-gray-700 dark:text-gray-300">This application and the data it surfaces are provided for informational, educational, and research purposes only. Nothing presented by this app is intended to be, and should not be construed as, financial, investment, tax, or legal advice. Use of this app does not create any advisory relationship.</p>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h5 className="text-sm font-semibold text-indigo-600 dark:text-indigo-300 mb-2">No Financial Advice</h5>
                <p className="text-xs text-gray-700 dark:text-gray-300">Any signals, metrics, or analysis presented here are not recommendations to buy, sell, or hold any assets. Users should perform their own due diligence and consult a licensed financial advisor before making decisions.</p>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h5 className="text-sm font-semibold text-indigo-600 dark:text-indigo-300 mb-2">No Guarantees &amp; Accuracy</h5>
                <p className="text-xs text-gray-700 dark:text-gray-300">Data may be delayed, incomplete, or inaccurate. We make no warranties regarding the completeness, timeliness, or accuracy of the information provided. All content is provided 'as is' without warranty of any kind.</p>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h5 className="text-sm font-semibold text-indigo-600 dark:text-indigo-300 mb-2">Limitation of Liability</h5>
                <p className="text-xs text-gray-700 dark:text-gray-300">We and our affiliates shall not be liable for any loss or damage arising from the use of the app or reliance on any information presented. You assume full responsibility for any investment decisions you make.</p>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h5 className="text-sm font-semibold text-indigo-600 dark:text-indigo-300 mb-2">Consult a Professional</h5>
                <p className="text-xs text-gray-700 dark:text-gray-300">If you need individual advice, consult a licensed financial, tax, or legal advisor. The app is not a substitute for professional advice.</p>
              </div>
              <div className="text-right">
                <button type="button" className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setDisclaimerModalOpen(false)}>I Understand</button>
              </div>
            </div>
          </InfoModal>

          {/* Stop Loss Reminder Modal (detailed) */}
          <InfoModal
            open={stopLossModalOpen}
            onClose={() => setStopLossModalOpen(false)}
            title={<><Info className="w-6 h-6 text-red-400" />Stop Loss Reminder</>}
            ariaLabel="Stop Loss Reminder"
          >
            <div className="w-full max-w-2xl mx-auto space-y-6">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <p className="text-sm text-gray-700 dark:text-gray-300">A stop loss is an order designed to limit an investor’s loss on a position. Setting a stop loss can help you protect capital and manage risk if a trade moves against you.</p>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h5 className="text-sm font-semibold text-red-600 dark:text-red-300 mb-2">Why set a stop loss</h5>
                <p className="text-xs text-gray-700 dark:text-gray-300">Stop losses automatically exit a losing trade at a predetermined price, helping reduce emotional decision-making and ensuring disciplined risk management.</p>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h5 className="text-sm font-semibold text-red-600 dark:text-red-300 mb-2">Common strategies</h5>
                <p className="text-xs text-gray-700 dark:text-gray-300">Consider setting stop loss levels based on volatility, below key support levels, or at a predefined percentage loss you are comfortable with. Always test your strategy in a paper environment before trading live.</p>
              </div>
              <div className="text-right">
                <button type="button" className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white" onClick={() => setStopLossModalOpen(false)}>I Understand</button>
              </div>
            </div>
          </InfoModal>

          {/* AI Usage Modal (detailed) */}
          <InfoModal
            open={aiUsageModalOpen}
            onClose={() => setAiUsageModalOpen(false)}
            title={<><Info className="w-6 h-6 text-gray-600" />AI Usage</>}
            ariaLabel="AI Usage"
          >
            <div className="w-full max-w-2xl mx-auto space-y-6">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h5 className="text-lg font-bold text-gray-900 dark:text-indigo-300 mb-2">How AI is used</h5>
                <p className="text-sm text-gray-700 dark:text-gray-300">This application uses language models to summarize market data, provide contextual notes about signals, and support UI summaries. The outputs are produced by third-party LLMs or local inference systems depending on configuration.</p>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h5 className="text-sm font-semibold text-indigo-600 dark:text-indigo-300 mb-2">Limitations & behavior</h5>
                <p className="text-xs text-gray-700 dark:text-gray-300">LLMs are probabilistic and may produce incorrect or misleading information (hallucinations). They can reflect biases present in training data and should not be relied upon as authoritative financial advice. Always cross-check with charts, numerical data, and consult a licensed professional for trading decisions.</p>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h5 className="text-sm font-semibold text-indigo-600 dark:text-indigo-300 mb-2">Privacy & data</h5>
                <p className="text-xs text-gray-700 dark:text-gray-300">We do not submit personally-identifying information to LLMs unless explicitly stated. Aggregated and non-identifying telemetry may be used to evaluate and improve models. Avoid pasting sensitive personal or account details in places that may be sent to third-party services.</p>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h5 className="text-sm font-semibold text-indigo-600 dark:text-indigo-300 mb-2">Recommendations</h5>
                <p className="text-xs text-gray-700 dark:text-gray-300">Treat AI summaries as a convenience and starting point for analysis. Verify important conclusions using the provided charts, raw data, and other trusted sources before acting.</p>
              </div>
              <div className="text-right">
                <button type="button" className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setAiUsageModalOpen(false)}>I Understand</button>
              </div>
            </div>
          </InfoModal>

          {/* Info Modal for Live Setup Scans (refactored into InfoModal) */}
          <InfoModal
            open={signalFeedInfoOpen}
            onClose={() => setSignalFeedInfoOpen(false)}
            verticalAlign="top"
            title={<><Info className="w-6 h-6 text-gray-900 dark:text-orange-300" />About Live Setup Scans</>}
            ariaLabel="About Live Setup Scans"
          >
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h5 className="text-lg font-bold text-gray-900 dark:text-indigo-300 mb-2">What is the Live Setup Scans Feed?</h5>
                <p className="text-sm text-gray-700 dark:text-gray-300">The Live Setup Scans section provides real-time actionable trading setups detected by our AI. Each card summarizes a unique market opportunity, including the ticker, setup type, confluence factors, timeframe, and recent price change. Use these signals to quickly identify high-probability entries, reversals, breakouts, and consolidations across the market.</p>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h5 className="text-lg font-bold text-gray-900 dark:text-indigo-300 mb-2">How to Use</h5>
                <p className="text-sm text-gray-700 dark:text-gray-300">Review the confluence factors for each setup to understand why the signal was generated. Add setups to your watchlist or view charts for deeper analysis. The feed updates continuously to reflect the latest market conditions.</p>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-indigo-300 mb-3">Key Patterns & Signals</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">These signal definitions and setups are the foundations of many of the Live Setup Scans. Use them to better interpret why a signal was raised and how to act on it.</p>

              <div data-testid="education-cards-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {signalEducationCards.map((c, i) => (
                  <SignalEducationCard
                    key={i}
                    title={c.title}
                    subtitle={c.subtitle}
                    description={c.description}
                    examples={c.examples}
                    badge={c.badge}
                    Icon={c.Icon}
                  />
                ))}
              </div>
            
              </div>
            </div>
          </InfoModal>

          {/* Disclaimers & Risk Notices (moved into a collapsible section at the bottom) */}
          <DisclaimersSection
            isLoading={isLoading}
            setStopLossModalOpen={setStopLossModalOpen}
            setDisclaimerModalOpen={setDisclaimerModalOpen}
            setAiUsageModalOpen={setAiUsageModalOpen}
          />

          {/* Spacer */}
          <div className='mb-64 lg:mb-0'></div>

        </div>
      </div>
      {/* Hide BottomNav when modal is open */}
      {!(modalOpen || infoModalOpen || signalFeedInfoOpen || disclaimerModalOpen || stopLossModalOpen || aiUsageModalOpen) && (
        <div className="fixed bottom-0 left-0 w-full z-40">
          {/* ...existing BottomNav code... */}
        </div>
      )}
    </div>
  );
}

// Note: InfoModal component has been extracted to components/InfoModal.tsx