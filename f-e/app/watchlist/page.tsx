"use client";

import React, { useState } from 'react';
import CollapsibleSection from '../../components/ui/CollapsibleSection';
import WatchListItem from '../../components/watchlist/WatchListItem';
import { Info, LineChart, Plus, ChevronDown } from 'lucide-react';

// Ticker to name mapping for Market Pulse
const tickerNames: Record<string, string> = {
  '^GSPC': 'SP 500',
  '^DJI': 'DOW',
  '^IXIC': 'Nasdaq',
  '^VIX': 'VIX (Fear Index)',
  // 'DGS10': '10-Yr Yield',  // Temporarily disabled
  'BTC-USD': 'Bitcoin',
  'GC=F': 'Gold',
  'SI=F': 'Silver',
  'CL=F': 'Crude Oil',
  '^RUT': 'Russell 2000',
  // 'DGS2': '2-Yr Yield',  // Temporarily disabled
  'ETH-USD': 'Ethereum',
  'HG=F': 'Copper',
  'NG=F': 'Natural Gas'
};

// Asset class groupings
const assetClasses: Record<string, { name: string; tickers: string[]; icon?: string }> = {
  indexes: {
    name: 'Stock Indexes',
    tickers: ['^GSPC', '^DJI', '^IXIC', '^RUT', '^VIX'],
    icon: '📈'
  },
  crypto: {
    name: 'Cryptocurrency',
    tickers: ['BTC-USD', 'ETH-USD'],
    icon: '₿'
  },
  minerals: {
    name: 'Precious Metals',
    tickers: ['GC=F', 'SI=F', 'HG=F'],
    icon: '🥇'
  },
  energy: {
    name: 'Energy',
    tickers: ['CL=F', 'NG=F'],
    icon: '⚡'
  },
  sentiment: {
    name: 'Market Sentiment',
    tickers: ['CALL/PUT Ratio'],
    icon: '📊'
  }
};


