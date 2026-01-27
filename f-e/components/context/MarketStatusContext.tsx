'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

export type MarketStatus = 'open' | 'pre-market' | 'after-hours' | 'closed';

interface MarketStatusContextType {
  status: MarketStatus;
  statusText: string;
  statusDescription: string;
  nextEvent: string; // "Opens in 2h 30m" or "Closes in 1h 15m"
  isLoading: boolean;
}

const MarketStatusContext = createContext<MarketStatusContextType | undefined>(undefined);

export const useMarketStatus = () => {
  const context = useContext(MarketStatusContext);
  if (context === undefined) {
    throw new Error('useMarketStatus must be used within a MarketStatusProvider');
  }
  return context;
};

// US Market Holidays for 2025-2026 (NYSE/NASDAQ)
const MARKET_HOLIDAYS = [
  // 2025
  '2025-01-01', // New Year's Day
  '2025-01-20', // MLK Jr. Day
  '2025-02-17', // Presidents Day
  '2025-04-18', // Good Friday
  '2025-05-26', // Memorial Day
  '2025-06-19', // Juneteenth
  '2025-07-04', // Independence Day
  '2025-09-01', // Labor Day
  '2025-11-27', // Thanksgiving
  '2025-12-25', // Christmas
  // 2026
  '2026-01-01', // New Year's Day
  '2026-01-19', // MLK Jr. Day
  '2026-02-16', // Presidents Day
  '2026-04-03', // Good Friday
  '2026-05-25', // Memorial Day
  '2026-06-19', // Juneteenth
  '2026-07-03', // Independence Day (observed)
  '2026-09-07', // Labor Day
  '2026-11-26', // Thanksgiving
  '2026-12-25', // Christmas
];

// Convert local time to Eastern Time
const getEasternTime = (): Date => {
  const now = new Date();
  // Create a formatter for Eastern Time
  const etFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const parts = etFormatter.formatToParts(now);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '0';
  
  // Create a date object in ET (we'll use this for hour/minute comparisons)
  const etDate = new Date(
    parseInt(getPart('year')),
    parseInt(getPart('month')) - 1,
    parseInt(getPart('day')),
    parseInt(getPart('hour')),
    parseInt(getPart('minute')),
    parseInt(getPart('second'))
  );
  
  return etDate;
};

// Check if a date is a market holiday
const isMarketHoliday = (date: Date): boolean => {
  const dateStr = date.toISOString().split('T')[0];
  return MARKET_HOLIDAYS.includes(dateStr);
};

// Check if it's a weekend
const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

// Market hours in Eastern Time (24-hour format)
const MARKET_HOURS = {
  preMarketStart: 4 * 60, // 4:00 AM ET
  marketOpen: 9 * 60 + 30, // 9:30 AM ET
  marketClose: 16 * 60, // 4:00 PM ET
  afterHoursEnd: 20 * 60, // 8:00 PM ET
};

// Format duration to human-readable string
const formatDuration = (minutes: number): string => {
  if (minutes < 0) return '';
  
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}m`;
  }
};

// Calculate minutes until next market event
const getMinutesUntil = (targetMinutes: number, currentMinutes: number, addDay: boolean = false): number => {
  let diff = targetMinutes - currentMinutes;
  if (addDay || diff < 0) {
    diff += 24 * 60; // Add a day
  }
  return diff;
};

export const MarketStatusProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Update time every minute
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(getEasternTime());
      setIsLoading(false);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  const marketData = useMemo(() => {
    if (!currentTime) {
      return {
        status: 'closed' as MarketStatus,
        statusText: 'Market Closed',
        statusDescription: 'Loading...',
        nextEvent: '',
      };
    }

    const etNow = currentTime;
    const currentMinutes = etNow.getHours() * 60 + etNow.getMinutes();
    const dayOfWeek = etNow.getDay();
    
    // Check if it's a weekend or holiday
    if (isWeekend(etNow) || isMarketHoliday(etNow)) {
      // Calculate time until Monday 9:30 AM ET
      let daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 6 ? 2 : 1;
      
      // If it's a holiday on a weekday, just show next day
      if (isMarketHoliday(etNow) && !isWeekend(etNow)) {
        daysUntilMonday = 1;
      }
      
      const minutesUntilOpen = daysUntilMonday * 24 * 60 + (MARKET_HOURS.marketOpen - currentMinutes);
      
      return {
        status: 'closed' as MarketStatus,
        statusText: 'Market Closed',
        statusDescription: isMarketHoliday(etNow) ? 'Holiday' : 'Weekend',
        nextEvent: `Opens ${daysUntilMonday === 1 ? 'tomorrow' : 'Monday'} at 9:30 AM ET`,
      };
    }

    // Pre-market: 4:00 AM - 9:30 AM ET
    if (currentMinutes >= MARKET_HOURS.preMarketStart && currentMinutes < MARKET_HOURS.marketOpen) {
      const minutesUntilOpen = getMinutesUntil(MARKET_HOURS.marketOpen, currentMinutes);
      return {
        status: 'pre-market' as MarketStatus,
        statusText: 'Pre-Market',
        statusDescription: 'Extended hours trading',
        nextEvent: `Opens in ${formatDuration(minutesUntilOpen)}`,
      };
    }

    // Regular market hours: 9:30 AM - 4:00 PM ET
    if (currentMinutes >= MARKET_HOURS.marketOpen && currentMinutes < MARKET_HOURS.marketClose) {
      const minutesUntilClose = getMinutesUntil(MARKET_HOURS.marketClose, currentMinutes);
      return {
        status: 'open' as MarketStatus,
        statusText: 'Market Open',
        statusDescription: 'Regular trading hours',
        nextEvent: `Closes in ${formatDuration(minutesUntilClose)}`,
      };
    }

    // After-hours: 4:00 PM - 8:00 PM ET
    if (currentMinutes >= MARKET_HOURS.marketClose && currentMinutes < MARKET_HOURS.afterHoursEnd) {
      const minutesUntilEnd = getMinutesUntil(MARKET_HOURS.afterHoursEnd, currentMinutes);
      return {
        status: 'after-hours' as MarketStatus,
        statusText: 'After Hours',
        statusDescription: 'Extended hours trading',
        nextEvent: `Ends in ${formatDuration(minutesUntilEnd)}`,
      };
    }

    // Closed (before 4 AM or after 8 PM)
    const isBeforePreMarket = currentMinutes < MARKET_HOURS.preMarketStart;
    const minutesUntilPreMarket = isBeforePreMarket 
      ? getMinutesUntil(MARKET_HOURS.preMarketStart, currentMinutes)
      : getMinutesUntil(MARKET_HOURS.preMarketStart, currentMinutes, true);
    
    return {
      status: 'closed' as MarketStatus,
      statusText: 'Market Closed',
      statusDescription: 'Trading resumes tomorrow',
      nextEvent: isBeforePreMarket 
        ? `Pre-market in ${formatDuration(minutesUntilPreMarket)}`
        : 'Opens tomorrow at 9:30 AM ET',
    };
  }, [currentTime]);

  const value = useMemo(() => ({
    ...marketData,
    isLoading,
  }), [marketData, isLoading]);

  return (
    <MarketStatusContext.Provider value={value}>
      {children}
    </MarketStatusContext.Provider>
  );
};
