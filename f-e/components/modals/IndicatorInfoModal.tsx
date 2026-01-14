"use client";

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, Zap, AlertTriangle, BarChart3, Gauge, Activity, BookOpen, ChevronDown } from 'lucide-react';
import InfoModal from './InfoModal';

interface IndicatorInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EventInfo {
  name: string;
  type: 'bullish' | 'bearish' | 'warning' | 'neutral';
  description: string;
  interpretation: string;
}

interface IndicatorSection {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  description: string;
  events: EventInfo[];
}

const indicatorSections: IndicatorSection[] = [
  {
    title: 'MACD (Moving Average Convergence Divergence)',
    icon: <BarChart3 className="w-5 h-5" />,
    iconColor: 'text-purple-500',
    description: 'MACD is a trend-following momentum indicator that shows the relationship between two moving averages of a security\'s price.',
    events: [
      {
        name: 'Bullish Crossover',
        type: 'bullish',
        description: 'MACD line crosses above the Signal line',
        interpretation: 'A bullish signal suggesting upward momentum is building. Often indicates the start of a new uptrend. Best confirmed with increasing volume.',
      },
      {
        name: 'Bearish Crossover',
        type: 'bearish',
        description: 'MACD line crosses below the Signal line',
        interpretation: 'A bearish signal suggesting downward momentum is building. May indicate the start of a downtrend or pullback. Consider reducing positions.',
      },
      {
        name: 'Above Zero',
        type: 'bullish',
        description: 'Histogram crosses from negative to positive',
        interpretation: 'The short-term average has moved above the long-term average, confirming bullish momentum. Price is in an uptrend.',
      },
      {
        name: 'Below Zero',
        type: 'bearish',
        description: 'Histogram crosses from positive to negative',
        interpretation: 'The short-term average has dropped below the long-term average, confirming bearish momentum. Price is in a downtrend.',
      },
      {
        name: 'Rising Momentum',
        type: 'bullish',
        description: 'Histogram is positive and increasing',
        interpretation: 'Bullish momentum is strengthening. The gap between MACD and Signal line is widening in a bullish direction.',
      },
      {
        name: 'Falling Momentum',
        type: 'bearish',
        description: 'Histogram is negative and decreasing',
        interpretation: 'Bearish momentum is strengthening. The gap between MACD and Signal line is widening in a bearish direction.',
      },
    ],
  },
  {
    title: 'RSI (Relative Strength Index)',
    icon: <Gauge className="w-5 h-5" />,
    iconColor: 'text-blue-500',
    description: 'RSI measures the speed and magnitude of recent price changes to evaluate overbought or oversold conditions. Values range from 0 to 100.',
    events: [
      {
        name: 'Entering Overbought',
        type: 'warning',
        description: 'RSI crosses above 70',
        interpretation: 'The asset may be overbought and due for a pullback. However, in strong uptrends, RSI can remain overbought for extended periods.',
      },
      {
        name: 'Entering Oversold',
        type: 'bullish',
        description: 'RSI crosses below 30',
        interpretation: 'The asset may be oversold and due for a bounce. This can be a buying opportunity, but in strong downtrends, prices can remain oversold.',
      },
      {
        name: 'Exiting Overbought',
        type: 'bearish',
        description: 'RSI crosses back below 70',
        interpretation: 'Upward momentum is fading. This can signal the beginning of a price decline or consolidation period.',
      },
      {
        name: 'Exiting Oversold',
        type: 'bullish',
        description: 'RSI crosses back above 30',
        interpretation: 'Downward momentum is fading. This often signals a potential reversal or the start of a recovery rally.',
      },
      {
        name: 'Bullish Momentum',
        type: 'bullish',
        description: 'RSI is rising and above 50',
        interpretation: 'Price momentum is positive. The trend is likely to continue upward in the near term.',
      },
      {
        name: 'Bearish Momentum',
        type: 'bearish',
        description: 'RSI is falling and below 50',
        interpretation: 'Price momentum is negative. The trend is likely to continue downward in the near term.',
      },
    ],
  },
  {
    title: 'Stochastic Oscillator',
    icon: <TrendingUp className="w-5 h-5" />,
    iconColor: 'text-green-500',
    description: 'The Stochastic Oscillator compares a security\'s closing price to its price range over a given period. %K is the fast line, %D is the slow signal line.',
    events: [
      {
        name: 'Bullish Crossover',
        type: 'bullish',
        description: '%K line crosses above %D line',
        interpretation: 'Short-term momentum is turning positive. Most effective when occurring in oversold territory (below 20).',
      },
      {
        name: 'Bearish Crossover',
        type: 'bearish',
        description: '%K line crosses below %D line',
        interpretation: 'Short-term momentum is turning negative. Most effective when occurring in overbought territory (above 80).',
      },
      {
        name: 'Oversold Bounce',
        type: 'bullish',
        description: '%K is below 20 and starting to rise',
        interpretation: 'The asset is oversold and showing early signs of a potential reversal. Watch for confirmation with price action.',
      },
      {
        name: 'Overbought Reversal',
        type: 'bearish',
        description: '%K is above 80 and starting to decline',
        interpretation: 'The asset is overbought and showing early signs of a potential reversal. Consider taking profits or tightening stops.',
      },
    ],
  },
  {
    title: 'Bollinger Bands',
    icon: <Activity className="w-5 h-5" />,
    iconColor: 'text-cyan-500',
    description: 'Bollinger Bands consist of a middle band (SMA) with upper and lower bands based on standard deviation. %B shows where price is relative to the bands.',
    events: [
      {
        name: 'Upper Band Touch',
        type: 'warning',
        description: 'Price reaches or exceeds the upper band (%B ≥ 100)',
        interpretation: 'Price is at the upper extreme of recent volatility. This can indicate overbought conditions or strong upward momentum in a trend.',
      },
      {
        name: 'Lower Band Touch',
        type: 'bullish',
        description: 'Price reaches or falls below the lower band (%B ≤ 0)',
        interpretation: 'Price is at the lower extreme of recent volatility. This can indicate oversold conditions or a potential buying opportunity.',
      },
      {
        name: 'Upper Breakout',
        type: 'bearish',
        description: 'Price breaks above the upper band',
        interpretation: 'Strong momentum or potential exhaustion. In ranging markets, this often leads to mean reversion. In trending markets, it can signal continuation.',
      },
      {
        name: 'Lower Breakout',
        type: 'bullish',
        description: 'Price breaks below the lower band',
        interpretation: 'Extreme selling or potential capitulation. Often precedes a bounce or reversal, especially with high volume.',
      },
      {
        name: 'Mean Reversion (Bullish)',
        type: 'bullish',
        description: '%B rises back above 20 after being below',
        interpretation: 'Price is reverting toward the middle band from oversold conditions. This often signals the start of a recovery move.',
      },
      {
        name: 'Mean Reversion (Bearish)',
        type: 'bearish',
        description: '%B falls back below 80 after being above',
        interpretation: 'Price is reverting toward the middle band from overbought conditions. This often signals the start of a pullback.',
      },
    ],
  },
];

