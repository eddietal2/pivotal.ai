'use client';

import React, { useState } from 'react';
import { FileText, TrendingUp, TrendingDown, DollarSign, Minus, Plus, AlertCircle, Check, Loader2 } from 'lucide-react';
import { usePaperTrading } from '@/components/context/PaperTradingContext';
import { useToast } from '@/components/context/ToastContext';

interface PaperTradingSectionProps {
  symbol: string;
  name: string;
  currentPrice: number;
  onTradeComplete?: () => void;
  hideHeader?: boolean;
}

export default function PaperTradingSection({
  symbol,
  name,
  currentPrice,
  onTradeComplete,
  hideHeader = false,
}: PaperTradingSectionProps) {
  const {
    isEnabled,
    account,
    positions,
    hasPosition,
    getPosition,
    refreshAccount,
    isLoading: isAccountLoading,
  } = usePaperTrading();
  const { showToast } = useToast();

  const [quantity, setQuantity] = useState(1);
  const [isTrading, setIsTrading] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [tradeSuccess, setTradeSuccess] = useState<string | null>(null);

  const position = getPosition(symbol);
  const hasOpenPosition = hasPosition(symbol);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

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

  const executeTrade = async (side: 'buy' | 'sell') => {
    const email = getUserEmail();
    if (!email) {
      setTradeError('Please log in to trade');
      return;
    }

    setIsTrading(true);
    setTradeError(null);
    setTradeSuccess(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/paper-trading/trades/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': email,
        },
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          name,
          side,
          quantity,
          price: currentPrice,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Trade failed');
      }

      const successMessage = `${side === 'buy' ? 'Bought' : 'Sold'} ${quantity} share${quantity > 1 ? 's' : ''} of ${symbol} at $${currentPrice.toFixed(2)}`;
      setTradeSuccess(successMessage);
      setQuantity(1);
      
      // Show toast notification
      showToast(
        successMessage,
        side === 'buy' ? 'success' : 'info',
        3000,
        { link: '/paper-trading' }
      );
      
      // Refresh account data
      await refreshAccount();
      
      // Clear success message after 3 seconds
      setTimeout(() => setTradeSuccess(null), 3000);
      
      onTradeComplete?.();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to execute trade';
      setTradeError(errorMessage);
      showToast(errorMessage, 'error', 5000);
      setTimeout(() => setTradeError(null), 5000);
    } finally {
      setIsTrading(false);
    }
  };

  const totalCost = quantity * currentPrice;
  const balance = account ? parseFloat(account.balance) : 0;
  const canAfford = balance >= totalCost;
  const positionQuantity = position ? parseInt(position.quantity) : 0;
  const canSell = positionQuantity >= quantity;

  // Don't render if paper trading is disabled
  if (!isEnabled) {
    return null;
  }

  return (
    <div className={hideHeader ? 'p-4 space-y-4' : 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 space-y-4'}>
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Paper Trading</h3>
          {isAccountLoading && <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />}
        </div>
      )}

      {/* Current Position (if any) */}
      {hasOpenPosition && position && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Your Position</span>
            <span className="text-sm font-mono text-gray-900 dark:text-white">
              {position.quantity} shares
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Avg Cost</span>
            <span className="text-sm font-mono text-gray-900 dark:text-white">
              ${parseFloat(position.average_cost).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Market Value</span>
            <span className="text-sm font-mono text-gray-900 dark:text-white">
              ${parseFloat(position.market_value).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">P&L</span>
            <span className={`text-sm font-mono font-semibold flex items-center gap-1 ${
              parseFloat(position.unrealized_pl) >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {parseFloat(position.unrealized_pl) >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              ${parseFloat(position.unrealized_pl).toFixed(2)} ({parseFloat(position.unrealized_pl_percent).toFixed(2)}%)
            </span>
          </div>
        </div>
      )}

      {/* Account Balance */}
      {account && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Available Balance</span>
          <span className="font-mono font-semibold text-gray-900 dark:text-white">
            ${parseFloat(account.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}

      {/* Quantity Selector */}
      <div className="space-y-2">
        <label className="text-sm text-gray-500 dark:text-gray-400">Quantity</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1 || isTrading}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            disabled={isTrading}
            className="w-20 h-10 text-center font-mono text-lg font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            onClick={() => setQuantity(quantity + 1)}
            disabled={isTrading}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="flex-1 text-right">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total: </span>
            <span className="font-mono font-semibold text-gray-900 dark:text-white">
              ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Trade Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => executeTrade('buy')}
          disabled={isTrading || !canAfford}
          className={`flex-1 py-3 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
            canAfford
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isTrading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <TrendingUp className="w-4 h-4" />
              Buy
            </>
          )}
        </button>
        <button
          onClick={() => executeTrade('sell')}
          disabled={isTrading || !hasOpenPosition || !canSell}
          className={`flex-1 py-3 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
            hasOpenPosition && canSell
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isTrading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <TrendingDown className="w-4 h-4" />
              Sell
            </>
          )}
        </button>
      </div>

      {/* Error/Success Messages */}
      {tradeError && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {tradeError}
        </div>
      )}
      {tradeSuccess && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <Check className="w-4 h-4 flex-shrink-0" />
          {tradeSuccess}
        </div>
      )}

      {/* Warnings */}
      {!canAfford && quantity > 0 && (
        <p className="text-xs text-orange-600 dark:text-orange-400">
          Insufficient balance for this purchase
        </p>
      )}
      {hasOpenPosition && !canSell && quantity > positionQuantity && (
        <p className="text-xs text-orange-600 dark:text-orange-400">
          You only have {positionQuantity} share{positionQuantity > 1 ? 's' : ''} to sell
        </p>
      )}
    </div>
  );
}
