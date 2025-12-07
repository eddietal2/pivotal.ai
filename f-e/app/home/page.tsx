'use client';
  

import React from 'react';
import InfoModal from '@/components/modals/InfoModal';
import { lockScroll, unlockScroll } from '@/components/modals/scrollLock';
import CollapsibleSection from '@/components/ui/CollapsibleSection';
import SignalFeedItem from '@/components/ui/SignalFeedItem';
import { useUI } from '@/components/context/UIContext';
import { ListChecks, ArrowUpRight, ArrowDownRight, TrendingUp, Info, X, Cpu } from 'lucide-react';
import Sparkline from '@/components/ui/Sparkline';
import MarketOverview from '@/components/ui/MarketOverview';
import { MarketPulseSkeleton, MarketOverviewSkeleton, SignalFeedSkeleton } from '@/components/ui/skeletons';

// CollapsibleSection is now an extracted component in components/CollapsibleSection.tsx

// --- MOCK DATA ---

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

// Mock data for the Global Market Pulse
const mockPulse = [
  // Daily data (D)
  { index: 'S&P 500', value: 5210.45, change: '+0.82%', color: 'text-green-500', trend: [5180, 5190, 5200, 5205, 5210], timeframe: '1D', afterHours: false },
  { index: 'VIX (Fear Index)', value: 13.20, change: '-3.10%', color: 'text-green-500', trend: [16.1, 15.2, 14.0, 13.8, 13.2], timeframe: '1D', afterHours: false },
  { index: '10-Yr Yield', value: 4.15, change: '+0.05%', color: 'text-red-500', trend: [4.05, 4.06, 4.10, 4.12, 4.15], timeframe: '1D', afterHours: false },
  { index: 'Bitcoin', value: 43250.00, change: '+2.15%', color: 'text-green-500', trend: [41200, 42000, 42500, 43000, 43250], timeframe: '24H', afterHours: true },

  // Weekly data (W)
  { index: 'S&P 500', value: 5185.32, change: '+2.45%', color: 'text-green-500', trend: [5120, 5140, 5160, 5170, 5185], timeframe: '1W', afterHours: false },
  { index: 'VIX (Fear Index)', value: 14.85, change: '-8.20%', color: 'text-green-500', trend: [18.5, 17.2, 16.1, 15.4, 14.8], timeframe: '1W', afterHours: false },
  { index: '10-Yr Yield', value: 4.12, change: '+0.18%', color: 'text-red-500', trend: [3.95, 4.02, 4.08, 4.10, 4.12], timeframe: '1W', afterHours: false },
  { index: 'Bitcoin', value: 42800.50, change: '+5.75%', color: 'text-green-500', trend: [39500, 40500, 41500, 42000, 42800], timeframe: '1W', afterHours: false },

  // Monthly data (M)
  { index: 'S&P 500', value: 5120.78, change: '+4.12%', color: 'text-green-500', trend: [4850, 4920, 4980, 5050, 5120], timeframe: '1M', afterHours: false },
  { index: 'VIX (Fear Index)', value: 16.42, change: '-12.85%', color: 'text-green-500', trend: [22.1, 20.5, 19.2, 17.8, 16.4], timeframe: '1M', afterHours: false },
  { index: '10-Yr Yield', value: 4.08, change: '+0.32%', color: 'text-red-500', trend: [3.78, 3.85, 3.92, 4.01, 4.08], timeframe: '1M', afterHours: false },
  { index: 'Bitcoin', value: 41500.25, change: '+8.92%', color: 'text-green-500', trend: [36500, 37500, 38500, 39500, 41500], timeframe: '1M', afterHours: false },

  // Yearly data (Y)
  { index: 'S&P 500', value: 4850.92, change: '+15.68%', color: 'text-green-500', trend: [4200, 4350, 4500, 4650, 4850], timeframe: '1Y', afterHours: false },
  { index: 'VIX (Fear Index)', value: 18.75, change: '-25.42%', color: 'text-green-500', trend: [28.5, 26.2, 24.1, 21.5, 18.7], timeframe: '1Y', afterHours: false },
  { index: '10-Yr Yield', value: 3.95, change: '+0.85%', color: 'text-red-500', trend: [3.12, 3.25, 3.45, 3.75, 3.95], timeframe: '1Y', afterHours: false },
  { index: 'Bitcoin', value: 38500.75, change: '+45.23%', color: 'text-green-500', trend: [26500, 28500, 30500, 33500, 38500], timeframe: '1Y', afterHours: false },
];

