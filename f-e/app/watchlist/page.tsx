"use client";

import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import CollapsibleSection from '../../components/ui/CollapsibleSection';

// Set to true to enable timer/fetch logging
const DEBUG_LOGS = true;
import WatchListItem from '../../components/watchlist/WatchListItem';
import StockPreviewModal from '../../components/stock/StockPreviewModal';
import LiveScreen from '../../components/watchlist/LiveScreen';
import QuickActionMenu from '../../components/watchlist/QuickActionMenu';
import { Info, LineChart, ChevronDown, Settings, Star, Search, X, Activity, TrendingUp } from 'lucide-react';
import { useFavorites, MAX_FAVORITES } from '@/components/context/FavoritesContext';
import { useWatchlist, MAX_WATCHLIST } from '@/components/context/WatchlistContext';
import { useToast } from '@/components/context/ToastContext';
import CandleStickAnim from '@/components/ui/CandleStickAnim';

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
  'CRYPTO-FEAR-GREED': 'Crypto Fear & Greed',
  'LIT': 'Lithium',
  'PL=F': 'Platinum',
  'PA=F': 'Palladium',
  'TAN': 'Solar ETF',
  'ICLN': 'Clean Energy ETF',
  'HYDR': 'Hydrogen ETF'
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
    tickers: ['GC=F', 'SI=F', 'HG=F', 'LIT', 'PL=F', 'PA=F'],
    icon: '⛏️'
  },
  energy: {
    name: 'Energy',
    tickers: ['CL=F', 'NG=F', 'TAN', 'ICLN', 'HYDR'],
    icon: '⚡'
  },
  indicators: {
    name: 'Market Indicators',
    tickers: ['^VIX', 'CALL/PUT Ratio', 'DGS10', 'DGS2'],
    icon: '📊'
  }
};


