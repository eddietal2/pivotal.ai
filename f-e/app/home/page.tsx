'use client';
  

import React from 'react';
import InfoModal from '@/components/modals/InfoModal';
import { lockScroll, unlockScroll } from '@/components/modals/scrollLock';
import CollapsibleSection from '@/components/ui/CollapsibleSection';
import { useToast } from '@/components/context/ToastContext';
import SignalFeedItem from '@/components/ui/SignalFeedItem';
import { useUI } from '@/components/context/UIContext';
import { ListChecks, ArrowUpRight, ArrowDownRight, TrendingUp, Info, X, Cpu, List, Grid, AlertTriangle, FileText } from 'lucide-react';
import SignalEducationCard from '@/components/ui/SignalEducationCard';
import signalEducationCards from '@/components/ui/signalEducationData';
import WatchListItem from '@/components/watchlist/WatchListItem';
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
  { index: 'CALL/PUT Ratio', value: 50.20, change: '3.10%', color: 'text-green-500', trend: [16.1, 15.2, 14.0, 13.8, 56.2], timeframe: '1D', afterHours: false },
  { index: 'AAII Retailer Investor Sentiment', value: 13.20, change: '-3.10%', color: 'text-green-500', trend: [16.1, 15.2, 14.0, 13.8, 13.2], timeframe: '1D', afterHours: false },
  { index: 'VIX (Fear Index)', value: 14.85, change: '-8.20%', color: 'text-green-500', trend: [18.5, 17.2, 16.1, 15.4, 14.8], timeframe: '1W', afterHours: false },
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

// --- Using shared WatchListItem from components/watchlist



