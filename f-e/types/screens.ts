// Live Screens Types

export type ScreenCategory = 'momentum' | 'sector' | 'unusual' | 'technical' | 'value' | 'volatility';

// All available categories for selection
export const allScreenCategories: ScreenCategory[] = ['momentum', 'sector', 'unusual', 'technical', 'value', 'volatility'];

// Screen template definitions - all available screen types
export const screenTemplates: Record<string, {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: ScreenCategory;
}> = {
  'morning-movers': {
    id: 'morning-movers',
    title: 'Morning Movers',
    description: 'Top pre-market gainers with high volume',
    icon: '🚀',
    category: 'momentum',
  },
  'oversold-bounces': {
    id: 'oversold-bounces',
    title: 'Oversold Bounces',
    description: 'Stocks with RSI < 30 showing reversal signals',
    icon: '📉',
    category: 'technical',
  },
  'unusual-volume': {
    id: 'unusual-volume',
    title: 'Unusual Volume',
    description: 'Stocks trading 3x+ their average volume',
    icon: '🔥',
    category: 'unusual',
  },
  'value-plays': {
    id: 'value-plays',
    title: 'Value Plays',
    description: 'Low P/E stocks near 52-week lows',
    icon: '💎',
    category: 'value',
  },
  'volatility-squeeze': {
    id: 'volatility-squeeze',
    title: 'Volatility Squeeze',
    description: 'Tight Bollinger Bands about to expand',
    icon: '⚡',
    category: 'volatility',
  },
  'sector-rotation': {
    id: 'sector-rotation',
    title: 'Sector Rotation',
    description: "Today's hottest sector with top performers",
    icon: '🏭',
    category: 'sector',
  },
  'breakout-watch': {
    id: 'breakout-watch',
    title: 'Breakout Watch',
    description: 'Stocks approaching key resistance levels',
    icon: '📊',
    category: 'technical',
  },
  'short-squeeze': {
    id: 'short-squeeze',
    title: 'Short Squeeze Candidates',
    description: 'High short interest with bullish signals',
    icon: '🐻',
    category: 'unusual',
  },
};

export interface LiveScreenStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  valueChange: number;
  sparkline: number[];
  timeframe: string;
  // Screen-specific metrics
  screenReason: string; // Why this stock is in this screen
  rank?: number; // Position in the screen (1 = top)
  score?: number; // AI confidence score (0-100)
  signals?: string[]; // e.g., ['RSI Oversold', 'Volume Spike', 'Golden Cross']
}

export interface LiveScreen {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji
  category: ScreenCategory;
  stocks: LiveScreenStock[];
  generatedAt: string; // ISO timestamp
  expiresAt: string; // When this screen refreshes (typically next trading day)
  refreshInterval?: number; // Optional intraday refresh in minutes
}

export interface LiveScreensConfig {
  maxScreensPerDay: number; // 4
  maxStocksPerScreen: number; // 10
  refreshTime: string; // e.g., "09:30" (market open)
}

// Category styling configuration
export const categoryConfig: Record<ScreenCategory, {
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  momentum: {
    color: 'text-green-400',
    bgColor: 'bg-green-500/15',
    borderColor: 'border-green-500/30',
    label: 'Momentum',
  },
  sector: {
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/15',
    borderColor: 'border-purple-500/30',
    label: 'Sector',
  },
  unusual: {
    color: 'text-red-400',
    bgColor: 'bg-red-500/15',
    borderColor: 'border-red-500/30',
    label: 'Unusual Activity',
  },
  technical: {
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/15',
    borderColor: 'border-cyan-500/30',
    label: 'Technical',
  },
  value: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/15',
    borderColor: 'border-blue-500/30',
    label: 'Value',
  },
  volatility: {
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/15',
    borderColor: 'border-orange-500/30',
    label: 'Volatility',
  },
};

// Default configuration
export const defaultLiveScreensConfig: LiveScreensConfig = {
  maxScreensPerDay: 4,
  maxStocksPerScreen: 10,
  refreshTime: '09:30',
};