// --- INLINE COMPONENTS ---

// 1. Global Market Pulse Card
const MarketPulseCard = ({ index, value, change, color, onClick, trend, timeframe, afterHours }: { index: string; value: number; change: string; color: string; onClick: () => void; trend?: number[]; timeframe?: string; afterHours?: boolean }) => (
  <button
    className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm dark:shadow-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-500 transition duration-200 w-full text-left focus:outline-none focus:ring-2 focus:ring-indigo-500"
    onClick={onClick}
    type="button"
    aria-label={`More info about ${index}${timeframe ? ', timeframe ' + timeframe : ''}${afterHours ? ', after hours' : ''}`}
  >
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm font-medium text-gray-400">{index}</p>
      {/* timeframe chip */}
      {timeframe && (
        <span
          title={timeframe === '24H' ? '24 hours (around the clock)' : `Last ${timeframe}`}
          className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-50 border border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
        >{timeframe}{afterHours ? <span className="ml-1 text-[10px] text-orange-300 font-bold">AH</span> : null}</span>
      )}
    </div>
    <div className="flex items-center justify-between mt-1">
      <div className="flex items-center gap-3">
        {/* Sparkline */}
        <div className="flex-shrink-0">
          {/* Will render sparkline if trend data is provided */}
          {trend && trend.length > 0 && (
            <Sparkline data={trend} width={72} height={28} stroke={color.includes('green') ? '#34d399' : '#f87171'} className="rounded" gradient={true} fillOpacity={0.12} />
          )}
        </div>
        <span className="text-xl font-bold text-gray-900 dark:text-white">{value}</span>
      </div>
      <span className={`text-sm font-semibold ${color} flex items-center`}>
        {color.includes('green') ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
        {change}
      </span>
    </div>
  </button>
);



// 4. Main Application Layout
export default function App() {
  const { modalOpen, setModalOpen } = useUI();
  const [selectedPulse, setSelectedPulse] = React.useState<null | typeof mockPulse[0]>(null);
  const [signalFeedInfoOpen, setSignalFeedInfoOpen] = React.useState(false);
  // Combined info modal (replaces Market Pulse and Market Overview modals)
  const [infoModalOpen, setInfoModalOpen] = React.useState(false);
  const [overviewCpuState, setOverviewCpuState] = React.useState({ loading: false, isTyping: false });
  // Timeframe filter for Market Pulse (D, W, M, Y)
  const [pulseTimeframe, setPulseTimeframe] = React.useState<'D'|'W'|'M'|'Y'>('D');
  // Timeframe filter for Live Setup Scans (D, W, M, Y)
  const [signalTimeframe, setSignalTimeframe] = React.useState<'D'|'W'|'M'|'Y'>('D');
  // Default expansion for Market Pulse is always true; removed UI toggle
  const [showDisclaimer, setShowDisclaimer] = React.useState(true);
  const [closingDisclaimer, setClosingDisclaimer] = React.useState(false);
  const closingTimer = React.useRef<number | null>(null);
  // Loading state for skeletons
  const [isLoading, setIsLoading] = React.useState(true);
  // Modal chart timeframe state (for selectedPulse modal)
  const [modalChartTimeframe, setModalChartTimeframe] = React.useState<'24H'|'1D'|'1W'|'1M'|'1Y'>(() => '1D');

  // Simulate loading on mount
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000); // 2 second loading simulation
    return () => clearTimeout(timer);
  }, []);

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

  // When a pulse modal opens, initialize the modal chart timeframe to the selected pulse timeframe
  React.useEffect(() => {
    if (modalOpen && selectedPulse) {
      const tf = selectedPulse.timeframe as '24H'|'1D'|'1W'|'1M'|'1Y' | undefined;
      setModalChartTimeframe(tf ?? '1D');
    }
  }, [modalOpen, selectedPulse]);

  // Compute display data for modal based on selectedPulse index and modal timeframe
  // Normalize timeframe string to a category: D, W, M, Y (function moved up to be available for memo)
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
  const modalDisplayPulse = React.useMemo(() => {
    if (!selectedPulse) return null;
    const targetCat = normalizeTimeframe(modalChartTimeframe as string);
    // find the first matching pulse with same index and timeframe category
    const match = mockPulse.find((p) => p.index === selectedPulse.index && normalizeTimeframe(p.timeframe) === targetCat);
    return match ?? selectedPulse;
  }, [selectedPulse, modalChartTimeframe]);
  
  // Example descriptions for each index
  const pulseDescriptions: Record<string, string> = {
    'S&P 500': 'The S&P 500 is a stock market index tracking the performance of 500 large companies listed on stock exchanges in the United States. It is widely regarded as the best single gauge of large-cap U.S. equities.',
    'VIX (Fear Index)': 'The VIX, or Volatility Index, measures the market’s expectation of volatility over the next 30 days. It is often referred to as the "fear index" and spikes during market turmoil.',
    '10-Yr Yield': 'The 10-Year Treasury Yield reflects the return on investment for U.S. government bonds maturing in 10 years. It is a key indicator for interest rates and economic outlook.',
    'Bitcoin': 'Bitcoin (BTC) is the world’s largest cryptocurrency by market capitalization. It is a decentralized digital currency that operates without a central bank and is traded globally 24/7. Bitcoin is often seen as a store of value and a hedge against inflation.',
  };

  

  // Filter pulses by chosen timeframe
  const filteredPulse = React.useMemo(() => mockPulse.filter((p) => normalizeTimeframe(p.timeframe) === pulseTimeframe), [pulseTimeframe]);
  // Filter signals by chosen timeframe
  const filteredSignals = React.useMemo(() => mockSignals.filter((s) => normalizeTimeframe(s.timeframe) === signalTimeframe), [signalTimeframe]);

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-white font-sans">

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-8 p-4 sm:p-8 md:mt-10">
          
          {/* Global Market Pulse */}
          {isLoading ? (
            <MarketPulseSkeleton />
          ) : (
            <CollapsibleSection
              title={
                <span className="flex items-center gap-2">
                  {/* <TrendingUp className="w-6 h-6 text-green-400" /> */}
                  Market Pulse
                </span>
              }
              infoButton={
                <div className="flex items-center gap-2">
                  {/* Overview info button (shows MarketOverview modal even when collapsed) */}
                  <button
                    type="button"
                    className="p-1 rounded-full hover:bg-gray-800 transition ml-2"
                    title="Learn more about Market Overview"
                    aria-label="More info about Market Overview"
                    data-testid="overview-info-btn"
                    onClick={() => setInfoModalOpen(true)}
                  >
                    <Info className="w-5 h-5 text-orange-300" />
                  </button>
                  {/* Timeframe filter */}
                  <div className="ml-3 inline-flex items-center rounded-md bg-gray-50 border border-gray-200 p-1 dark:bg-gray-800 dark:border-gray-700">
                    {(['D','W','M','Y'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`min-w-[30px] px-2 py-1 text-xs rounded ${pulseTimeframe === t ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        aria-pressed={pulseTimeframe === t}
                        aria-label={`Show ${t} timeframe`}
                        data-testid={`pulse-filter-${t}`}
                        onClick={() => setPulseTimeframe(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              }
                openKey={pulseTimeframe}
            >
              {/* Render MarketOverview inside collapsible */}
                <div className="mb-4">
                {isLoading ? (
                  <MarketOverviewSkeleton />
                ) : (
                  <MarketOverview
                    pulses={filteredPulse}
                    timeframe={pulseTimeframe}
                    onOpenInfo={() => setInfoModalOpen(true)}
                    onStateChange={(s) => setOverviewCpuState(s)}
                  />
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <MarketPulseSkeleton key={i} />)
                ) : (
                  filteredPulse.map((pulse, index) => (
                    <MarketPulseCard
                      key={index}
                      {...pulse}
                      onClick={() => {
                        setSelectedPulse(pulse);
                        setModalOpen(true);
                      }}
                    />
                  ))
                )}
              {/* Market Pulse Info Modal (renders outside the collapsible content so it shows even when collapsed) */}
              </div>
            </CollapsibleSection>
          )}

          {/* Real-time Confluence Feed */}
          {isLoading ? (
            <SignalFeedSkeleton />
          ) : (
            <CollapsibleSection
              title={
                <span className="flex items-center gap-2">
                  {/* <ListChecks className="w-6 h-6 text-indigo-400" /> */}
                  Live Setup Scans
                </span>
              }
              infoButton={
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-1 rounded-full hover:bg-gray-800 transition"
                    title="Learn more about Live Setup Scans"
                    aria-label="More info about Live Setup Scans"
                    onClick={() => setSignalFeedInfoOpen(true)}
                  >
                    <Info className="w-5 h-5 text-orange-300" />
                  </button>
                  {/* Timeframe filter */}
                  <div className="ml-3 inline-flex items-center rounded-md bg-gray-50 border border-gray-200 p-1 dark:bg-gray-800 dark:border-gray-700">
                    {(['D','W','M','Y'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`min-w-[30px] px-2 py-1 text-xs rounded ${signalTimeframe === t ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        aria-pressed={signalTimeframe === t}
                        aria-label={`Show ${t} timeframe`}
                        data-testid={`signal-filter-${t}`}
                        onClick={() => setSignalTimeframe(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              }
                openKey={signalTimeframe}
            >
              <div className="space-y-6">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <SignalFeedSkeleton key={i} />)
                ) : (
                  filteredSignals.map((signal, index) => (
                    <SignalFeedItem key={index} {...signal} />
                  ))
                )}
                <div className="text-center p-4">
                  <p className="text-indigo-400 font-semibold flex items-center justify-center">
                    <ListChecks className="w-5 h-5 mr-2" />
                    View & Customize Watchlist Scans
                  </p>
                </div>
                {/* Info Modal for Live Setup Scans - renders outside collapsible content */}
              </div>
            </CollapsibleSection>
          )}

          {/* Market Pulse Info Modal (refactored to InfoModal) */}
          {/* Unified Info Modal: includes both Market Pulse details and Market Overview details */}
          <InfoModal
            open={infoModalOpen}
            onClose={() => setInfoModalOpen(false)}
            title={<><Info className="w-5 h-5 text-gray-900 dark:text-orange-300" />Market Info</>}
            ariaLabel="Market Info"
          >
            <div className="space-y-6">
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
          {/* Pinned MarketOverview is rendered earlier to keep it above Live Setup Scans */}

          {/* Modal for Market Pulse Item Info (converted to InfoModal) */}
          <InfoModal
            open={Boolean(modalOpen && selectedPulse)}
            onClose={() => setModalOpen(false)}
            title={
              <>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{selectedPulse?.index}</span>
              </>
            }
            ariaLabel={`${selectedPulse?.index} Info Modal`}
            onAfterClose={() => {
              // Clear selectedPulse only after modal fully closed
              setSelectedPulse(null);
            }}
          >
            {/* Modal Content */}
            <div className="space-y-6 w-full max-w-2xl mx-auto">

              {/* Price and Change */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{modalDisplayPulse?.value ?? selectedPulse?.value}</span>
                    {(modalDisplayPulse?.timeframe ?? selectedPulse?.timeframe) && (
                      <span
                        title={(modalDisplayPulse?.timeframe ?? selectedPulse?.timeframe) === '24H' ? '24 hours (around the clock)' : `Last ${modalDisplayPulse?.timeframe ?? selectedPulse?.timeframe}`}
                        className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700"
                      >
                        {humanTimeframeLabel(modalDisplayPulse?.timeframe ?? selectedPulse?.timeframe)}
                        {(modalDisplayPulse?.afterHours ?? selectedPulse?.afterHours) ? <span className="ml-1 text-[10px] text-orange-300 font-bold">AH</span> : null}
                      </span>
                    )}
                  </div>
                  <span className={`text-sm font-semibold ${modalDisplayPulse?.color ?? selectedPulse?.color} flex items-center`}>
                    {modalDisplayPulse?.color?.includes('green') ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                    {modalDisplayPulse?.change ?? selectedPulse?.change}
                  </span>
                </div>
              </div>

              {/* Chart Placeholder */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center">
                  <span className="text-gray-600 dark:text-gray-400 text-lg" data-testid="modal-chart-placeholder">[Stock Chart Placeholder{modalChartTimeframe ? ` - ${modalChartTimeframe}` : ''}]</span>
                </div>
              </div>

              {/* Timeline Filter (right above chart placeholder) */}
              <div className="flex items-center justify-center gap-2">
                <div className="text-sm text-gray-500 mr-2">Timeline:</div>
                {(['1D','1W','1M','1Y'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={modalChartTimeframe === t}
                    data-testid={`modal-chart-filter-${t}`}
                    title={`Show ${t} timeframe`}
                    onClick={() => setModalChartTimeframe(t)}
                    className={`min-w-[40px] px-2 py-1 text-xs rounded ${modalChartTimeframe === t ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Description */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedPulse ? pulseDescriptions[selectedPulse.index] : 'No description available.'}
                </p>
              </div>

            </div>
          </InfoModal>

          {/* Info Modal for Live Setup Scans (refactored into InfoModal) */}
          <InfoModal
            open={signalFeedInfoOpen}
            onClose={() => setSignalFeedInfoOpen(false)}
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
            </div>
          </InfoModal>
          
          {/* Legal Disclaimer */}
          {showDisclaimer && (
            <div
              className={`relative p-4 bg-orange-900/60 border border-orange-700/50 text-orange-100 text-xs text-center shadow-lg rounded-lg mt-8 transition-opacity transform ${closingDisclaimer ? 'opacity-0 -translate-y-1' : 'opacity-100 translate-y-0'}`}
              aria-hidden={closingDisclaimer}
            >
              <button
                type="button"
                aria-label="Close disclaimer"
                className="absolute top-1/2 right-2 transform -translate-y-1/2 p-1 rounded hover:bg-orange-800/30 text-orange-100"
                onClick={() => {
                  // Start closing animation then hide
                  setClosingDisclaimer(true);
                  if (closingTimer.current) {
                    window.clearTimeout(closingTimer.current);
                  }
                  closingTimer.current = window.setTimeout(() => {
                    setShowDisclaimer(false);
                    setClosingDisclaimer(false);
                    closingTimer.current = null;
                  }, 220); // matches Tailwind duration-200
                }}
              >
                <X className="w-4 h-4" />
              </button>
              <p className="font-medium">
                ⚠️ Disclaimer: This data is for informational/testing purposes and is NOT financial advice.
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Hide BottomNav when modal is open */}
      {!(modalOpen || infoModalOpen || signalFeedInfoOpen || closingDisclaimer) && (
        <div className="fixed bottom-0 left-0 w-full z-40">
          {/* ...existing BottomNav code... */}
        </div>
      )}
    </div>
  );
}

// Note: InfoModal component has been extracted to components/InfoModal.tsx