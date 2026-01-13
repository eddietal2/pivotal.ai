// Live Screens Types

export type ScreenCategory = 'momentum' | 'sector' | 'unusual' | 'technical' | 'value' | 'volatility';

// All available categories for selection
export const allScreenCategories: ScreenCategory[] = ['momentum', 'sector', 'unusual', 'technical', 'value', 'volatility'];

// Screen ID type for all 8 screens
export type ScreenId = 
  | 'morning-movers' 
  | 'unusual-volume' 
  | 'oversold-bounces' 
  | 'overbought-warning' 
  | 'volatility-squeeze' 
  | 'breakout-watch' 
  | 'sector-leaders' 
  | 'value-plays';

// All available screen IDs
export const allScreenIds: ScreenId[] = [
  'morning-movers',
  'unusual-volume', 
  'oversold-bounces',
  'overbought-warning',
  'volatility-squeeze',
  'breakout-watch',
  'sector-leaders',
  'value-plays',
];

// Screen template definitions - all available screen types
export const screenTemplates: Record<ScreenId, {
  id: ScreenId;
  title: string;
  description: string;
  icon: string;
  category: ScreenCategory;
  color: string; // For UI styling
}> = {
  'morning-movers': {
    id: 'morning-movers',
    title: 'Morning Movers',
    description: 'Top gainers with high volume today',
    icon: '🚀',
    category: 'momentum',
    color: 'green',
  },
  'unusual-volume': {
    id: 'unusual-volume',
    title: 'Unusual Volume',
    description: 'Stocks trading 2x+ their average volume',
    icon: '🔥',
    category: 'unusual',
    color: 'red',
  },
  'oversold-bounces': {
    id: 'oversold-bounces',
    title: 'Oversold Bounces',
    description: 'Stocks with RSI < 35 showing reversal',
    icon: '📉',
    category: 'technical',
    color: 'cyan',
  },
  'overbought-warning': {
    id: 'overbought-warning',
    title: 'Overbought Warning',
    description: 'Stocks with RSI > 70 - potential pullback',
    icon: '⚠️',
    category: 'technical',
    color: 'yellow',
  },
  'volatility-squeeze': {
    id: 'volatility-squeeze',
    title: 'Volatility Squeeze',
    description: 'Low volatility stocks ready to move',
    icon: '⚡',
    category: 'volatility',
    color: 'orange',
  },
  'breakout-watch': {
    id: 'breakout-watch',
    title: 'Breakout Watch',
    description: 'Stocks near 52-week highs with momentum',
    icon: '📊',
    category: 'technical',
    color: 'cyan',
  },
  'sector-leaders': {
    id: 'sector-leaders',
    title: 'Sector Leaders',
    description: 'Top performing sector ETFs today',
    icon: '🏭',
    category: 'sector',
    color: 'purple',
  },
  'value-plays': {
    id: 'value-plays',
    title: 'Value Plays',
    description: 'Low P/E stocks with positive momentum',
    icon: '💎',
    category: 'value',
    color: 'blue',
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