export default function WatchlistPage() {
  const [pulseTimeframe, setPulseTimeframe] = useState<'D'|'W'|'M'|'Y'>('D');
  // Track open state of sections
  const [marketPulseOpen, setMarketPulseOpen] = useState(true);
  // Track if fixed header should be shown
  const [showFixedHeader, setShowFixedHeader] = useState(false);
  // Track drawer open state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // Track collapsible section states
  const [section1Expanded, setSection1Expanded] = useState(true);
  const [section2Expanded, setSection2Expanded] = useState(false);
  // Track selected timeframe for market data
  const [selectedTimeframe, setSelectedTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('day');
  // Track brief loading state when switching timeframes
  const [timeframeSwitching, setTimeframeSwitching] = useState(false);

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
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 60 second timeout
      
      const res = await fetch(`http://127.0.0.1:8000/api/market-data/?tickers=${encodeURIComponent(tickers)}`, {
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

  // Poll for real-time updates every 20 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      fetchMarketData(true); // Don't show loading for polling
    }, 20000); // 20 seconds

    return () => clearInterval(interval);
  }, [fetchMarketData]);

  // Filter pulses by chosen timeframe and group by asset class (prefer backend market data when available)
  const groupedPulse = React.useMemo(() => {
    const backendEntries = Object.keys(marketData || {});
    if (backendEntries.length > 0) {
      const grouped: Record<string, any[]> = {};

      // Initialize groups
      Object.keys(assetClasses).forEach(classKey => {
        grouped[classKey] = [];
      });

      backendEntries.forEach((ticker) => {
        const timeframeData = marketData[ticker]?.timeframes?.[selectedTimeframe];
        const item = {
          ticker: tickerNames[ticker] || ticker,
          symbol: ticker,
          price: timeframeData?.latest?.close ? Number(timeframeData.latest.close).toFixed(2) : 'N/A',
          change: timeframeData?.latest?.change ?? 0,
          valueChange: timeframeData?.latest?.value_change ?? 0,
          sparkline: timeframeData?.closes ?? [],
          timeframe: selectedTimeframe.toUpperCase(),
          afterHours: timeframeData?.latest?.is_after_hours ?? false,
          rv: marketData[ticker]?.rv ?? null
        };

        // Find which asset class this ticker belongs to
        let foundClass = 'sentiment'; // Default fallback
        for (const [classKey, classData] of Object.entries(assetClasses)) {
          if (classData.tickers.includes(ticker)) {
            foundClass = classKey;
            break;
          }
        }
        grouped[foundClass].push(item);
      });

      return grouped;
    }

    // Return empty groups when loading or no data
    const emptyGrouped: Record<string, any[]> = {};
    Object.keys(assetClasses).forEach(classKey => {
      emptyGrouped[classKey] = [];
    });
    return emptyGrouped;
  }, [marketData, selectedTimeframe]);

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

  // Disable body scroll when drawer is open
  React.useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  return (
    <div className="min-h-screen pb-62 bg-white text-gray-900 dark:bg-gray-900/20 dark:text-white font-sans">

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
          {showFixedHeader && !error && (
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
              infoButton={marketPulseOpen && !loading && !error ? (
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
                </div>
              ) : null}
                openKey={pulseTimeframe}
              open={marketPulseOpen}
              onOpenChange={(isOpen) => setMarketPulseOpen(isOpen)}
            >
              {/* Toggle between slider and list view for Market Pulse items */}
              {error && loading && (
                <div className='flex justify-between items-center'>
                  <div className='lg:h-16 items-center justify-start pt-1 mr-4'>
                    <p className='text-[#999] mb-2'>Quick look at key market indicators</p>
                  </div>
                </div>
              )}
              <div data-testid="market-pulse-container" className="relative flex flex-col gap-6">
                {loading || timeframeSwitching ? (
                  // Show loading skeletons for all expected tickers
                  Object.keys(assetClasses).map((classKey) => {
                    const classData = assetClasses[classKey];
                    return (
                      <div key={`skeleton-group-${classKey}`} className="space-y-3">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">{classData.icon}</span>
                          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                            {classData.name}
                          </h3>
                        </div>
                        {classData.tickers.map((ticker) => (
                          <div key={`skeleton-${ticker}`} className="flex-shrink-0 w-full">
                            <PulseSkeleton />
                          </div>
                        ))}
                      </div>
                    );
                  })
                ) : error ? (
                  // Show error state with retry option
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="w-12 h-12 text-gray-400 mb-4">
                      <svg className="animate-spin" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Unable to Load Market Data</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md">{error}</p>

                    <button
                      onClick={() => {
                        setRetryCount(0); // Reset retry count for manual retry
                        fetchMarketData();
                      }}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? 'Retrying...' : 'Try Again'}
                    </button>
                  </div>
                ) : (
                  // Show actual data when loaded, grouped by asset class
                  Object.keys(assetClasses).map((classKey) => {
                    const classData = assetClasses[classKey];
                    const items = groupedPulse[classKey] || [];

                    // Only show sections that have items
                    if (items.length === 0) return null;

                    return (
                      <div key={classKey} className="space-y-3">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">{classData.icon}</span>
                          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                            {classData.name}
                          </h3>
                        </div>
                        {items.map((pulse, index) => (
                          <div key={`${classKey}-${index}`} className="flex-shrink-0 w-full">
                            <WatchListItem
                              name={(pulse as any).ticker ?? (pulse as any).name ?? (pulse as any).index ?? '—'}
                              symbol={(pulse as any).symbol ?? (pulse as any).ticker ?? '—'}
                              price={(pulse as any).price ?? (typeof (pulse as any).value === 'number' ? (pulse as any).value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String((pulse as any).value))}
                              change={typeof (pulse as any).change === 'string' ? parseFloat(((pulse as any).change as string).replace('%', '')) : (pulse as any).change}
                              valueChange={(pulse as any).valueChange}
                              sparkline={(pulse as any).sparkline ?? (pulse as any).trend}
                              timeframe={(pulse as any).timeframe}
                              afterHours={(pulse as any).afterHours}
                              rv={(pulse as any).rv}
                            />
                          </div>
                        ))}
                      </div>
                    );
                  })
                )}
              </div>
            </CollapsibleSection>
          </div>
        </div>
      </div>

      {/* Floating Button */}
      <>
        <div className="fixed bottom-28 right-4 z-50">
          <button 
            className="bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
            onClick={() => setIsDrawerOpen(true)}
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      {/* Bottom Drawer */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[99] transition-opacity ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsDrawerOpen(false)}
      >
        <div
          className={`fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-800/20 backdrop-blur-lg shadow-lg z-[100] transform transition-transform max-h-[80vh] ${isDrawerOpen ? 'translate-y-0' : 'translate-y-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <LineChart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold">Manage Watchlist</h2>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Timeframes */}
              <button
                className={`text-2xl mt-4 flex items-center justify-between w-full text-left transition-opacity ${section2Expanded ? 'opacity-50' : ''}`}
                onClick={() => {
                  setSection1Expanded(!section1Expanded);
                  setSection2Expanded(false); // Close other sections
                }}
              >
                <h3>Timeframes</h3>
                <ChevronDown className={`w-5 h-5 transition-transform ${section1Expanded ? 'rotate-180' : ''}`} />
              </button>
              {section1Expanded && (
                <div className="mt-2">
                  {/* Timeframe Mode Buttons */}
                  <div className="flex gap-2 mb-4 w-full">
                    {(['Day', 'Week', 'Month', 'Year'] as const).map((mode) => (
                      <button
                        key={mode}
                        className={`flex-1 px-3 py-1 text-sm rounded transition-colors ${
                          selectedTimeframe === mode.toLowerCase()
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        onClick={() => {
                          const newTimeframe = mode.toLowerCase() as 'day' | 'week' | 'month' | 'year';
                          if (newTimeframe !== selectedTimeframe) {
                            setTimeframeSwitching(true);
                            setSelectedTimeframe(newTimeframe);
                            setTimeout(() => setTimeframeSwitching(false), 500);
                          }
                          setIsDrawerOpen(false);
                        }}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                  {/* Description */}
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div>Day - 5 Minute Chart</div>
                    <div>Week - 1 Hour Chart</div>
                    <div>Month - 4 Hour Chart</div>
                    <div>Year - 1 Day Chart</div>
                  </div>
                </div>
              )}

              {/* Section 2 */}
              <button
                className={`text-2xl mt-4 flex items-center justify-between w-full text-left transition-opacity ${section1Expanded ? 'opacity-50' : ''}`}
                onClick={() => {
                  setSection2Expanded(!section2Expanded);
                  setSection1Expanded(false); // Close other sections
                }}
              >
                <h3>Section 2</h3>
                <ChevronDown className={`w-5 h-5 transition-transform ${section2Expanded ? 'rotate-180' : ''}`} />
              </button>
              {section2Expanded && (
                <div className="mt-2">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Section 2 Content</h2>
                </div>
              )}
            </div>

            {/* Close button of Bottom Drawer */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 w-full py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      </>
    </div>
  );
}
