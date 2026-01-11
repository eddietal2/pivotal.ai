/**
 * Utility functions for formatting prices based on asset type
 */

// Assets that are priced in USD and need $ symbol
const CURRENCY_ASSETS = new Set([
  'BTC-USD',    // Bitcoin
  'ETH-USD',    // Ethereum
  'SOL-USD',    // Solana
  'XRP-USD',    // Ripple
  'GC=F',       // Gold
  'SI=F',       // Silver
  'HG=F',       // Copper
  'CL=F',       // Crude Oil
  'NG=F',       // Natural Gas
]);

// Assets that are percentages (yields)
const PERCENTAGE_ASSETS = new Set([
  'DGS10',      // 10-Year Treasury Yield
  'DGS2',       // 2-Year Treasury Yield
]);

// Assets that are ratios/indexes without $ (no symbol needed)
const RATIO_ASSETS = new Set([
  'CALL/PUT Ratio',
  'CRYPTO-FEAR-GREED',  // 0-100 index
]);

// Index assets (points, no $ symbol)
const INDEX_ASSETS = new Set([
  '^GSPC',      // S&P 500
  '^DJI',       // Dow Jones
  '^IXIC',      // Nasdaq
  '^RUT',       // Russell 2000
  '^VIX',       // VIX
]);

/**
 * Check if a symbol represents a currency-priced asset
 */
export function isCurrencyAsset(symbol: string): boolean {
  return CURRENCY_ASSETS.has(symbol);
}

/**
 * Check if a symbol represents a percentage asset (yields)
 */
export function isPercentageAsset(symbol: string): boolean {
  return PERCENTAGE_ASSETS.has(symbol);
}

/**
 * Check if a symbol represents a ratio asset
 */
export function isRatioAsset(symbol: string): boolean {
  return RATIO_ASSETS.has(symbol);
}

/**
 * Check if a symbol represents an index
 */
export function isIndexAsset(symbol: string): boolean {
  return INDEX_ASSETS.has(symbol);
}

/**
 * Get the appropriate prefix for a price display
 */
export function getPricePrefix(symbol: string): string {
  if (isCurrencyAsset(symbol)) return '$';
  return '';
}

/**
 * Get the appropriate suffix for a price display
 */
export function getPriceSuffix(symbol: string): string {
  if (isPercentageAsset(symbol)) return '%';
  return '';
}

/**
 * Format a price value with appropriate prefix/suffix based on symbol
 */
export function formatPriceWithSymbol(
  price: number | string,
  symbol: string,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const { minimumFractionDigits = 2, maximumFractionDigits = 2 } = options || {};
  
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numericPrice)) return String(price);
  
  const formattedNumber = numericPrice.toLocaleString(undefined, {
    minimumFractionDigits,
    maximumFractionDigits,
  });
  
  const prefix = getPricePrefix(symbol);
  const suffix = getPriceSuffix(symbol);
  
  return `${prefix}${formattedNumber}${suffix}`;
}

/**
 * Format axis price for charts (abbreviated large numbers)
 */
export function formatAxisPrice(price: number, symbol: string): string {
  const prefix = getPricePrefix(symbol);
  const suffix = getPriceSuffix(symbol);
  
  let formatted: string;
  if (price >= 10000) {
    formatted = `${(price / 1000).toFixed(0)}K`;
  } else if (price >= 1000) {
    formatted = `${(price / 1000).toFixed(1)}K`;
  } else if (price >= 100) {
    formatted = price.toFixed(0);
  } else if (price >= 1) {
    formatted = price.toFixed(2);
  } else {
    formatted = price.toFixed(4);
  }
  
  return `${prefix}${formatted}${suffix}`;
}
