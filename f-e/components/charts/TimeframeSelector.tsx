"use client";

import React, { useState, useEffect, useCallback } from 'react';

type PeriodType = '1D' | '1W' | '1M' | '1Y';
type IntervalType = '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

interface TimeframeSelectorProps {
  selectedPeriod: PeriodType;
  selectedInterval: IntervalType;
  onPeriodChange: (period: PeriodType) => void;
  onIntervalChange: (interval: IntervalType) => void;
  compact?: boolean;
  disabled?: boolean;
}

// Define available intervals for each period
const PERIOD_INTERVALS: Record<PeriodType, { value: IntervalType; label: string }[]> = {
  '1D': [
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1h' },
  ],
  '1W': [
    { value: '15m', label: '15m' },
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
  ],
  '1M': [
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
    { value: '1d', label: '1D' },
  ],
  '1Y': [
    { value: '1d', label: '1D' },
    { value: '1w', label: '1W' },
  ],
};

const PERIODS: { value: PeriodType; label: string }[] = [
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
  { value: '1Y', label: '1Y' },
];

// Default intervals for each period
const DEFAULT_INTERVALS: Record<PeriodType, IntervalType> = {
  '1D': '15m',
  '1W': '1h',
  '1M': '4h',
  '1Y': '1d',
};

// Get the default interval for a period
export function getDefaultInterval(period: PeriodType): IntervalType {
  return DEFAULT_INTERVALS[period];
}

// Check if an interval is valid for a period
export function isValidInterval(period: PeriodType, interval: IntervalType): boolean {
  return PERIOD_INTERVALS[period].some(i => i.value === interval);
}

// Convert old timeframe format to new format
export function convertLegacyTimeframe(timeframe: string): { period: PeriodType; interval: IntervalType } {
  switch (timeframe) {
    case 'D':
      return { period: '1D', interval: '15m' };
    case 'W':
      return { period: '1W', interval: '1h' };
    case 'M':
      return { period: '1M', interval: '4h' };
    case 'Y':
      return { period: '1Y', interval: '1d' };
    default:
      return { period: '1D', interval: '15m' };
  }
}

export default function TimeframeSelector({
  selectedPeriod,
  selectedInterval,
  onPeriodChange,
  onIntervalChange,
  compact = false,
  disabled = false,
}: TimeframeSelectorProps) {
  const [availableIntervals, setAvailableIntervals] = useState(PERIOD_INTERVALS[selectedPeriod] || []);

  // Update available intervals when period changes
  useEffect(() => {
    const intervals = PERIOD_INTERVALS[selectedPeriod] || [];
    setAvailableIntervals(intervals);
    
    // Auto-select default interval if current one isn't available
    const isCurrentValid = intervals.some(i => i.value === selectedInterval);
    if (!isCurrentValid && intervals.length > 0) {
      onIntervalChange(DEFAULT_INTERVALS[selectedPeriod]);
    }
  }, [selectedPeriod, selectedInterval, onIntervalChange]);

  const handlePeriodChange = useCallback((period: PeriodType) => {
    if (disabled) return;
    onPeriodChange(period);
  }, [disabled, onPeriodChange]);

  const handleIntervalChange = useCallback((interval: IntervalType) => {
    if (disabled) return;
    onIntervalChange(interval);
  }, [disabled, onIntervalChange]);

  if (compact) {
    // Single-row compact version
    return (
      <div className={`flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5 ${disabled ? 'opacity-50' : ''}`}>
        {/* Period buttons */}
        {PERIODS.map((period) => (
          <button
            key={period.value}
            onClick={() => handlePeriodChange(period.value)}
            disabled={disabled}
            className={`
              px-2.5 py-1.5 text-xs font-medium rounded-md transition-all
              ${selectedPeriod === period.value
                ? 'bg-purple-500 text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
              ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {period.label}
          </button>
        ))}
        
        {/* Divider */}
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
        
        {/* Interval buttons */}
        {availableIntervals.map((interval) => (
          <button
            key={interval.value}
            onClick={() => handleIntervalChange(interval.value)}
            disabled={disabled}
            className={`
              px-2 py-1.5 text-[11px] font-medium rounded-md transition-all
              ${selectedInterval === interval.value
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
              ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {interval.label}
          </button>
        ))}
      </div>
    );
  }

  // Two-row version (default)
  return (
    <div className={`flex flex-col gap-2 ${disabled ? 'opacity-50' : ''}`}>
      {/* Period Selection */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide w-12 flex-shrink-0">
          Period
        </span>
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {PERIODS.map((period) => (
            <button
              key={period.value}
              onClick={() => handlePeriodChange(period.value)}
              disabled={disabled}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200
                ${selectedPeriod === period.value
                  ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                }
                ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interval Selection */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide w-12 flex-shrink-0">
          Interval
        </span>
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {availableIntervals.map((interval) => (
            <button
              key={interval.value}
              onClick={() => handleIntervalChange(interval.value)}
              disabled={disabled}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200
                ${selectedInterval === interval.value
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                }
                ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {interval.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Export types for use in other components
export type { PeriodType, IntervalType };
