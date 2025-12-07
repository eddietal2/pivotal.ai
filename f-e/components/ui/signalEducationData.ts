import React from 'react';
import { TrendingUp, ArrowUp, Activity, Layers, Zap, BarChart2, Flag, Percent, CloudLightning, DollarSign, Target } from 'lucide-react';

export interface SignalEducationCardData {
  title: string;
  subtitle?: string;
  description: string;
  examples?: string[];
  badge?: string;
  Icon?: React.ComponentType<any>;
}

export const signalEducationCards: SignalEducationCardData[] = [
  {
    title: 'Moving Average (MA)',
    subtitle: 'Foundation (Trend)',
    description: 'The Pullback Entry: price dips back to a moving average (e.g., 20/50 EMA) within a clear trend and then shows a strong bounce on reversal candle. MAs act as dynamic support/resistance.',
    examples: ['20/50 EMA alignment', 'Bounce/reversal candle at MA', 'Confluence with volume spike'],
    badge: 'Trend',
    Icon: TrendingUp,
  },
  {
    title: 'MACD Crossover (Bullish)',
    subtitle: 'Foundation (Momentum)',
    description: 'Bullish when the MACD line crosses above the Signal line. This indicates a pickup in bullish momentum and often precedes a price advance.',
    examples: ['MACD line crossing above Signal line', 'Follow-through on breakout with rising volume'],
    badge: 'Momentum',
    Icon: Activity,
  },
  {
    title: 'MACD Crossover (Bearish)',
    subtitle: 'Foundation (Momentum)',
    description: 'Bearish when the MACD line crosses below the Signal line. This indicates a pickup in bearish momentum and often precedes a price decline.',
    examples: ['MACD line crossing below Signal line', 'Follow-through on breakdown with higher selling volume'],
    badge: 'Momentum',
    Icon: Activity,
  },
  {
    title: 'RSI (Relative Strength Index)',
    subtitle: 'Foundation (Reversal)',
    description: 'RSI identifies price extremes — buy when RSI drops below 30 (Oversold), sell when it rises above 70 (Overbought). Useful in ranging markets to anticipate mean reversion.',
    examples: ['RSI < 30 in oversold market', 'RSI > 70 on sharp rallies'],
    badge: 'Reversal',
    Icon: Percent,
  },
  {
    title: 'Bollinger Bands (BB)',
    subtitle: 'Foundation (Volatility)',
    description: "When bands squeeze (low volatility) and then a decisive candle breaks above or below the bands, this can signal a high-probability directional breakout.",
    examples: ['BB squeeze then breakout', 'Expansion with volume confirming breakout'],
    badge: 'Volatility',
    Icon: Zap,
  },
  {
    title: 'Breakout Trade',
    subtitle: 'Core Setup',
    description: 'Price closes above a well-defined resistance level with significantly higher volume; volume confirms institutional participation and suggests a new trend leg.',
    examples: ['Close above resistance', 'Volume 2x average on breakout'],
    badge: 'Core',
    Icon: ArrowUp,
  },
  {
    title: 'Divergence (RSI/MACD)',
    subtitle: 'Core Setup',
    description: "Bullish divergence: price makes lower lows but the indicator makes higher lows — momentum doesn't confirm the price weakness, often signaling a reversal.",
    examples: ['Price LL + RSI HL (Bullish)', 'MACD divergence showing waning momentum'],
    badge: 'Core',
    Icon: BarChart2,
  },
  {
    title: 'Stochastic Oscillator',
    subtitle: 'Advanced (Timing)',
    description: 'Look for crossovers in the oversold (<20) or overbought (>80) zone — these can offer tight, precise timing for entries within a trend pullback.',
    examples: ['Crossover in oversold zone for buys', 'Crossover in overbought zone for sells'],
    badge: 'Timing',
    Icon: Layers,
  },
  {
    title: 'Ichimoku Cloud',
    subtitle: 'Advanced (Context)',
    description: 'Price above the cloud indicates bullish bias. The cloud (Kumo) provides multiple support/resistance levels and shows trend strength across timeframes.',
    examples: ['Price above cloud on multiple timeframes', 'Kumo twist signaling potential trend reversal'],
    badge: 'Context',
    Icon: CloudLightning,
  },
  {
    title: 'VWAP (Volume Weighted Avg Price)',
    subtitle: 'Advanced (Liquidity)',
    description: 'Price trading above VWAP or successfully testing VWAP as support indicates institutional buying pressure; VWAP acts as an intraday fairness/benchmark.',
    examples: ['Price rejects VWAP as support', 'VWAP cross confirming intraday trend'],
    badge: 'Liquidity',
    Icon: DollarSign,
  },
  {
    title: 'Bull Flag / Pennant',
    subtitle: 'Advanced Setup (Continuation)',
    description: 'After a strong rally, a brief low-volume consolidation (flag/pennant) followed by a breakout on volume often continues the prior uptrend.',
    examples: ['Breakout above flag with increased volume', 'Low-volume consolidation duration shorter than prior trend'],
    badge: 'Continuation',
    Icon: Flag,
  },
  {
    title: 'Falling Wedge',
    subtitle: 'Advanced Setup (Reversal)',
    description: 'A pattern where selling pressure slows and lower lows decelerate; a breakout above the upper wedge line suggests a reversal to the upside.',
    examples: ['Breakout above wedge resistance', 'Decreasing volume during wedge formation'],
    badge: 'Reversal',
    Icon: Target,
  },
  {
    title: 'Average True Range (ATR)',
    subtitle: 'Risk Management',
    description: 'Use ATR to set volatility-adjusted stops; for example, place a stop at 2x ATR away from entry to reduce noise-related stop-outs.',
    examples: ['Stop = entry - 2x ATR (long)', 'Use ATR-based sizing for risk control'],
    badge: 'Risk',
    Icon: Target,
  },
];

export default signalEducationCards;
