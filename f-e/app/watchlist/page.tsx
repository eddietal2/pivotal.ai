"use client";

import React, { useState } from 'react';
import CollapsibleSection from '../../components/ui/CollapsibleSection';
import WatchListItem from '../../components/watchlist/WatchListItem';
import { Info } from 'lucide-react';

// Ticker to name mapping for Market Pulse
const tickerNames: Record<string, string> = {
  '^GSPC': 'SP 500',
  '^DJI': 'DOW',
  '^IXIC': 'Nasdaq',
  '^VIX': 'VIX (Fear Index)',
  'DGS10': '10-Yr Yield',
  'BTC-USD': 'Bitcoin',
  'GC=F': 'Gold',
  'SI=F': 'Silver',
  'CL=F': 'Crude Oil',
  '^RUT': 'Russell 2000',
  'DGS2': '2-Yr Yield',
  'ETH-USD': 'Ethereum',
  'HG=F': 'Copper',
  'NG=F': 'Natural Gas'
};

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

export default function WatchlistPage() {
  const [pulseTimeframe, setPulseTimeframe] = useState<'D'|'W'|'M'|'Y'>('D');
  // Track open state of sections
  const [marketPulseOpen, setMarketPulseOpen] = useState(true);
  // Track if fixed header should be shown
  const [showFixedHeader, setShowFixedHeader] = useState(false);

  // Market data state (from b-e financial_data)
  const [marketData, setMarketData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const callCountRef = React.useRef(0);
  const lastCallStartRef = React.useRef<number | null>(null);
  const betweenCallTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const collapsibleSectionRef = React.useRef<HTMLDivElement>(null);

  // Normalize timeframe string to a category: D, W, M, Y
  const normalizeTimeframe = (tf?: string) => {
    if (!tf) return 'D';
    const t = tf.toUpperCase();
    if (t.includes('24H') || t.endsWith('D') || t.includes('DAY') || t === '1D') return 'D';
    if (t.includes('W') || t.includes('WEEK')) return 'W';
    if (t.includes('M') && !t.includes('MS')) return 'M';
    if (t.includes('Y') || t.includes('YEAR')) return 'Y';
    return 'D';
  };

  // Fetch market data directly from Python server
  const fetchMarketData = React.useCallback(async (isRetry = false) => {
    let timer: NodeJS.Timeout | null = null;
    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);

        // Clear the between-call timer
        if (betweenCallTimerRef.current) {
          clearInterval(betweenCallTimerRef.current);
          betweenCallTimerRef.current = null;
        }

        const now = Date.now();
        lastCallStartRef.current = now;

        callCountRef.current++;
        if (callCountRef.current === 1) console.log('Initial Call');
        else console.log(`${['Second', 'Third', 'Fourth', 'Fifth'][callCountRef.current - 2] || `${callCountRef.current}th`} Call`);

        const start = Date.now();
        timer = setInterval(() => {
          const elapsed = Math.floor((Date.now() - start) / 1000);
          if (elapsed > 0) {
            console.log(elapsed);
          }
        }, 1000);
      }

      const tickers = Object.keys(tickerNames).join(',');
      console.log('Fetching market data for tickers:', tickers);
      
      // Call Python server directly (adjust URL/port as needed)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      const res = await fetch(`http://192.168.1.68:8000/api/market-data/?tickers=${encodeURIComponent(tickers)}`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log('Fetch response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`Server responded with status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Fetched market data:', data);
      
      setMarketData(data);
      setError(null);
      setRetryCount(0);
    } catch (err: any) {
      console.error('Error fetching market data:', err);
      
      let errorMessage = 'Failed to load market data';
      
      if (err.name === 'AbortError') {
        errorMessage = 'Request timed out. The server may be busy fetching data. Please try again.';
      } else if (err.message.includes('Failed to fetch') || err.message.includes('ERR_CONNECTION_REFUSED')) {
        errorMessage = 'Unable to connect to the market data server. Please ensure the backend server is running.';
      } else if (err.message.includes('Server responded with status')) {
        errorMessage = `Server error: ${err.message}`;
      } else {
        errorMessage = `Network error: ${err.message}`;
      }
      
      setError(errorMessage);
      
      // Auto-retry up to 2 times with exponential backoff
      if (retryCount < 3) {
        const delay = 10000; // every 10s
        console.log(`Retrying in ${delay}ms... (attempt ${retryCount + 1}/3)`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchMarketData(true);
        }, delay);
      }
    } finally {
      if (timer) clearInterval(timer);
      setLoading(false);

      // Start the between-call timer
      if (!isRetry && lastCallStartRef.current) {
        betweenCallTimerRef.current = setInterval(() => {
          const elapsed = Date.now() - lastCallStartRef.current!;
          const seconds = Math.floor(elapsed / 1000);
          if (seconds > 0) {
            console.log(seconds);
          }
        }, 1000);
      }
    }
  }, [retryCount, tickerNames]);

  React.useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  // Poll for real-time updates every 60 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      fetchMarketData();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [fetchMarketData]);

  // Filter pulses by chosen timeframe (prefer backend market data when available)
  const filteredPulse = React.useMemo(() => {
    const backendEntries = Object.keys(marketData || {});
    if (backendEntries.length > 0) {
      return backendEntries.map((ticker) => ({
        ticker: tickerNames[ticker] || ticker,
        symbol: ticker,
        price: marketData[ticker]?.close ? Number(marketData[ticker].close).toFixed(2) : 'N/A',
        change: marketData[ticker]?.change ?? 0,
        sparkline: marketData[ticker]?.sparkline ?? [],
        timeframe: '24H',
        afterHours: marketData[ticker]?.is_after_hours ?? false,
        rv: marketData[ticker]?.rv ?? null
      }));
    }

    // Return empty array when loading or no data - no fallback to mock data
    return [];
  }, [marketData, pulseTimeframe]);

  // Loading skeleton component for Market Pulse items
  const PulseSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm dark:shadow-lg border border-gray-200 dark:border-gray-700 w-full h-24 animate-pulse">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-18 h-7 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="flex flex-col gap-1">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
          </div>
        </div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
      </div>
    </div>
  );
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      
      // Show fixed header when user has scrolled down enough that the CollapsibleSection header
      // would be out of view if it weren't sticky
      // Lower threshold for more responsive behavior
      setShowFixedHeader(scrollTop > 40);
    };

    window.addEventListener('scroll', handleScroll);
    // Check initial state
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

          {/* Fixed positioned market pulse header for Sticky Effect */}
          {showFixedHeader && (
            <div className="fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="lg:px-64 px-4 sm:px-8 py-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="flex items-center gap-2 text-lg font-semibold hover:bg-gray-800 px-2 py-1 rounded transition-colors"
                    onClick={() => {
                      setMarketPulseOpen(false);
                      // Scroll to top if not already at top
                      if (window.scrollY > 0) {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    aria-label="Collapse Market Pulse section"
                  >
                    <span className={`transition-transform duration-200 ${marketPulseOpen ? '' : 'rotate-180'}`}>▼</span>
                    Market Pulse
                  </button>
                  <div className="flex items-center gap-2">
                    {/* Overview info button */}
                    <button
                      type="button"
                      className="p-1 rounded-full hover:bg-gray-800 transition ml-2"
                      title="Learn more about Market Overview"
                      aria-label="More info about Market Overview"
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
                </div>
              </div>
            </div>
          )}

          {/* Global Market Pulse */}
          <div ref={collapsibleSectionRef} className="sticky top-0 z-10 bg-white dark:bg-gray-900/20 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
            <CollapsibleSection
              title={
                <span className="flex items-center gap-2">
                  Market Pulse
                </span>
              }
              infoButton={marketPulseOpen ? (
                <div className="flex items-center gap-2">
                  {/* Overview info button */}
                  <button
                    type="button"
                    className="p-1 rounded-full hover:bg-gray-800 transition ml-2"
                    title="Learn more about Market Overview"
                    aria-label="More info about Market Overview"
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
              open={marketPulseOpen}
              onOpenChange={(isOpen) => setMarketPulseOpen(isOpen)}
            >
              {/* Toggle between slider and list view for Market Pulse items */}
              <div className='flex justify-between items-center'>
                <div className='lg:h-16 items-center justify-start pt-1 mr-4'>
                  <p className='text-[#999] mb-2'>Quick look at key market indicators</p>
                </div>
              </div>
              <div data-testid="market-pulse-container" className="relative flex flex-col gap-4">
                
                {loading ? (
                  // Show loading skeletons for all expected tickers
                  Object.keys(tickerNames).map((ticker) => (
                    <div key={`skeleton-${ticker}`} className="flex-shrink-0 w-full">
                      <PulseSkeleton />
                    </div>
                  ))
                ) : error ? (
                  // Show error state with retry option
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="w-12 h-12 text-gray-400 mb-4">
                      <svg className="animate-spin" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Unable to Load Market Data</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md">
                      We're having trouble connecting to the market data server. This could be because the backend server isn't running or there's a network issue.
                    </p>
                    <button
                      onClick={() => fetchMarketData()}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? 'Retrying...' : 'Try Again'}
                    </button>
                  </div>
                ) : (
                  // Show actual data when loaded
                  filteredPulse.map((pulse, index) => (
                    <div key={index} className="flex-shrink-0 w-full">
                      <WatchListItem
                        name={(pulse as any).ticker ?? (pulse as any).name ?? (pulse as any).index ?? '—'}
                        symbol={(pulse as any).symbol ?? (pulse as any).ticker ?? '—'}
                        price={(pulse as any).price ?? (typeof (pulse as any).value === 'number' ? (pulse as any).value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String((pulse as any).value))}
                        change={typeof (pulse as any).change === 'string' ? parseFloat(((pulse as any).change as string).replace('%', '')) : (pulse as any).change}
                        sparkline={(pulse as any).sparkline ?? (pulse as any).trend}
                        timeframe={(pulse as any).timeframe}
                        afterHours={(pulse as any).afterHours}
                        rv={(pulse as any).rv}
                      />
                    </div>
                  ))
                )}
              </div>
            </CollapsibleSection>
          </div>
        </div>
      </div>
    </div>
  );
}