export default function IndicatorInfoModal({ isOpen, onClose }: IndicatorInfoModalProps) {
  const getEventTypeStyles = (type: EventInfo['type']) => {
    switch (type) {
      case 'bullish':
        return 'bg-green-100 dark:bg-green-900/10 text-gray-700gray dark:text-gray-300 border-green-200 dark:border-green-800';
      case 'bearish':
        return 'bg-red-100 dark:bg-red-900/10 text-gray-700 dark:text-gray-300 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-amber-100 dark:bg-amber-900/10 text-gray-700 dark:text-gray-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const [expandedSections, setExpandedSections] = useState<number[]>([0]);

  const toggleSection = (idx: number) => {
    setExpandedSections((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <InfoModal
      open={isOpen}
      onClose={onClose}
      title={
        <>
          <BookOpen className="w-5 h-5 text-purple-500" />
          Technical Indicator Guide
        </>
      }
      ariaLabel="Technical Indicator Guide"
    >
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 space-y-8">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Understanding event badges and signals displayed on your indicator charts.
        </p>

        {indicatorSections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            {/* Accordion Header */}
            <button
              onClick={() => toggleSection(sectionIdx)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className={section.iconColor}>{section.icon}</span>
                <div className="text-left">
                  <h3 className="font-semibold text-lg">{section.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{section.description}</p>
                </div>
              </div>
              <ChevronDown 
                className={`w-16 h-16 text-gray-500 transition-transform duration-200 ${
                  expandedSections.includes(sectionIdx) ? 'rotate-180' : ''
                }`} 
              />
            </button>

            {/* Accordion Content */}
            <div
              className={`transition-all duration-200 ease-in-out overflow-hidden ${
                expandedSections.includes(sectionIdx) ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="p-4 space-y-3">
                {section.events.map((event, eventIdx) => (
                  <div 
                    key={eventIdx}
                    className={`rounded-xl border p-4 ${getEventTypeStyles(event.type)}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm">{event.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${
                        event.type === 'bullish' ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                        : event.type === 'bearish' ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                        : event.type === 'warning' ? 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                      }`}>
                        {event.type}
                      </span>
                    </div>
                    <p className="text-xs opacity-80 mb-2">{event.description}</p>
                    <p className="text-sm">{event.interpretation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Disclaimer */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mt-6">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <strong>Disclaimer:</strong> Technical indicators are tools for analysis and should not be used as the sole basis for investment decisions. 
            Always consider multiple factors including fundamental analysis, market conditions, and your personal risk tolerance before making trades. 
            Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    </InfoModal>
  );
}
