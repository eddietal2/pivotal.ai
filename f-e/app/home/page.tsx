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

// Mock data for the Global Market Pulse
const mockPulse = [
  // Daily data (D)
  { index: 'S&P 500', value: 5210.45, change: '+0.82%', color: 'text-green-500', trend: [5180, 5190, 5200, 5205, 5210], timeframe: '1D', afterHours: false },
  { index: 'DOW', value: 39850.20, change: '+0.65%', color: 'text-green-500', trend: [39500, 39600, 39700, 39800, 39850], timeframe: '1D', afterHours: false },
  { index: 'Nasdaq', value: 16250.75, change: '+1.15%', color: 'text-green-500', trend: [16000, 16100, 16150, 16200, 16250], timeframe: '1D', afterHours: false },
  { index: 'CALL/PUT Ratio', value: 50.20, change: '3.10%', color: 'text-green-500', trend: [16.1, 15.2, 14.0, 13.8, 56.2], timeframe: '1D', afterHours: false },
  { index: 'AAII Retailer Investor Sentiment', value: 13.20, change: '-3.10%', color: 'text-green-500', trend: [16.1, 15.2, 14.0, 13.8, 13.2], timeframe: '1D', afterHours: false },
  { index: 'VIX (Fear Index)', value: 14.85, change: '-8.20%', color: 'text-green-500', trend: [18.5, 17.2, 16.1, 15.4, 14.8], timeframe: '1W', afterHours: false },
  { index: '10-Yr Yield', value: 4.15, change: '+0.05%', color: 'text-red-500', trend: [4.05, 4.06, 4.10, 4.12, 4.15], timeframe: '1D', afterHours: false },
  { index: 'Bitcoin', value: 43250.00, change: '+2.15%', color: 'text-green-500', trend: [41200, 42000, 42500, 43000, 43250], timeframe: '24H', afterHours: true },
  { index: 'Gold', value: 2150.50, change: '+1.25%', color: 'text-green-500', trend: [2100, 2120, 2130, 2140, 2150], timeframe: '1D', afterHours: false },
  { index: 'Silver', value: 28.75, change: '-0.50%', color: 'text-red-500', trend: [29.0, 28.8, 28.6, 28.5, 28.7], timeframe: '1D', afterHours: false },
  { index: 'Crude Oil', value: 85.50, change: '+1.20%', color: 'text-green-500', trend: [83.0, 84.0, 84.5, 85.0, 85.5], timeframe: '1D', afterHours: false },
  { index: 'Russell 2000', value: 2200.45, change: '+1.50%', color: 'text-green-500', trend: [2150, 2170, 2180, 2190, 2200], timeframe: '1D', afterHours: false },
  { index: '2-Yr Yield', value: 4.25, change: '-0.02%', color: 'text-red-500', trend: [4.27, 4.26, 4.25, 4.24, 4.25], timeframe: '1D', afterHours: false },
  { index: 'Ethereum', value: 3500.00, change: '+2.80%', color: 'text-green-500', trend: [3400, 3450, 3475, 3490, 3500], timeframe: '24H', afterHours: true },
  { index: 'Copper', value: 4.50, change: '+1.10%', color: 'text-green-500', trend: [4.35, 4.40, 4.45, 4.48, 4.50], timeframe: '1D', afterHours: false },
  { index: 'Natural Gas', value: 3.20, change: '-0.50%', color: 'text-red-500', trend: [3.25, 3.22, 3.20, 3.18, 3.20], timeframe: '1D', afterHours: false },

  // Weekly data (W)
  { index: 'S&P 500', value: 5185.32, change: '+2.45%', color: 'text-green-500', trend: [5120, 5140, 5160, 5170, 5185], timeframe: '1W', afterHours: false },
  { index: 'DOW', value: 39500.10, change: '+1.80%', color: 'text-green-500', trend: [38800, 39000, 39200, 39400, 39500], timeframe: '1W', afterHours: false },
  { index: 'Nasdaq', value: 16000.50, change: '+3.20%', color: 'text-green-500', trend: [15500, 15600, 15700, 15800, 16000], timeframe: '1W', afterHours: false },
  { index: 'CALL/PUT Ratio', value: 48.50, change: '2.80%', color: 'text-green-500', trend: [15.5, 16.0, 16.5, 17.0, 48.5], timeframe: '1W', afterHours: false },
  { index: 'AAII Retailer Investor Sentiment', value: 14.10, change: '-2.50%', color: 'text-red-500', trend: [16.5, 15.8, 15.0, 14.5, 14.1], timeframe: '1W', afterHours: false },
  { index: 'VIX (Fear Index)', value: 14.85, change: '-8.20%', color: 'text-green-500', trend: [18.5, 17.2, 16.1, 15.4, 14.8], timeframe: '1W', afterHours: false },
  { index: '10-Yr Yield', value: 4.12, change: '+0.18%', color: 'text-red-500', trend: [3.95, 4.02, 4.08, 4.10, 4.12], timeframe: '1W', afterHours: false },
  { index: 'Bitcoin', value: 42800.50, change: '+5.75%', color: 'text-green-500', trend: [39500, 40500, 41500, 42000, 42800], timeframe: '1W', afterHours: false },
  { index: 'Gold', value: 2120.25, change: '+2.10%', color: 'text-green-500', trend: [2050, 2080, 2100, 2110, 2120], timeframe: '1W', afterHours: false },
  { index: 'Silver', value: 27.90, change: '+1.20%', color: 'text-green-500', trend: [26.5, 27.0, 27.2, 27.5, 27.9], timeframe: '1W', afterHours: false },
  { index: 'Crude Oil', value: 82.30, change: '+2.50%', color: 'text-green-500', trend: [78.0, 79.5, 80.5, 81.5, 82.3], timeframe: '1W', afterHours: false },
  { index: 'Russell 2000', value: 2185.32, change: '+2.80%', color: 'text-green-500', trend: [2120, 2140, 2160, 2170, 2185], timeframe: '1W', afterHours: false },
  { index: '2-Yr Yield', value: 4.22, change: '+0.15%', color: 'text-red-500', trend: [4.05, 4.12, 4.18, 4.20, 4.22], timeframe: '1W', afterHours: false },
  { index: 'Ethereum', value: 3450.50, change: '+6.20%', color: 'text-green-500', trend: [31500, 32500, 33500, 34000, 34500], timeframe: '1W', afterHours: false },
  { index: 'Copper', value: 4.35, change: '+2.50%', color: 'text-green-500', trend: [4.10, 4.15, 4.20, 4.30, 4.35], timeframe: '1W', afterHours: false },
  { index: 'Natural Gas', value: 3.15, change: '+1.00%', color: 'text-green-500', trend: [3.05, 3.08, 3.10, 3.12, 3.15], timeframe: '1W', afterHours: false },

  // Monthly data (M)
  { index: 'S&P 500', value: 5120.78, change: '+4.12%', color: 'text-green-500', trend: [4850, 4920, 4980, 5050, 5120], timeframe: '1M', afterHours: false },
  { index: 'DOW', value: 38500.45, change: '+3.50%', color: 'text-green-500', trend: [37500, 37800, 38000, 38200, 38500], timeframe: '1M', afterHours: false },
  { index: 'Nasdaq', value: 15500.30, change: '+5.80%', color: 'text-green-500', trend: [14500, 14800, 15000, 15200, 15500], timeframe: '1M', afterHours: false },
  { index: 'CALL/PUT Ratio', value: 45.30, change: '4.50%', color: 'text-green-500', trend: [14.0, 15.0, 16.0, 17.0, 45.3], timeframe: '1M', afterHours: false },
  { index: 'AAII Retailer Investor Sentiment', value: 15.20, change: '-1.80%', color: 'text-red-500', trend: [17.0, 16.5, 16.0, 15.5, 15.2], timeframe: '1M', afterHours: false },
  { index: 'VIX (Fear Index)', value: 16.42, change: '-12.85%', color: 'text-green-500', trend: [22.1, 20.5, 19.2, 17.8, 16.4], timeframe: '1M', afterHours: false },
  { index: '10-Yr Yield', value: 4.08, change: '+0.32%', color: 'text-red-500', trend: [3.78, 3.85, 3.92, 4.01, 4.08], timeframe: '1M', afterHours: false },
  { index: 'Bitcoin', value: 41500.25, change: '+8.92%', color: 'text-green-500', trend: [36500, 37500, 38500, 39500, 41500], timeframe: '1M', afterHours: false },
  { index: 'Gold', value: 2080.75, change: '+3.50%', color: 'text-green-500', trend: [1950, 2000, 2050, 2070, 2080], timeframe: '1M', afterHours: false },
  { index: 'Silver', value: 26.40, change: '+2.80%', color: 'text-green-500', trend: [24.0, 24.5, 25.0, 25.5, 26.4], timeframe: '1M', afterHours: false },
  { index: 'Crude Oil', value: 78.75, change: '+5.00%', color: 'text-green-500', trend: [70.0, 72.0, 74.0, 76.0, 78.8], timeframe: '1M', afterHours: false },
  { index: 'Russell 2000', value: 2120.78, change: '+4.50%', color: 'text-green-500', trend: [1950, 2020, 2080, 2100, 2120], timeframe: '1M', afterHours: false },
  { index: '2-Yr Yield', value: 4.05, change: '+0.45%', color: 'text-red-500', trend: [3.62, 3.75, 3.88, 3.98, 4.05], timeframe: '1M', afterHours: false },
  { index: 'Ethereum', value: 33500.25, change: '+12.50%', color: 'text-green-500', trend: [28500, 29500, 30500, 31500, 33500], timeframe: '1M', afterHours: false },
  { index: 'Copper', value: 4.20, change: '+6.00%', color: 'text-green-500', trend: [3.80, 3.90, 4.00, 4.10, 4.20], timeframe: '1M', afterHours: false },
  { index: 'Natural Gas', value: 3.00, change: '+3.50%', color: 'text-green-500', trend: [2.80, 2.85, 2.90, 2.95, 3.00], timeframe: '1M', afterHours: false },

  // Yearly data (Y)
  { index: 'S&P 500', value: 4850.92, change: '+15.68%', color: 'text-green-500', trend: [4200, 4350, 4500, 4650, 4850], timeframe: '1Y', afterHours: false },
  { index: 'DOW', value: 36000.00, change: '+12.50%', color: 'text-green-500', trend: [32000, 33000, 34000, 35000, 36000], timeframe: '1Y', afterHours: false },
  { index: 'Nasdaq', value: 14000.00, change: '+20.00%', color: 'text-green-500', trend: [11500, 12000, 12500, 13000, 14000], timeframe: '1Y', afterHours: false },
  { index: 'CALL/PUT Ratio', value: 40.00, change: '10.20%', color: 'text-green-500', trend: [10.0, 12.0, 15.0, 20.0, 40.0], timeframe: '1Y', afterHours: false },
  { index: 'AAII Retailer Investor Sentiment', value: 16.50, change: '-5.00%', color: 'text-red-500', trend: [20.0, 18.5, 17.5, 17.0, 16.5], timeframe: '1Y', afterHours: false },
  { index: 'VIX (Fear Index)', value: 18.75, change: '-25.42%', color: 'text-green-500', trend: [28.5, 26.2, 24.1, 21.5, 18.7], timeframe: '1Y', afterHours: false },
  { index: '10-Yr Yield', value: 3.95, change: '+0.85%', color: 'text-red-500', trend: [3.12, 3.25, 3.45, 3.75, 3.95], timeframe: '1Y', afterHours: false },
  { index: 'Bitcoin', value: 38500.75, change: '+45.23%', color: 'text-green-500', trend: [26500, 28500, 30500, 33500, 38500], timeframe: '1Y', afterHours: false },
  { index: 'Gold', value: 1950.00, change: '+10.00%', color: 'text-green-500', trend: [1750, 1800, 1850, 1900, 1950], timeframe: '1Y', afterHours: false },
  { index: 'Silver', value: 24.00, change: '+15.50%', color: 'text-green-500', trend: [20.0, 21.0, 22.0, 23.0, 24.0], timeframe: '1Y', afterHours: false },
  { index: 'Crude Oil', value: 75.00, change: '+12.00%', color: 'text-green-500', trend: [65.0, 67.0, 70.0, 72.0, 75.0], timeframe: '1Y', afterHours: false },
  { index: 'Russell 2000', value: 1950.92, change: '+18.50%', color: 'text-green-500', trend: [1650, 1700, 1750, 1850, 1950], timeframe: '1Y', afterHours: false },
  { index: '2-Yr Yield', value: 3.85, change: '+1.20%', color: 'text-red-500', trend: [3.45, 3.55, 3.65, 3.75, 3.85], timeframe: '1Y', afterHours: false },
  { index: 'Ethereum', value: 31500.75, change: '+55.00%', color: 'text-green-500', trend: [20500, 22500, 24500, 28500, 31500], timeframe: '1Y', afterHours: false },
  { index: 'Copper', value: 3.90, change: '+15.00%', color: 'text-green-500', trend: [3.40, 3.50, 3.60, 3.70, 3.90], timeframe: '1Y', afterHours: false },
  { index: 'Natural Gas', value: 2.80, change: '+8.00%', color: 'text-green-500', trend: [2.50, 2.55, 2.60, 2.70, 2.80], timeframe: '1Y', afterHours: false },
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

  // Filter pulses by chosen timeframe and merge with real data
  const filteredPulse = React.useMemo(() => {
    return mockPulse
      .filter((p) => normalizeTimeframe(p.timeframe) === pulseTimeframe)
      .map((pulse) => {
        const ticker = tickerMapping[pulse.index];
        const realData = ticker && realMarketData[ticker];
        
        if (realData) {
          // Use real data
          const priceData = realData.price;
          const rvData = realData.rv;
          
          // Calculate change percentage (simplified - using first and last close)
          let changePercent = 0;
          if (priceData.closes && priceData.closes.length > 1) {
            const firstClose = priceData.closes[0];
            const lastClose = priceData.latest.close;
            changePercent = ((lastClose - firstClose) / firstClose) * 100;
          }
          
          return {
            ...pulse,
            value: priceData.latest.close,
            change: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
            color: changePercent >= 0 ? 'text-green-500' : 'text-red-500',
            trend: priceData.closes.slice(-20), // Use last 20 closes for sparkline
            rv: rvData ? `${rvData.daily_rv}x (${rvData.daily_grade})` : undefined
          };
        }
        
        return pulse; // Fallback to mock data
      });
  }, [pulseTimeframe, realMarketData]);
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
              {/* Render PivyChat for today inside collapsible */}
                <div className="mb-4">
                {isLoading ? (
                  <MarketOverviewSkeleton />
                ) : (
                  <Link href="/pivy/chat/0">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer flex flex-col justify-between h-48">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">01/07/26</span>
                          <span className="inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse ml-2"></span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">10:30 AM</span>
                        </div>
                        <h3 className="py-2 text-base font-semibold text-gray-900 dark:text-white mb-2">This is a very long title that should test the maximum length for display purposes and see how it wraps.</h3>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">🤖</span> I'm good, thanks! <span className="text-xs text-gray-400">(10:30 AM)</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 self-end mt-4" />
                    </div>
                  </Link>
                )}
              </div>
              {/* Toggle between slider and list view for Market Pulse items */}
              <div className='flex justify-between items-center'>
                <div className='lg:h-16 items-center justify-start pt-1 mr-4'>
                  <p className='text-[#999]'>Quick look at key market indicators</p>
                </div>
                <div className="mb-4 inline-flex float-right rounded-md border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 p-1" role="tablist" aria-label="Market Pulse view toggle">
                  {/* Slide View */}
                  <button
                      type="button"
                      className={`p-2 rounded ${pulseViewMode === 'slider' ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      aria-pressed={pulseViewMode === 'slider'}
                      aria-label="Slide view"
                      data-testid="pulse-view-toggle-slider"
                      onClick={() => handleSetPulseViewMode('slider')}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 stroke-current">
                        <path d="M6 8C6 5.17157 6 3.75736 6.87868 2.87868C7.75736 2 9.17157 2 12 2C14.8284 2 16.2426 2 17.1213 2.87868C18 3.75736 18 5.17157 18 8V16C18 18.8284 18 20.2426 17.1213 21.1213C16.2426 22 14.8284 22 12 22C9.17157 22 7.75736 22 6.87868 21.1213C6 20.2426 6 18.8284 6 16V8Z" stroke="currentColor" strokeWidth="1.5"/>
                        <path opacity="0.5" d="M18 19.5C19.4001 19.5 20.1002 19.5 20.635 19.2275C21.1054 18.9878 21.4878 18.6054 21.7275 18.135C22 17.6002 22 16.9001 22 15.5V8.5C22 7.09987 22 6.3998 21.7275 5.86502C21.4878 5.39462 21.1054 5.01217 20.635 4.77248C20.1002 4.5 19.4001 4.5 18 4.5" stroke="currentColor" strokeWidth="1.5"/>
                        <path opacity="0.5" d="M6 19.5C4.59987 19.5 3.8998 19.5 3.36502 19.2275C2.89462 18.9878 2.51217 18.6054 2.27248 18.135C2 17.6002 2 16.9001 2 15.5V8.5C2 7.09987 2 6.3998 2.27248 5.86502C2.51217 5.39462 2.89462 5.01217 3.36502 4.77248C3.8998 4.5 4.59987 4.5 6 4.5" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
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
              <div data-testid="market-pulse-container" className={`relative ${pulseViewMode === 'slider' ? 'flex flex-row gap-4 overflow-x-auto scrollbar-thin snap-x snap-mandatory' : 'flex flex-col gap-4'} ${pulseViewAnimating ? 'opacity-70 scale-95' : 'opacity-100 scale-100'} transition-all duration-200 ease-in-out`}>
                
                {isLoading || marketDataLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <MarketPulseSkeleton key={i} />)
                ) : (
                  filteredPulse.map((pulse, index) => (
                    <div key={index} className={`flex-shrink-0 ${pulseViewMode === 'slider' ? 'w-64 h-32' : 'w-full'}`}>
                      <WatchListItem
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
                    </div>
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
          {isLoading ? (
            <DisclaimersSkeleton />
          ) : (
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
          )}
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