export default function WatchlistPage() {
  const { favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite } = useFavorites();
  const { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist, toggleWatchlist } = useWatchlist();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [pulseTimeframe, setPulseTimeframe] = useState<'D'|'W'|'M'|'Y'>('D');
  
  // Quick action menu state
  const [quickActionMenu, setQuickActionMenu] = useState<{
    isOpen: boolean;
    symbol: string;
    name: string;
    position: { x: number; y: number };
  } | null>(null);
  // Track which section is open (accordion behavior - only one open at a time)
  const [activeSection, setActiveSection] = useState<'marketPulse' | 'swingScreening' | 'myWatchlist' | null>('marketPulse');
  // Track if fixed header should be shown
  const [showFixedHeader, setShowFixedHeader] = useState(false);
  // Track drawer open state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // Alert visibility state
  const [isAlertVisible, setIsAlertVisible] = useState(true);
  const [isAlertClosing, setIsAlertClosing] = useState(false);
  // Search drawer state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ symbol: string; name: string; type?: string; exchange?: string }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const searchDebounceRef = React.useRef<NodeJS.Timeout | null>(null);
  const searchAbortRef = React.useRef<AbortController | null>(null);
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
    timeframes?: {
      day?: { closes: number[]; latest: { close: string; change: number; value_change: number; is_after_hours: boolean } };
      week?: { closes: number[]; latest: { close: string; change: number; value_change: number; is_after_hours: boolean } };
      month?: { closes: number[]; latest: { close: string; change: number; value_change: number; is_after_hours: boolean } };
      year?: { closes: number[]; latest: { close: string; change: number; value_change: number; is_after_hours: boolean } };
    };
  } | null>(null);

  // Market data state (from b-e financial_data)
  const [marketData, setMarketData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const abortControllerRef = React.useRef<AbortController | null>(null);
  const retryCountRef = React.useRef(0); // Internal ref for callback access
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
        setRetryCount(0);
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
      setRetryCount(0);
      
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
      
      // Auto-retry up to 5 times with exponential backoff (only if still mounted)
      // This helps when the backend server just started and needs time to warm up
      if (retryCountRef.current < 5 && isMountedRef.current) {
        // Exponential backoff: 2s, 4s, 8s, 16s, 32s
        const delay = Math.min(2000 * Math.pow(2, retryCountRef.current), 32000);
        retryCountRef.current++;
        setRetryCount(retryCountRef.current);
        if (DEBUG_LOGS) console.log(`⏳ Will retry in ${delay / 1000}s (attempt ${retryCountRef.current}/5)`);
        retryTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            // Keep loading state during retries for better UX on cold starts
            setLoading(true);
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

  // Poll for real-time updates every 5 seconds (only after initial data is loaded)
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'test') {
      // Don't start polling until we have initial data loaded successfully
      // This prevents polling from interfering with retry logic on cold starts
      const hasData = Object.keys(marketData).length > 0;
      if (!hasData) return;
      
      const interval = setInterval(() => {
        if (isMountedRef.current) {
          fetchMarketData(true); // Don't show loading for polling
        }
      }, 5000); // 5 seconds

      return () => clearInterval(interval);
    }
  }, [fetchMarketData, marketData]);

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

  // Handle URL search params to scroll to and open a specific section
  React.useEffect(() => {
    const section = searchParams.get('section');
    if (section === 'watchlist' || section === 'my-watchlist') {
      setActiveSection('myWatchlist');
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const element = document.getElementById('my-watchlist');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else if (section === 'favorites' || section === 'my-screens' || section === 'screens') {
      setActiveSection('swingScreening');
      setTimeout(() => {
        const element = document.getElementById('my-screens');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [searchParams]);

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
    if (isDrawerOpen || isSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen, isSearchOpen]);

  // Focus search input when search drawer opens
  React.useEffect(() => {
    if (isSearchOpen) {
      // Small delay to ensure the drawer animation has started
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isSearchOpen]);

  // Search function that calls the backend API
  const performSearch = React.useCallback(async (query: string) => {
    if (query.length < 1) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    // Abort any in-flight search request
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }

    const controller = new AbortController();
    searchAbortRef.current = controller;

    setSearchLoading(true);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/market-data/search/?q=${encodeURIComponent(query)}`,
        { signal: controller.signal }
      );

      if (!res.ok) {
        throw new Error('Search failed');
      }

      const data = await res.json();
      
      // Also add matching Market Pulse items at the top
      const marketPulseResults: Array<{ symbol: string; name: string; type: string }> = [];
      Object.entries(tickerNames).forEach(([symbol, name]) => {
        if (symbol.toUpperCase().includes(query.toUpperCase()) || name.toUpperCase().includes(query.toUpperCase())) {
          marketPulseResults.push({ symbol, name, type: 'Market Pulse' });
        }
      });

      // Merge results, Market Pulse first, avoiding duplicates
      const apiResults = data.results || [];
      const mergedResults = [...marketPulseResults];
      
      apiResults.forEach((result: { symbol: string; name: string; type?: string }) => {
        if (!mergedResults.find(r => r.symbol === result.symbol)) {
          mergedResults.push({ symbol: result.symbol, name: result.name, type: result.type || 'Stock' });
        }
      });

      setSearchResults(mergedResults.slice(0, 15));
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Search error:', err);
      
      // Fallback to local search if API fails
      const results: Array<{ symbol: string; name: string; type: string }> = [];
      Object.entries(tickerNames).forEach(([symbol, name]) => {
        if (symbol.toUpperCase().includes(query.toUpperCase()) || name.toUpperCase().includes(query.toUpperCase())) {
          results.push({ symbol, name, type: 'Market Pulse' });
        }
      });
      setSearchResults(results.slice(0, 10));
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounced search handler
  const handleSearchChange = React.useCallback((value: string) => {
    setSearchQuery(value);
    
    // Clear existing debounce
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (value.length < 1) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    
    // Debounce API call by 300ms
    searchDebounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  }, [performSearch]);

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

          {/* Header */}
          <div className='flex items-center gap-2'>
            <div className='w-[30px] h-[30px] flex items-center justify-center'>
              <CandleStickAnim></CandleStickAnim>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white relative top-1.5 left-1.5">
              WatchList
            </h1>
          </div>

          {/* Getting Started Alert */}
          {isAlertVisible && (
            <div 
              className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl transform transition-all duration-300 ${isAlertClosing ? 'max-h-0 p-0 opacity-0 border-0' : 'max-h-96 p-4'}`}
              style={{ overflow: 'hidden' }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-800/50 rounded-full flex items-center justify-center">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    How Pivy Watchlist Works
                  </h3>
                  <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-4 h-4 bg-blue-200 dark:bg-blue-700 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-700 dark:text-blue-200">1</span>
                      <span><strong>Search or Browse</strong> — Find assets using the search bar or explore the Market Pulse section</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-4 h-4 bg-blue-200 dark:bg-blue-700 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-700 dark:text-blue-200">2</span>
                      <span><strong>Build Your Watchlist</strong> — Tap ⭐ to add up to 10 assets you want to track</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-4 h-4 bg-blue-200 dark:bg-blue-700 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-700 dark:text-blue-200">3</span>
                      <span><strong>Add to My Screens</strong> — Double-tap watchlist items or tap 
                        <TrendingUp className="w-3.5 h-3.5 mx-1 relative bottom-0.5 inline text-purple-500" />
                        to add them to My Screens for swing trade analysis</span>
                    </li>
                  </ol>
                </div>
                <button 
                  onClick={() => {
                    setIsAlertClosing(true);
                    setTimeout(() => setIsAlertVisible(false), 300);
                  }}
                  className="flex-shrink-0 p-1 hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </button>
              </div>
            </div>
          )}

          {/* Search Bar Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
          >
            <Search className="w-5 h-5 text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">Search stocks, ETFs, crypto...</span>
          </button>

          {/* Fixed positioned headers for Sticky Effect */}
          {showFixedHeader && activeSection && (
            <div className="fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="lg:px-64 px-4 sm:px-8 py-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="flex items-center gap-2 text-lg font-semibold hover:bg-gray-800 px-2 py-1 rounded transition-colors"
                    onClick={() => {
                      setActiveSection(null);
                      // Scroll to top if not already at top
                      if (window.scrollY > 0) {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    aria-label={`Collapse ${activeSection} section`}
                  >
                    <span className="transition-transform duration-200">▼</span>
                    {activeSection === 'marketPulse' && (
                      <span className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-green-500" />
                        Market Pulse
                      </span>
                    )}
                    {activeSection === 'myWatchlist' && (
                      <span className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        My Watchlist
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">({watchlist.length}/{MAX_WATCHLIST})</span>
                      </span>
                    )}
                    {activeSection === 'swingScreening' && (
                      <span className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-500" />
                        My Screens
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">({favorites.length}/{MAX_FAVORITES})</span>
                      </span>
                    )}
                  </button>
                  <div className="flex items-center gap-2">
                    {/* Overview info button - only show for Market Pulse */}
                    {activeSection === 'marketPulse' && !error && (
                      <button
                        type="button"
                        className="p-1 rounded-full hover:bg-gray-800 transition ml-2"
                        title="Learn more about Market Overview"
                        aria-label="More info about Market Overview"
                      >
                        <Info className="w-5 h-5 text-orange-300" />
                      </button>
                    )}
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
                  <Activity className="w-5 h-5 text-green-500" />
                  Market Pulse
                </span>
              }
              infoButton={activeSection === 'marketPulse' && !loading && !error ? (
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
              open={activeSection === 'marketPulse'}
              onOpenChange={(isOpen) => setActiveSection(isOpen ? 'marketPulse' : null)}
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
                  <>
                    {/* Show connecting message when retrying */}
                    {retryCount > 0 && (
                      <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-500 dark:text-gray-400">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        <span>Connecting to market data server... (attempt {retryCount}/5)</span>
                      </div>
                    )}
                    {assetClassOrder.map((classKey) => {
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
                    })}
                  </>
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
                        setRetryCount(0);
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
                        {items.map((pulse, index) => {
                          const pulseSymbol = (pulse as any).symbol ?? (pulse as any).ticker ?? '—';
                          const pulseName = (pulse as any).ticker ?? (pulse as any).name ?? (pulse as any).index ?? '—';
                          return (
                          <div key={`${classKey}-${index}`} className="flex-shrink-0 w-full">
                            <WatchListItem
                              name={pulseName}
                              symbol={pulseSymbol}
                              price={(pulse as any).price ?? (typeof (pulse as any).value === 'number' ? (pulse as any).value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String((pulse as any).value))}
                              change={typeof (pulse as any).change === 'string' ? parseFloat(((pulse as any).change as string).replace('%', '')) : (pulse as any).change}
                              valueChange={(pulse as any).valueChange}
                              sparkline={(pulse as any).sparkline ?? (pulse as any).trend}
                              timeframe={(pulse as any).timeframe}
                              afterHours={(pulse as any).afterHours}
                              rv={(pulse as any).rv}
                              isInWatchlist={isInWatchlist(pulseSymbol)}
                              isInSwingScreens={isFavorite(pulseSymbol)}
                              showQuickActions
                              onLongPress={(position) => setQuickActionMenu({
                                isOpen: true,
                                symbol: pulseSymbol,
                                name: pulseName,
                                position,
                              })}
                              onDoubleTap={() => {
                                // Tiered system: first add to watchlist, then can add to My Screens
                                if (!isInWatchlist(pulseSymbol)) {
                                  const added = addToWatchlist({ symbol: pulseSymbol, name: pulseName });
                                  if (added) {
                                    showToast(`${pulseSymbol} added to Watchlist`, 'success', 2000, { link: '/watchlist?section=my-watchlist' });
                                  } else {
                                    showToast(`Watchlist full (${MAX_WATCHLIST}/${MAX_WATCHLIST})`, 'warning', 3000, { link: '/watchlist?section=my-watchlist' });
                                  }
                                } else {
                                  // Already in watchlist, toggle My Screens
                                  const wasInScreens = isFavorite(pulseSymbol);
                                  toggleFavorite({ symbol: pulseSymbol, name: pulseName });
                                  if (wasInScreens) {
                                    showToast(`${pulseSymbol} removed from My Screens`, 'info', 5000, { 
                                      link: '/watchlist?section=my-screens',
                                      onUndo: () => addFavorite({ symbol: pulseSymbol, name: pulseName })
                                    });
                                  } else if (favorites.length < MAX_FAVORITES) {
                                    showToast(`${pulseSymbol} added to My Screens`, 'success', 2000, { link: '/watchlist?section=my-screens' });
                                  } else {
                                    showToast(`My Screens full (${MAX_FAVORITES}/${MAX_FAVORITES})`, 'warning', 3000, { link: '/watchlist?section=my-screens' });
                                  }
                                }
                              }}
                              onClick={() => setSelectedStock({
                                symbol: pulseSymbol,
                                name: pulseName,
                                price: typeof (pulse as any).price === 'number' ? (pulse as any).price : parseFloat(String((pulse as any).price).replace(/,/g, '')),
                                change: typeof (pulse as any).change === 'string' ? parseFloat(((pulse as any).change as string).replace('%', '')) : (pulse as any).change,
                                valueChange: (pulse as any).valueChange ?? 0,
                                sparkline: (pulse as any).sparkline ?? (pulse as any).trend ?? [],
                                timeframe: (pulse as any).timeframe ?? '',
                                timeframes: marketData[pulseSymbol]?.timeframes,
                              })}
                            />
                          </div>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>
            </CollapsibleSection>
          </div>

          {/* My Watchlist */}
          <div id="my-watchlist" className="bg-white dark:bg-gray-900/20 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 scroll-mt-20">
            <CollapsibleSection
              title={
                <span className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  My Watchlist
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">({watchlist.length}/{MAX_WATCHLIST})</span>
                </span>
              }
              open={activeSection === 'myWatchlist'}
              onOpenChange={(isOpen) => setActiveSection(isOpen ? 'myWatchlist' : null)}
            >
              {/* Caption explaining limit */}
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Track up to {MAX_WATCHLIST} assets. Double-tap to add to My Screens
                <TrendingUp className="w-3.5 h-3.5 ml-1 inline text-purple-500" />
              </p>
              {watchlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                  <Star className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    Your watchlist is empty
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
                    Search for stocks and tap ⭐ to add them
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {watchlist.map((item, index) => {
                    const itemData = marketData[item.symbol];
                    const timeframeKey = selectedTimeframe as 'day' | 'week' | 'month' | 'year';
                    const tfData = itemData?.timeframes?.[timeframeKey];
                    
                    return (
                      <div key={`watchlist-${item.symbol}-${index}`} className="flex-shrink-0 w-full">
                        <WatchListItem
                          name={item.name}
                          symbol={item.symbol}
                          price={tfData?.latest?.close ?? itemData?.price ?? '—'}
                          change={tfData?.latest?.change ?? itemData?.change ?? 0}
                          valueChange={tfData?.latest?.value_change ?? itemData?.valueChange ?? 0}
                          sparkline={tfData?.closes ?? itemData?.sparkline ?? []}
                          timeframe={selectedTimeframe}
                          afterHours={tfData?.latest?.is_after_hours}
                          isInSwingScreens={isFavorite(item.symbol)}
                          showQuickActions
                          enableSwipe
                          onSwipeRemove={() => {
                            // Also remove from My Screens if applicable
                            const wasInScreens = isFavorite(item.symbol);
                            if (wasInScreens) {
                              toggleFavorite({ symbol: item.symbol, name: item.name });
                            }
                            removeFromWatchlist(item.symbol);
                            showToast(`${item.symbol} removed from Watchlist`, 'info', 5000, { 
                              link: '/watchlist?section=my-watchlist',
                              onUndo: () => {
                                addToWatchlist({ symbol: item.symbol, name: item.name });
                                if (wasInScreens) addFavorite({ symbol: item.symbol, name: item.name });
                              }
                            });
                          }}
                          onLongPress={(position) => setQuickActionMenu({
                            isOpen: true,
                            symbol: item.symbol,
                            name: item.name,
                            position,
                          })}
                          onDoubleTap={() => {
                            const wasInScreens = isFavorite(item.symbol);
                            toggleFavorite({ symbol: item.symbol, name: item.name });
                            if (wasInScreens) {
                              showToast(`${item.symbol} removed from My Screens`, 'info', 5000, { 
                                link: '/watchlist?section=my-screens',
                                onUndo: () => addFavorite({ symbol: item.symbol, name: item.name })
                              });
                            } else if (favorites.length < MAX_FAVORITES) {
                              showToast(`${item.symbol} added to My Screens`, 'success', 2000, { link: '/watchlist?section=my-screens' });
                            } else {
                              showToast(`My Screens full (${MAX_FAVORITES}/${MAX_FAVORITES})`, 'warning', 3000, { link: '/watchlist?section=my-screens' });
                            }
                          }}
                          onClick={() => setSelectedStock({
                            symbol: item.symbol,
                            name: item.name,
                            price: typeof tfData?.latest?.close === 'string' 
                              ? parseFloat(tfData.latest.close.replace(/,/g, '')) 
                              : (itemData?.price ?? 0),
                            change: tfData?.latest?.change ?? itemData?.change ?? 0,
                            valueChange: tfData?.latest?.value_change ?? itemData?.valueChange ?? 0,
                            sparkline: tfData?.closes ?? itemData?.sparkline ?? [],
                            timeframe: selectedTimeframe,
                            timeframes: itemData?.timeframes,
                          })}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </CollapsibleSection>
          </div>

          {/* My Screens */}
          <div id="my-screens" className="scroll-mt-24 bg-white dark:bg-gray-900/20 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
            <CollapsibleSection
              title={
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  <span>My Screens</span>
                  {favorites.length > 0 && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                      {favorites.length}/{MAX_FAVORITES}
                    </span>
                  )}
                </span>
              }
              open={activeSection === 'swingScreening'}
              onOpenChange={(isOpen) => setActiveSection(isOpen ? 'swingScreening' : null)}
            >
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Your top {MAX_FAVORITES} watchlist picks for advanced screening. Double-tap watchlist items to promote here.
              </p>
              
              {favorites.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                  <TrendingUp className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    No screens yet
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
                    Double-tap watchlist items to add to My Screens
                  </p>
                </div>
              ) : (
                <LiveScreen 
                  favorites={favorites}
                  isInWatchlist={isInWatchlist}
                  enableSwipe
                  onSwipeRemove={(symbol, name) => {
                    removeFavorite(symbol);
                    showToast(`${symbol} removed from My Screens`, 'info', 5000, { 
                      link: '/watchlist?section=my-screens',
                      onUndo: () => addFavorite({ symbol, name })
                    });
                  }}
                  onLongPress={(symbol, name, position) => setQuickActionMenu({
                    isOpen: true,
                    symbol,
                    name,
                    position,
                  })}
                  onDoubleTap={(symbol, name) => {
                    // Double-tap removes from My Screens
                    removeFavorite(symbol);
                    showToast(`${symbol} removed from My Screens`, 'info', 5000, { 
                      link: '/watchlist?section=my-screens',
                      onUndo: () => addFavorite({ symbol, name })
                    });
                  }}
                />
              )}
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

      {/* Search Drawer */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[99] transition-opacity ${isSearchOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => {
          setIsSearchOpen(false);
          setSearchQuery('');
          setSearchResults([]);
        }}
      >
        <div
          className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-lg z-[100] transform transition-transform h-[65vh] lg:max-h-[85vh] lg:h-auto rounded-t-3xl flex flex-col ${isSearchOpen ? 'translate-y-0' : 'translate-y-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>

          {/* Search Header */}
          <div className="px-4 pb-4 flex-shrink-0">
            <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3">
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search stocks, ETFs, crypto..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    searchInputRef.current?.focus();
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {searchLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((result) => {
                  const isResultInWatchlist = isInWatchlist(result.symbol);
                  const isResultFavorite = isFavorite(result.symbol);
                  
                  return (
                    <div
                      key={result.symbol}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      {/* Main clickable area */}
                      <button
                        onClick={() => {
                          const existingData = marketData[result.symbol];
                          const timeframeKey = selectedTimeframe as 'day' | 'week' | 'month' | 'year';
                          const tfData = existingData?.timeframes?.[timeframeKey];
                          
                          setSelectedStock({
                            symbol: result.symbol,
                            name: result.name,
                            price: tfData?.latest?.close 
                              ? parseFloat(String(tfData.latest.close).replace(/,/g, '')) 
                              : (existingData?.price ?? 0),
                            change: tfData?.latest?.change ?? existingData?.change ?? 0,
                            valueChange: tfData?.latest?.value_change ?? existingData?.valueChange ?? 0,
                            sparkline: tfData?.closes ?? existingData?.sparkline ?? [],
                            timeframe: selectedTimeframe,
                            timeframes: existingData?.timeframes,
                          });
                          
                          setIsSearchOpen(false);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="flex flex-col items-start flex-1 text-left"
                      >
                        <span className="font-semibold text-gray-900 dark:text-white">{result.symbol}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{result.name}</span>
                      </button>

                      {/* Quick action buttons */}
                      <div className="flex items-center gap-1 ml-2">
                        {/* Watchlist toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isResultInWatchlist) {
                              // Store if was in My Screens before removal
                              const wasInScreens = isFavorite(result.symbol);
                              if (wasInScreens) removeFavorite(result.symbol);
                              removeFromWatchlist(result.symbol);
                              showToast(`${result.symbol} removed from Watchlist`, 'info', 5000, { 
                                link: '/watchlist?section=my-watchlist', 
                                onClick: () => {
                                  setIsSearchOpen(false);
                                  setActiveSection('myWatchlist');
                                  setTimeout(() => document.getElementById('my-watchlist')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                                },
                                onUndo: () => {
                                  addToWatchlist({ symbol: result.symbol, name: result.name });
                                  if (wasInScreens) addFavorite({ symbol: result.symbol, name: result.name });
                                }
                              });
                            } else {
                              const added = addToWatchlist({ symbol: result.symbol, name: result.name });
                              if (added) {
                                showToast(`${result.symbol} added to Watchlist`, 'success', 2000, { link: '/watchlist?section=my-watchlist', onClick: () => {
                                  setIsSearchOpen(false);
                                  setActiveSection('myWatchlist');
                                  setTimeout(() => document.getElementById('my-watchlist')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                                } });
                              } else {
                                showToast(`Watchlist full (${MAX_WATCHLIST}/${MAX_WATCHLIST})`, 'warning', 3000, { link: '/watchlist?section=my-watchlist', onClick: () => {
                                  setIsSearchOpen(false);
                                  setActiveSection('myWatchlist');
                                  setTimeout(() => document.getElementById('my-watchlist')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                                } });
                              }
                            }
                          }}
                          className={`p-2 rounded-full transition-all ${
                            isResultInWatchlist
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-800/40'
                              : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                          title={isResultInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                        >
                          <Star
                            className={`w-4 h-4 transition-colors ${
                              isResultInWatchlist
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-400 hover:text-yellow-500'
                            }`}
                          />
                        </button>

                        {/* My Screens toggle (tiered - must be in watchlist first) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isResultFavorite) {
                              removeFavorite(result.symbol);
                              showToast(`${result.symbol} removed from My Screens`, 'info', 5000, { 
                                link: '/watchlist?section=my-screens', 
                                onClick: () => {
                                  setIsSearchOpen(false);
                                  setActiveSection('swingScreening');
                                  setTimeout(() => document.getElementById('my-screens')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                                },
                                onUndo: () => addFavorite({ symbol: result.symbol, name: result.name })
                              });
                            } else if (!isResultInWatchlist) {
                              showToast(`Add ${result.symbol} to Watchlist first`, 'warning', 2000, { link: '/watchlist?section=my-watchlist', onClick: () => {
                                setIsSearchOpen(false);
                                setActiveSection('myWatchlist');
                                setTimeout(() => document.getElementById('my-watchlist')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                              } });
                            } else {
                              const added = addFavorite({ symbol: result.symbol, name: result.name });
                              if (added) {
                                showToast(`${result.symbol} added to My Screens`, 'success', 2000, { link: '/watchlist?section=my-screens', onClick: () => {
                                  setIsSearchOpen(false);
                                  setActiveSection('swingScreening');
                                  setTimeout(() => document.getElementById('my-screens')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                                } });
                              } else {
                                showToast(`My Screens full (${MAX_FAVORITES}/${MAX_FAVORITES})`, 'warning', 3000, { link: '/watchlist?section=my-screens', onClick: () => {
                                  setIsSearchOpen(false);
                                  setActiveSection('swingScreening');
                                  setTimeout(() => document.getElementById('my-screens')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                                } });
                              }
                            }
                          }}
                          className={`p-2 rounded-full transition-all ${
                            isResultFavorite
                              ? 'bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-800/40'
                              : !isResultInWatchlist
                                ? 'opacity-40 cursor-not-allowed'
                                : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                          title={isResultFavorite ? 'Remove from My Screens' : !isResultInWatchlist ? 'Add to Watchlist first' : 'Add to My Screens'}
                        >
                          <TrendingUp
                            className={`w-4 h-4 transition-colors ${
                              isResultFavorite
                                ? 'text-purple-500'
                                : !isResultInWatchlist
                                  ? 'text-gray-300'
                                  : 'text-gray-400 hover:text-purple-500'
                            }`}
                          />
                        </button>
                      </div>

                      {result.type && (
                        <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full ml-2">
                          {result.type}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : searchQuery.length > 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No results found for "{searchQuery}"</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Popular Searches</p>
                <div className="flex flex-wrap gap-2">
                  {['AAPL', 'TSLA', 'NVDA', 'SPY', 'BTC-USD', 'GOOGL'].map((symbol) => (
                    <button
                      key={symbol}
                      onClick={() => handleSearchChange(symbol)}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

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
        timeframes={selectedStock?.timeframes}
      />

      {/* Quick Action Menu (for long-press/right-click on Market Pulse items) */}
      {quickActionMenu && (
        <QuickActionMenu
          symbol={quickActionMenu.symbol}
          name={quickActionMenu.name}
          isOpen={quickActionMenu.isOpen}
          onClose={() => setQuickActionMenu(null)}
          position={quickActionMenu.position}
          onActionComplete={(action, added, symbol) => {
            const menuName = quickActionMenu.name;
            if (action === 'favorite') {
              if (added) {
                showToast(`${symbol} added to My Screens`, 'success', 2000, { link: '/watchlist?section=my-screens' });
              } else if (!isFavorite(symbol) && !isInWatchlist(symbol)) {
                // Tried to add but not in watchlist (tiered requirement)
                showToast(`Add ${symbol} to Watchlist first`, 'warning', 2000, { link: '/watchlist?section=my-watchlist' });
              } else if (!added && !isFavorite(symbol)) {
                // It was in My Screens and got removed
                showToast(`${symbol} removed from My Screens`, 'info', 5000, { 
                  link: '/watchlist?section=my-screens',
                  onUndo: () => addFavorite({ symbol, name: menuName })
                });
              }
            } else {
              if (!added) {
                // Removed from watchlist - also may have been removed from My Screens
                const wasInScreens = isFavorite(symbol);
                showToast(
                  `${symbol} removed from Watchlist`,
                  'info',
                  5000,
                  { 
                    link: '/watchlist?section=my-watchlist',
                    onUndo: () => {
                      addToWatchlist({ symbol, name: menuName });
                      // Note: if it was in My Screens, it would have been auto-removed
                    }
                  }
                );
              } else {
                showToast(`${symbol} added to Watchlist`, 'success', 2000, { link: '/watchlist?section=my-watchlist' });
              }
            }
          }}
        />
      )}
    </div>
  );
}
