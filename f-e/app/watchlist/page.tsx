"use client";

import React, { useState } from 'react';
import CollapsibleSection from '../../components/ui/CollapsibleSection';

// Set to true to enable timer/fetch logging
const DEBUG_LOGS = true;
import WatchListItem from '../../components/watchlist/WatchListItem';
import StockPreviewModal from '../../components/stock/StockPreviewModal';
import { Info, LineChart, ChevronDown, Settings } from 'lucide-react';

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
  'NG=F': 'Natural Gas',
  'CALL/PUT Ratio': 'Put/Call Ratio',
  'SOL-USD': 'Solana',
  'XRP-USD': 'Ripple',
  'CRYPTO-FEAR-GREED': 'Crypto Fear & Greed'
};

// Asset class groupings
const assetClasses: Record<string, { name: string; tickers: string[]; icon?: string }> = {
  indexes: {
    name: 'Stock Indexes',
    tickers: ['^GSPC', '^DJI', '^IXIC', '^RUT'],
    icon: '📈'
  },
  crypto: {
    name: 'Cryptocurrency',
    tickers: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'CRYPTO-FEAR-GREED'],
    icon: '₿'
  },
  minerals: {
    name: 'Precious Metals',
    tickers: ['GC=F', 'SI=F', 'HG=F'],
    icon: '⛏️'
  },
  energy: {
    name: 'Energy',
    tickers: ['CL=F', 'NG=F'],
    icon: '⚡'
  },
  bonds: {
    name: 'Treasury Yields',
    tickers: ['DGS10', 'DGS2'],
    icon: '🏛️'
  },
  sentiment: {
    name: 'Market Sentiment',
    tickers: ['^VIX', 'CALL/PUT Ratio'],
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

  // Rearrange mode state
  const [isRearrangeMode, setIsRearrangeMode] = useState(false);
  // Initialize with default order - will be updated from localStorage after mount
  const [assetClassOrder, setAssetClassOrder] = useState<string[]>(Object.keys(assetClasses));
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchCurrentIndex, setTouchCurrentIndex] = useState<number | null>(null);
  const [showReorderSkeleton, setShowReorderSkeleton] = useState(false);

  // Selected stock for preview modal
  const [selectedStock, setSelectedStock] = useState<{
    symbol: string;
    name: string;
    price: number;
    change: number;
    valueChange: number;
    sparkline: number[];
    timeframe: string;
  } | null>(null);

  // Market data state (from b-e financial_data)
  const [marketData, setMarketData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const abortControllerRef = React.useRef<AbortController | null>(null);
  const retryCountRef = React.useRef(0);
  const retryTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = React.useRef(true);
  const betweenCallTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const secondsSinceCallRef = React.useRef(0);

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
    // Skip in test environment
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    
    if (DEBUG_LOGS) console.log(`🚀 Fetching market data${isRetry ? ` (retry #${retryCountRef.current})` : ''}`);
    
    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
        retryCountRef.current = 0; // Reset retry count on fresh fetch
      }

      const tickers = Object.keys(tickerNames).join(',');
      
      // Set up timeout that will abort the request
      const timeoutId = setTimeout(() => {
        if (!controller.signal.aborted) {
          controller.abort();
        }
      }, 60000); // 60 second timeout
      
      const res = await fetch(`http://127.0.0.1:8000/api/market-data/?tickers=${encodeURIComponent(tickers)}`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Check if this request was aborted (by a newer request)
      if (controller.signal.aborted) {
        return; // Silently exit, a newer request is in progress
      }
      
      if (!res.ok) {
        throw new Error(`Server responded with status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (DEBUG_LOGS) console.log('📦 Market data response:', data);
      
      setMarketData(data);
      setError(null);
      retryCountRef.current = 0;
      
      // Start timer to count seconds since last successful call
      if (betweenCallTimerRef.current) {
        clearInterval(betweenCallTimerRef.current);
      }
      secondsSinceCallRef.current = 0;
      betweenCallTimerRef.current = setInterval(() => {
        secondsSinceCallRef.current++;
        if (DEBUG_LOGS) console.log(`⏱️ ${secondsSinceCallRef.current}s since last API call`);
      }, 1000);
    } catch (err: any) {
      // Ignore abort errors from intentional cancellation (new request started)
      if (err.name === 'AbortError') {
        // Only log timeout aborts, not cancellation aborts
        if (controller === abortControllerRef.current) {
          setError('Request timed out. The server may be busy fetching data. Please try again.');
        }
        return; // Don't retry on abort
      }
      
      console.error('Error fetching market data:', err);
      
      let errorMessage = 'Failed to load market data';
      
      if (err.message.includes('Failed to fetch') || err.message.includes('ERR_CONNECTION_REFUSED')) {
        errorMessage = 'Unable to connect to the market data server. Please ensure the backend server is running.';
      } else if (err.message.includes('Server responded with status')) {
        errorMessage = `Server error: ${err.message}`;
      } else {
        errorMessage = `Network error: ${err.message}`;
      }
      
      setError(errorMessage);
      
      // Auto-retry up to 3 times with delay (only if still mounted)
      if (retryCountRef.current < 3 && isMountedRef.current) {
        const delay = 10000; // every 10s
        retryCountRef.current++;
        retryTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            fetchMarketData(true);
          }
        }, delay);
      }
    } finally {
      setLoading(false);
    }
  }, [tickerNames]);

  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'test') {
      fetchMarketData();
    } else {
      setLoading(false);
    }
  }, [fetchMarketData]);

  // Poll for real-time updates every 5 seconds
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'test') {
      const interval = setInterval(() => {
        if (isMountedRef.current) {
          fetchMarketData(true); // Don't show loading for polling
        }
      }, 5000); // 5 seconds

      return () => clearInterval(interval);
    }
  }, [fetchMarketData]);

  // Cleanup abort controller and retry timeout on unmount
  React.useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      // Abort any in-flight requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Clear any pending retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      // Clear the between-call timer
      if (betweenCallTimerRef.current) {
        clearInterval(betweenCallTimerRef.current);
        betweenCallTimerRef.current = null;
      }
    };
  }, []);

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
          price: timeframeData?.latest?.close || 'N/A',
          change: timeframeData?.latest?.change ?? 0,
          valueChange: timeframeData?.latest?.value_change ?? 0,
          sparkline: timeframeData?.closes ?? [],
          timeframe: selectedTimeframe.toUpperCase(),
          afterHours: timeframeData?.latest?.is_after_hours ?? false,
          rv: marketData[ticker]?.rv ?? null
        };

        // Find which asset class this ticker belongs to
        let foundClass: string | null = null;
        for (const [classKey, classData] of Object.entries(assetClasses)) {
          if (classData.tickers.includes(ticker)) {
            foundClass = classKey;
            break;
          }
        }
        // Only add if we found a valid asset class for this ticker
        if (foundClass && grouped[foundClass]) {
          grouped[foundClass].push(item);
        }
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

  // Loading skeleton component for Asset Class headers
  const AssetClassHeaderSkeleton = () => (
    <div className="flex items-center gap-2 mb-3 animate-pulse">
      <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
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

  // Set mounted state and load saved asset class order from localStorage
  React.useEffect(() => {
    setMounted(true);
    
    // Load saved order from localStorage after mount
    const saved = localStorage.getItem('assetClassOrder');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validate that all saved keys exist in assetClasses
        const validKeys = parsed.filter((key: string) => key in assetClasses);
        const missingKeys = Object.keys(assetClasses).filter(key => !parsed.includes(key));
        setAssetClassOrder([...validKeys, ...missingKeys]);
      } catch (e) {
        console.warn('Failed to parse saved asset class order:', e);
      }
    }
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

  // Drag and drop handlers for rearranging asset classes
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());

    // Create a custom drag image with better positioning
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.8';
    dragImage.style.transform = 'rotate(2deg) scale(1.02)';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.pointerEvents = 'none';
    dragImage.style.zIndex = '1000';
    document.body.appendChild(dragImage);

    // Position the drag image at the cursor
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    e.dataTransfer.setDragImage(dragImage, offsetX, offsetY);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newOrder = [...assetClassOrder];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);

    setAssetClassOrder(newOrder);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Touch event handlers for mobile drag and drop
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    setTouchStartY(e.touches[0].clientY);
    setTouchCurrentIndex(index);
    setDraggedIndex(index);

    // Add haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null || touchCurrentIndex === null) return;

    const currentY = e.touches[0].clientY;
    const deltaY = Math.abs(currentY - touchStartY);

    // Only start dragging if moved more than 10px
    if (deltaY < 10) return;

    // Find the target index based on the Y position
    const container = e.currentTarget.parentElement;
    if (!container) return;

    const items = container.querySelectorAll('[data-draggable-item]');
    let targetIndex = touchCurrentIndex;

    items.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      const itemCenter = rect.top + rect.height / 2;
      if (Math.abs(currentY - itemCenter) < rect.height / 2) {
        targetIndex = index;
      }
    });

    if (targetIndex !== touchCurrentIndex) {
      // Reorder the array
      const newOrder = [...assetClassOrder];
      const [draggedItem] = newOrder.splice(touchCurrentIndex, 1);
      newOrder.splice(targetIndex, 0, draggedItem);
      setAssetClassOrder(newOrder);
      setTouchCurrentIndex(targetIndex);
    }
  };

  const handleTouchEnd = () => {
    setTouchStartY(null);
    setTouchCurrentIndex(null);
    setDraggedIndex(null);
  };

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
                {!mounted || loading || timeframeSwitching || showReorderSkeleton ? (
                  // Show loading skeletons for all expected tickers
                  assetClassOrder.map((classKey) => {
                    const classData = assetClasses[classKey];
                    return (
                      <div key={`skeleton-group-${classKey}`} className="space-y-3">
                        <AssetClassHeaderSkeleton />
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
                        retryCountRef.current = 0; // Reset retry count for manual retry
                        fetchMarketData();
                      }}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? 'Retrying...' : 'Try Again'}
                    </button>
                  </div>
                ) : isRearrangeMode ? (
                  // Rearrange mode: show draggable list of asset classes
                  <div className="space-y-3 transition-all duration-300 ease-in-out">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Drag to Reorder Asset Classes</h3>
                    {assetClassOrder.map((classKey, index) => {
                      const classData = assetClasses[classKey];
                      const items = groupedPulse[classKey] || [];
                      const itemCount = items.length;

                      return (
                        <div
                          key={classKey}
                          data-draggable-item
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragEnd={handleDragEnd}
                          onTouchStart={(e) => handleTouchStart(e, index)}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                          className={`flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-lg border border-gray-200 dark:border-gray-700 cursor-move hover:shadow-md transition-all duration-200 ease-in-out touch-none select-none transform ${
                            draggedIndex === index ? 'opacity-50 scale-95 shadow-lg rotate-1' : ''
                          } ${draggedIndex !== null && draggedIndex !== index ? 'hover:border-blue-300 dark:hover:border-blue-600 hover:scale-105' : ''}`}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-lg">{classData.icon}</span>
                            <span className="font-medium text-gray-900 dark:text-white">{classData.name}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">({itemCount} items)</span>
                          </div>
                          <div className="text-gray-400 mr-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16M4 12h16" />
                            </svg>
                          </div>
                        </div>
                      );
                    })}
                    <div className="mt-6 flex justify-center">
                      <button
                        onClick={() => {
                          // Save the current order to localStorage
                          localStorage.setItem('assetClassOrder', JSON.stringify(assetClassOrder));
                          
                          // Show skeleton transition for 500ms
                          setShowReorderSkeleton(true);
                          setIsRearrangeMode(false);
                          
                          setTimeout(() => {
                            setShowReorderSkeleton(false);
                          }, 500);
                        }}
                        className="px-6 py-2 bg-green-500 text-white font-medium rounded-md hover:bg-green-600 transition-colors"
                      >
                        Done Reordering
                      </button>
                    </div>
                  </div>
                ) : (
                  // Normal mode: show grouped data by asset class
                  assetClassOrder.map((classKey) => {
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
                              onClick={() => setSelectedStock({
                                symbol: (pulse as any).symbol ?? (pulse as any).ticker ?? '—',
                                name: (pulse as any).ticker ?? (pulse as any).name ?? (pulse as any).index ?? '—',
                                price: typeof (pulse as any).price === 'number' ? (pulse as any).price : parseFloat(String((pulse as any).price)),
                                change: typeof (pulse as any).change === 'string' ? parseFloat(((pulse as any).change as string).replace('%', '')) : (pulse as any).change,
                                valueChange: (pulse as any).valueChange ?? 0,
                                sparkline: (pulse as any).sparkline ?? (pulse as any).trend ?? [],
                                timeframe: (pulse as any).timeframe ?? '',
                              })}
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
            <Settings className="w-5 h-5 text-white" />
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
                className={`text-lg mt-4 flex items-center justify-between w-full text-left transition-opacity ${section2Expanded ? 'opacity-50' : ''}`}
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

              {/* Arrange */}
              <button
                className={`text-lg mt-4 flex items-center justify-between w-full text-left transition-opacity ${section1Expanded ? 'opacity-50' : ''}`}
                onClick={() => {
                  setSection2Expanded(!section2Expanded);
                  setSection1Expanded(false); // Close other sections
                }}
              >
                <h3>Arrange Market Pulse Asset Classes</h3>
                <ChevronDown className={`w-5 h-5 transition-transform ${section2Expanded ? 'rotate-180' : ''}`} />
              </button>
              {section2Expanded && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Arrange market indicators by asset class. On mobile devices, you can drag and drop asset class sections within the Market Pulse to reorder them.
                  </p>
                  <button
                    onClick={() => {
                      setIsRearrangeMode(!isRearrangeMode);
                      setIsDrawerOpen(false);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white text-sm float-right rounded-md hover:bg-blue-600 transition-colors"
                  >
                    {isRearrangeMode ? 'Exit Re-arrange' : 'Re-arrange'}
                  </button>
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

      {/* Stock Preview Modal */}
      <StockPreviewModal
        isOpen={selectedStock !== null}
        onClose={() => setSelectedStock(null)}
        symbol={selectedStock?.symbol || ''}
        name={selectedStock?.name || ''}
        price={selectedStock?.price || 0}
        change={selectedStock?.change || 0}
        valueChange={selectedStock?.valueChange || 0}
        sparkline={selectedStock?.sparkline || []}
        timeframe={selectedStock?.timeframe || ''}
      />
    </div>
  );
}
