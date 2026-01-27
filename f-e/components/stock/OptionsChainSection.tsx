'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, TrendingDown, Loader2, AlertCircle, 
  Calendar, DollarSign, 
  ArrowUpRight, ArrowDownRight, RefreshCw, ExternalLink
} from 'lucide-react';
import { usePaperTrading } from '@/components/context/PaperTradingContext';
import { useToast } from '@/components/context/ToastContext';

interface OptionContract {
  contract_symbol: string;
  underlying_symbol: string;
  option_type: 'call' | 'put';
  strike: number;
  expiration: string;
  bid: number;
  ask: number;
  last: number;
  mark: number;
  volume: number;
  open_interest: number;
  implied_volatility: number;
  in_the_money: boolean;
  change: number;
  percent_change: number;
}

interface OptionsChainData {
  symbol: string;
  expirations: string[];
  selected_expiration: string;
  calls: OptionContract[];
  puts: OptionContract[];
  total_contracts: number;
}

interface OptionsChainSectionProps {
  symbol: string;
  currentPrice: number;
  onTradeComplete?: () => void;
}

type OptionAction = 'buy_to_open' | 'sell_to_close' | 'sell_to_open' | 'buy_to_close';

export default function OptionsChainSection({
  symbol,
  currentPrice,
  onTradeComplete,
}: OptionsChainSectionProps) {
  const router = useRouter();
  const { isEnabled, account, refreshAccount, optionPositions } = usePaperTrading();
  const { showToast } = useToast();

  const [chainData, setChainData] = useState<OptionsChainData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedExpiration, setSelectedExpiration] = useState<string>('');
  const [viewMode, setViewMode] = useState<'calls' | 'puts' | 'both'>('both');
  const [selectedContract, setSelectedContract] = useState<OptionContract | null>(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  
  // Trade form state
  const [tradeAction, setTradeAction] = useState<OptionAction>('buy_to_open');
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState<string>('');
  const [isTrading, setIsTrading] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

  // Check if symbol supports options trading
  const supportsOptions = useCallback((sym: string): boolean => {
    // Futures symbols (e.g., CL=F, GC=F, ES=F)
    if (sym.includes('=F')) return false;
    // Forex symbols (e.g., EURUSD=X)
    if (sym.includes('=X')) return false;
    // Crypto symbols (e.g., BTC-USD, ETH-USD)
    if (sym.includes('-USD') || sym.includes('-EUR')) return false;
    // Index symbols (e.g., ^GSPC, ^DJI)
    if (sym.startsWith('^')) return false;
    return true;
  }, []);

  const getUserEmail = (): string | null => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    if (!user) return null;
    try {
      return JSON.parse(user).email;
    } catch {
      return null;
    }
  };

  // Fetch options chain data
  const fetchOptionsChain = useCallback(async (expiration?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      let url = `${BACKEND_URL}/api/paper-trading/options/chain/?symbol=${encodeURIComponent(symbol)}`;
      if (expiration) {
        url += `&expiration=${encodeURIComponent(expiration)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch options chain');
      }

      setChainData(data);
      if (!selectedExpiration && data.selected_expiration) {
        setSelectedExpiration(data.selected_expiration);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load options chain';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, selectedExpiration, BACKEND_URL]);

  // Load options chain on mount
  useEffect(() => {
    if (isEnabled && supportsOptions(symbol)) {
      fetchOptionsChain();
    }
  }, [isEnabled, fetchOptionsChain, symbol, supportsOptions]);

  // Refetch when expiration changes
  const handleExpirationChange = (expiration: string) => {
    setSelectedExpiration(expiration);
    fetchOptionsChain(expiration);
  };

  // Check if user has a position in a contract
  const getPosition = (contractSymbol: string) => {
    return optionPositions?.find(p => p.contract.contract_symbol === contractSymbol);
  };

  // Execute option trade
  const executeOptionTrade = async () => {
    if (!selectedContract) return;

    const email = getUserEmail();
    if (!email) {
      showToast('Please log in to trade', 'error', 5000);
      return;
    }

    setIsTrading(true);

    try {
      // Use custom price if provided, otherwise use market price
      const premium = customPrice ? parseFloat(customPrice) : (selectedContract.mark || selectedContract.last || selectedContract.ask);
      
      const response = await fetch(`${BACKEND_URL}/api/paper-trading/options/trades/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': email,
        },
        body: JSON.stringify({
          contract_symbol: selectedContract.contract_symbol,
          action: tradeAction,
          quantity,
          premium,
          contract: {
            underlying_symbol: selectedContract.underlying_symbol,
            option_type: selectedContract.option_type,
            strike_price: selectedContract.strike,
            expiration_date: selectedContract.expiration,
            multiplier: 100,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Trade failed');
      }

      const actionText = tradeAction.replace(/_/g, ' ');
      const successMessage = `${actionText.charAt(0).toUpperCase() + actionText.slice(1)}: ${quantity} ${selectedContract.underlying_symbol} $${selectedContract.strike} ${selectedContract.option_type.toUpperCase()} @ $${premium.toFixed(2)}`;
      
      showToast(successMessage, 'success', 4000, { link: '/paper-trading' });
      
      setShowTradeModal(false);
      setSelectedContract(null);
      setQuantity(1);
      setCustomPrice('');
      
      await refreshAccount();
      onTradeComplete?.();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Trade failed';
      showToast(errorMessage, 'error', 5000);
    } finally {
      setIsTrading(false);
    }
  };

  // Calculate trade cost
  const calculateTradeCost = () => {
    if (!selectedContract) return 0;
    // Use custom price if provided and valid, otherwise use market price
    const premium = customPrice && parseFloat(customPrice) > 0 
      ? parseFloat(customPrice) 
      : (selectedContract.mark || selectedContract.last || selectedContract.ask);
    const multiplier = 100;
    const totalPremium = quantity * premium * multiplier;
    
    if (tradeAction === 'buy_to_open' || tradeAction === 'buy_to_close') {
      return totalPremium; // Cost to buy
    } else {
      return -totalPremium; // Credit from selling
    }
  };

  // Format expiration date for display
  const formatExpiration = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Calculate days to expiration
  const getDTE = (dateStr: string) => {
    const exp = new Date(dateStr);
    const today = new Date();
    const diff = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  if (!isEnabled) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Enable Paper Trading to view options chain
      </div>
    );
  }

  // Check if symbol supports options
  if (!supportsOptions(symbol)) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <p className="font-medium">Options not available</p>
        <p className="text-sm mt-1">Options trading is not supported for {symbol.includes('=F') ? 'futures' : symbol.includes('=X') ? 'forex' : symbol.startsWith('^') ? 'index' : 'this asset type'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Options Chain</h3>
        </div>
        <button
          onClick={() => fetchOptionsChain(selectedExpiration)}
          disabled={isLoading}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Current Stock Price Reference */}
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">Current Price</span>
        <span className="font-mono font-semibold text-gray-900 dark:text-white">
          ${currentPrice.toFixed(2)}
        </span>
      </div>

      {/* Loading State */}
      {isLoading && !chainData && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          <span className="ml-2 text-gray-500">Loading options chain...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Options Chain Data */}
      {chainData && (
        <>
          {/* Expiration Selector */}
          <div className="space-y-2">
            <label className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Expiration Date
            </label>
            <select
              value={selectedExpiration}
              onChange={(e) => handleExpirationChange(e.target.value)}
              className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {chainData.expirations.map((exp) => (
                <option key={exp} value={exp}>
                  {formatExpiration(exp)} ({getDTE(exp)} DTE)
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            {(['calls', 'puts', 'both'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? mode === 'calls' 
                      ? 'bg-green-500 text-white'
                      : mode === 'puts'
                      ? 'bg-red-500 text-white'
                      : 'bg-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* Options Table */}
          <div className="overflow-x-auto">
            {/* Calls */}
            {(viewMode === 'calls' || viewMode === 'both') && chainData.calls.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4" />
                  CALLS
                </h4>
                <div className="space-y-2">
                  {(() => {
                    const filteredCalls = chainData.calls
                      .filter(c => Math.abs(c.strike - currentPrice) / currentPrice < 0.15)
                      .sort((a, b) => a.strike - b.strike);
                    
                    // Find where to insert the current price marker
                    let priceMarkerInserted = false;
                    const elements: React.ReactNode[] = [];
                    
                    filteredCalls.forEach((contract, index) => {
                      // Insert price marker before the first OTM call (strike > currentPrice)
                      if (!priceMarkerInserted && contract.strike > currentPrice) {
                        elements.push(
                          <div key="price-marker-calls" className="flex items-center gap-2 py-2 my-1">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-500 to-yellow-500"></div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-600 rounded-full">
                              <DollarSign className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
                              <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300">
                                Current: ${currentPrice.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-yellow-500 to-yellow-500"></div>
                          </div>
                        );
                        priceMarkerInserted = true;
                      }
                      
                      const position = getPosition(contract.contract_symbol);
                      const isITM = contract.in_the_money;
                      const pctChange = contract.percent_change || 0;
                      const isPositive = pctChange >= 0;
                      
                      elements.push(
                        <div
                          key={contract.contract_symbol}
                          className={`w-full p-3 rounded-lg transition-all hover:scale-[1.01] ${
                            isITM 
                              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                          } ${position ? 'ring-2 ring-purple-500' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => router.push(`/option/${encodeURIComponent(contract.contract_symbol)}`)}
                              className="flex-1 text-left"
                            >
                              <span className={`text-lg font-bold ${isITM ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                ${contract.strike.toFixed(2)}
                              </span>
                              {isITM && (
                                <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                                  ITM
                                </span>
                              )}
                              {position && (
                                <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                                  {position.quantity}x {position.position_type}
                                </span>
                              )}
                            </button>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="font-mono font-semibold text-gray-900 dark:text-white">
                                  ${contract.mark.toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {contract.bid.toFixed(2)} / {contract.ask.toFixed(2)}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedContract(contract);
                                  setShowTradeModal(true);
                                  setTradeAction(position ? 'sell_to_close' : 'buy_to_open');
                                  setCustomPrice('');
                                }}
                                className={`px-2 py-2 rounded-lg transition-colors text-white font-semibold text-xs min-w-[52px] ${
                                  isPositive 
                                    ? 'bg-green-500 hover:bg-green-600' 
                                    : 'bg-red-500 hover:bg-red-600'
                                }`}
                                title="Trade"
                              >
                                {isPositive ? '+' : ''}{pctChange.toFixed(1)}%
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => router.push(`/option/${encodeURIComponent(contract.contract_symbol)}`)}
                            className="w-full flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400"
                          >
                            <span>Vol: {contract.volume.toLocaleString()}</span>
                            <span>OI: {contract.open_interest.toLocaleString()}</span>
                            <span>IV: {contract.implied_volatility.toFixed(1)}%</span>
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </button>
                        </div>
                      );
                    });
                    
                    return elements;
                  })()}
                </div>
              </div>
            )}

            {/* Puts */}
            {(viewMode === 'puts' || viewMode === 'both') && chainData.puts.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4" />
                  PUTS
                </h4>
                <div className="space-y-2">
                  {(() => {
                    const filteredPuts = chainData.puts
                      .filter(c => Math.abs(c.strike - currentPrice) / currentPrice < 0.15)
                      .sort((a, b) => a.strike - b.strike);
                    
                    // Find where to insert the current price marker
                    let priceMarkerInserted = false;
                    const elements: React.ReactNode[] = [];
                    
                    filteredPuts.forEach((contract) => {
                      // Insert price marker before the first OTM put (strike < currentPrice means ITM for puts)
                      // For puts, OTM is when strike < currentPrice, so we insert marker after the last ITM put
                      if (!priceMarkerInserted && contract.strike > currentPrice) {
                        elements.push(
                          <div key="price-marker-puts" className="flex items-center gap-2 py-2 my-1">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-500 to-yellow-500"></div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-600 rounded-full">
                              <DollarSign className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
                              <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300">
                                Current: ${currentPrice.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-yellow-500 to-yellow-500"></div>
                          </div>
                        );
                        priceMarkerInserted = true;
                      }
                      
                      const position = getPosition(contract.contract_symbol);
                      const isITM = contract.in_the_money;
                      const pctChange = contract.percent_change || 0;
                      const isPositive = pctChange >= 0;
                      
                      elements.push(
                        <div
                          key={contract.contract_symbol}
                          className={`w-full p-3 rounded-lg transition-all hover:scale-[1.01] ${
                            isITM 
                              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                          } ${position ? 'ring-2 ring-purple-500' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => router.push(`/option/${encodeURIComponent(contract.contract_symbol)}`)}
                              className="flex-1 text-left"
                            >
                              <span className={`text-lg font-bold ${isITM ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                ${contract.strike.toFixed(2)}
                              </span>
                              {isITM && (
                                <span className="ml-2 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                                  ITM
                                </span>
                              )}
                              {position && (
                                <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                                  {position.quantity}x {position.position_type}
                                </span>
                              )}
                            </button>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="font-mono font-semibold text-gray-900 dark:text-white">
                                  ${contract.mark.toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {contract.bid.toFixed(2)} / {contract.ask.toFixed(2)}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedContract(contract);
                                  setShowTradeModal(true);
                                  setTradeAction(position ? 'sell_to_close' : 'buy_to_open');
                                  setCustomPrice('');
                                }}
                                className={`px-2 py-2 rounded-lg transition-colors text-white font-semibold text-xs min-w-[52px] ${
                                  isPositive 
                                    ? 'bg-green-500 hover:bg-green-600' 
                                    : 'bg-red-500 hover:bg-red-600'
                                }`}
                                title="Trade"
                              >
                                {isPositive ? '+' : ''}{pctChange.toFixed(1)}%
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => router.push(`/option/${encodeURIComponent(contract.contract_symbol)}`)}
                            className="w-full flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400"
                          >
                            <span>Vol: {contract.volume.toLocaleString()}</span>
                            <span>OI: {contract.open_interest.toLocaleString()}</span>
                            <span>IV: {contract.implied_volatility.toFixed(1)}%</span>
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </button>
                        </div>
                      );
                    });
                    
                    return elements;
                  })()}
                </div>
              </div>
            )}

            {chainData.calls.length === 0 && chainData.puts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No options available for this expiration
              </div>
            )}
          </div>
        </>
      )}

      {/* Trade Modal */}
      {showTradeModal && selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Trade Option
            </h3>

            {/* Contract Info */}
            <div className={`p-4 rounded-lg mb-4 ${
              selectedContract.option_type === 'call'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg">
                  {selectedContract.underlying_symbol} ${selectedContract.strike} {selectedContract.option_type.toUpperCase()}
                </span>
                <span className={`text-sm font-medium ${
                  selectedContract.option_type === 'call' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatExpiration(selectedContract.expiration)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Mark Price</span>
                <span className="font-mono font-semibold">${selectedContract.mark.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Bid / Ask</span>
                <span className="font-mono">${selectedContract.bid.toFixed(2)} / ${selectedContract.ask.toFixed(2)}</span>
              </div>
            </div>

            {/* Trade Action */}
            <div className="space-y-2 mb-4">
              <label className="text-sm text-gray-500 dark:text-gray-400">Action</label>
              <div className="grid grid-cols-2 gap-2">
                {(['buy_to_open', 'sell_to_open', 'buy_to_close', 'sell_to_close'] as const).map((action) => (
                  <button
                    key={action}
                    onClick={() => setTradeAction(action)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      tradeAction === action
                        ? action.startsWith('buy')
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Per Contract */}
            <div className="space-y-2 mb-4">
              <label className="text-sm text-gray-500 dark:text-gray-400">Price Per Contract</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder={(selectedContract.mark || selectedContract.last || selectedContract.ask).toFixed(2)}
                  className="w-full h-12 pl-8 pr-4 font-mono text-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-400">
                Leave blank to use market price (${(selectedContract.mark || selectedContract.last || selectedContract.ask).toFixed(2)})
              </p>
            </div>

            {/* Quantity */}
            <div className="space-y-2 mb-4">
              <label className="text-sm text-gray-500 dark:text-gray-400">Contracts</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 h-10 text-center font-mono text-lg font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  +
                </button>
              </div>
            </div>

            {/* Cost/Credit Summary */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 dark:text-gray-400">
                  {calculateTradeCost() >= 0 ? 'Total Cost' : 'Total Credit'}
                </span>
                <span className={`font-mono font-bold text-lg ${
                  calculateTradeCost() >= 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  ${Math.abs(calculateTradeCost()).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Available Balance</span>
                <span className="font-mono">${account ? parseFloat(account.balance).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTradeModal(false);
                  setSelectedContract(null);
                }}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeOptionTrade}
                disabled={isTrading || (calculateTradeCost() > 0 && !!account && calculateTradeCost() > parseFloat(account.balance))}
                className={`flex-1 py-3 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors ${
                  tradeAction.startsWith('buy')
                    ? 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300'
                    : 'bg-red-500 hover:bg-red-600 text-white disabled:bg-gray-300'
                }`}
              >
                {isTrading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {tradeAction.startsWith('buy') ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    Confirm Trade
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