// 4. Main Application Layout
export default function App() {
  const { modalOpen, setModalOpen } = useUI();
  const [selectedPulse, setSelectedPulse] = React.useState<null | typeof mockPulse[0]>(null);
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
  // Modal chart timeframe state (for selectedPulse modal)
  const [modalChartTimeframe, setModalChartTimeframe] = React.useState<'24H'|'1D'|'1W'|'1M'|'1Y'>(() => '1D');
  const { showToast } = useToast();

  // Track open state of sections
  const [marketPulseOpen, setMarketPulseOpen] = React.useState(true);
  const [signalFeedOpen, setSignalFeedOpen] = React.useState(true);

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
    'CALL/PUT Ratio': 'The CALL/PUT Ratio measures the number of call options traded relative to put options. It is often used as a sentiment indicator, with higher ratios indicating bullish sentiment and lower ratios indicating bearish sentiment.',
    '10-Yr Yield': 'The 10-Year Treasury Yield reflects the return on investment for U.S. government bonds maturing in 10 years. It is a key indicator for interest rates and economic outlook.',
    'Bitcoin': 'Bitcoin (BTC) is the world’s largest cryptocurrency by market capitalization. It is a decentralized digital currency that operates without a central bank and is traded globally 24/7. Bitcoin is often seen as a store of value and a hedge against inflation.',
  };

  // Filter pulses by chosen timeframe
  const filteredPulse = React.useMemo(() => mockPulse.filter((p) => normalizeTimeframe(p.timeframe) === pulseTimeframe), [pulseTimeframe]);
  // Filter signals by chosen timeframe
  const filteredSignals = React.useMemo(() => mockSignals.filter((s) => normalizeTimeframe(s.timeframe) === signalTimeframe), [signalTimeframe]);

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900/20 dark:text-white font-sans">

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto lg:px-64">
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
              infoButton={marketPulseOpen ? (
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
              ) : null}
                openKey={pulseTimeframe}
              onOpenChange={(isOpen) => setMarketPulseOpen(isOpen)}
            >
              {/* Render MarketOverview inside collapsible */}
                <div className="mb-4">
                {isLoading ? (
                  <MarketOverviewSkeleton />
                ) : (
                  <MarketOverview
                    pulses={filteredPulse}
                    timeframe={pulseTimeframe}
                    devOverview='placeholder'
                    onOpenInfo={() => setInfoModalOpen(true)}
                    onStateChange={(s) => setOverviewCpuState(s)}
                  />
                )}
              </div>
              {/* Toggle between slider and list view for Market Pulse items */}
              <div className='flex justify-between items-center'>
                <div className='lg:h-16 items-center justify-start pt-1 mr-4'>
                  <p className='text-[#999]'>Quick look at key market indicators</p>
                </div>
                <div className="lg:hidden mb-4 inline-flex float-right rounded-md border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 p-1" role="tablist" aria-label="Market Pulse view toggle">
                  {/* Grid View */}
                  <button
                      type="button"
                      className={`p-2 rounded ${pulseViewMode === 'slider' ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      aria-pressed={pulseViewMode === 'slider'}
                      aria-label="Slider view"
                      data-testid="pulse-view-toggle-slider"
                      onClick={() => handleSetPulseViewMode('slider')}
                    >
                      <Grid className="w-4 h-4" />
                  </button>
                  {/* List View */}
                  <button
                      type="button"
                      className={`p-2 rounded ${pulseViewMode === 'list' ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      aria-pressed={pulseViewMode === 'list'}
                      aria-label="List view"
                      data-testid="pulse-view-toggle-list"
                      onClick={() => handleSetPulseViewMode('list')}
                    >
                      <List className="w-4 h-4" />
                  </button>
              </div>
              </div>
              <div data-testid="market-pulse-container" className={`relative ${pulseViewMode === 'slider' ? 'flex flex-row gap-4 overflow-x-auto snap-x snap-mandatory' : 'flex flex-col gap-4'} sm:grid sm:grid-cols-3 sm:gap-4 ${pulseViewAnimating ? 'opacity-70 scale-95' : 'opacity-100 scale-100'} transition-all duration-200 ease-in-out`}>
                
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <MarketPulseSkeleton key={i} />)
                ) : (
                  filteredPulse.map((pulse, index) => (
                    <WatchListItem
                      key={index}
                      ticker={pulse.index}
                      price={typeof pulse.value === 'number' ? pulse.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(pulse.value)}
                      change={typeof pulse.change === 'string' ? parseFloat(pulse.change.replace('%', '')) : (pulse.change as any)}
                      sparkline={pulse.trend}
                      timeframe={pulse.timeframe}
                      afterHours={pulse.afterHours}
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
              infoButton={signalFeedOpen ? (
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
              ) : null}
                openKey={signalTimeframe}
              onOpenChange={(isOpen) => setSignalFeedOpen(isOpen)}
            >
              <p className='text-[#999]'>Daily market scans using key swing-trading indicators (MACD, RSI, volume, moving averages), producing up to 10 generated leads per trading day.</p>
              <h3 className='my-4 text-lg'>Leads: 12/09/25</h3>
              <div className="flex flex-row gap-4 overflow-x-auto snap-x snap-mandatory sm:grid sm:grid-cols-3 sm:gap-4">

                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <SignalFeedSkeleton key={i} />)
                ) : (
                  filteredSignals.map((signal, index) => (
                    <SignalFeedItem key={index} {...signal} />
                  ))
                )}
                <div className="text-center p-4 sm:col-span-3">
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
          <CollapsibleSection
            title={<span className="flex items-center gap-2">Disclaimers & Risk Notices</span>}
            openKey={'disclaimers'}
          >
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex justify-between items-start gap-3 item-press">
                <div className="item-press-inner relative flex-1">
                  <strong className="block flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" />Stop Loss Reminder</strong>
                  <p className="text-sm text-gray-600 dark:text-gray-300">A stop loss is used to limit an investor's loss on a position. Set one to help protect capital and manage risk.</p>
                </div>
                <div className="flex-shrink-0">
                  <button className="px-3 py-1 rounded bg-indigo-600 text-white text-sm hover:bg-red-700" aria-label="Open stop loss details" data-testid="stop-loss-open-btn" onClick={() => setStopLossModalOpen(true)}>Learn more</button>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex justify-between items-start gap-3 item-press">
                <div className="item-press-inner relative flex-1">
                  <strong className="block flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-300" />Legal Disclaimer</strong>
                  <p className="text-sm text-gray-600 dark:text-gray-300">This data is for informational/testing purposes only and does not constitute financial advice.</p>
                </div>
                <div className="flex-shrink-0">
                  <button className="px-3 py-1 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700" aria-label="Open disclaimer details" data-testid="disclaimer-open-btn" onClick={() => setDisclaimerModalOpen(true)}>Learn more</button>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex justify-between items-start gap-3 item-press">
                <div className="item-press-inner relative flex-1">
                  <strong className="block flex items-center gap-2"><Cpu className="w-4 h-4 text-gray-600" />AI Usage</strong>
                  <p className="text-sm text-gray-600 dark:text-gray-300">This app uses language models (LLMs) to summarize market data and provide context for signals. Learn more about how this works and the model limitations.</p>
                </div>
                <div className="flex-shrink-0">
                  <button className="px-3 py-1 rounded bg-indigo-600 text-white text-sm hover:bg-gray-900" aria-label="Open AI usage details" data-testid="ai-usage-open-btn" onClick={() => setAiUsageModalOpen(true)}>Learn more</button>
                </div>
              </div>
            </div>
          </CollapsibleSection>
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