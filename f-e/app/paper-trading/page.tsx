'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  History, 
  Briefcase, 
  Settings, 
  RefreshCw,
  FileText,
  ChevronRight
} from 'lucide-react';
import { usePaperTrading } from '@/components/context/PaperTradingContext';

type Tab = 'overview' | 'history' | 'settings';

interface Trade {
  id: number;
  symbol: string;
  name: string;
  side: 'buy' | 'sell';
  quantity: string;
  price: string;
  total_amount: string;
  executed_at: string;
}

interface OptionTrade {
  id: number;
  contract: {
    contract_symbol: string;
    underlying_symbol: string;
    option_type: string;
    strike_price: string;
    expiration_date: string;
  };
  action: string;
  quantity: number;
  premium: string;
  total_amount: string;
  executed_at: string;
}

export default function PaperTradingPage() {
  const router = useRouter();
  const { 
    isEnabled, 
    account, 
    positions, 
    isLoading, 
    refreshAccount,
    toggleEnabled 
  } = usePaperTrading();
  
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [optionTrades, setOptionTrades] = useState<OptionTrade[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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

  // Fetch trade history
  const fetchTradeHistory = useCallback(async () => {
    const email = getUserEmail();
    if (!email) return;

    setIsLoadingHistory(true);
    try {
      // Fetch stock trades
      const tradesRes = await fetch(`${BACKEND_URL}/api/paper-trading/trades/`, {
        headers: { 'X-User-Email': email }
      });
      if (tradesRes.ok) {
        const data = await tradesRes.json();
        setTrades(data.trades || []);
      }

      // Fetch option trades
      const optionTradesRes = await fetch(`${BACKEND_URL}/api/paper-trading/options/trades/`, {
        headers: { 'X-User-Email': email }
      });
      if (optionTradesRes.ok) {
        const data = await optionTradesRes.json();
        setOptionTrades(data.trades || []);
      }
    } catch (error) {
      console.error('Error fetching trade history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [BACKEND_URL]);

  // Fetch trade history when History tab is selected
  useEffect(() => {
    if (activeTab === 'history' && isEnabled) {
      fetchTradeHistory();
    }
  }, [activeTab, isEnabled, fetchTradeHistory]);

  const handleResetAccount = async () => {
    if (!confirm('Are you sure you want to reset your paper trading account? All positions and trade history will be deleted.')) {
      return;
    }

    const email = getUserEmail();
    if (!email) return;

    setIsResetting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/paper-trading/account/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': email
        },
        body: JSON.stringify({ initial_balance: '1000' })
      });

      if (res.ok) {
        await refreshAccount();
        setTrades([]);
        setOptionTrades([]);
        alert('Account reset successfully!');
      }
    } catch (error) {
      console.error('Error resetting account:', error);
      alert('Failed to reset account');
    } finally {
      setIsResetting(false);
    }
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPercent = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  // If paper trading is not enabled, show enable prompt
  if (!isEnabled) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-900 dark:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Paper Trading</h1>
            <div className="w-10" />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-8 mt-20">
          <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 text-orange-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Paper Trading Disabled</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-sm">
            Enable paper trading to practice trading with virtual money. No real money involved!
          </p>
          <button
            onClick={toggleEnabled}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Enable Paper Trading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-900 dark:text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Paper Trading</h1>
          <button onClick={refreshAccount} className="p-2 -mr-2 text-gray-900 dark:text-white">
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'overview' 
                ? 'text-orange-500 border-b-2 border-orange-500' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'history' 
                ? 'text-orange-500 border-b-2 border-orange-500' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <History className="w-4 h-4" />
            History
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'settings' 
                ? 'text-orange-500 border-b-2 border-orange-500' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Account Summary Card */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5">
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Total Portfolio Value</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {account ? formatCurrency(account.total_value) : '$0.00'}
              </p>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">Cash</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {account ? formatCurrency(account.balance) : '$0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">P&L</p>
                  <p className={`font-medium ${
                    account && parseFloat(account.total_pl) >= 0 
                      ? 'text-green-500' 
                      : 'text-red-500'
                  }`}>
                    {account ? formatCurrency(account.total_pl) : '$0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">Return</p>
                  <p className={`font-medium ${
                    account && parseFloat(account.total_pl_percent) >= 0 
                      ? 'text-green-500' 
                      : 'text-red-500'
                  }`}>
                    {account ? formatPercent(account.total_pl_percent) : '0.00%'}
                  </p>
                </div>
              </div>
            </div>

            {/* Holdings */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Holdings</h2>
              {positions.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No positions yet</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                    Start trading from any stock page
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {positions.map((position) => {
                    const pl = parseFloat(position.unrealized_pl);
                    const plPercent = parseFloat(position.unrealized_pl_percent);
                    const isPositive = pl >= 0;
                    
                    return (
                      <div
                        key={position.symbol}
                        onClick={() => router.push(`/stock/${position.symbol}`)}
                        className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              {position.symbol.slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{position.symbol}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                              {position.quantity} shares @ {formatCurrency(position.average_cost)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(position.market_value)}</p>
                            <div className={`flex items-center justify-end gap-1 text-sm ${
                              isPositive ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {isPositive ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              <span>{formatPercent(plPercent)}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                {/* Stock Trades */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Stock Trades</h2>
                  {trades.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
                      <p className="text-gray-500 dark:text-gray-400">No stock trades yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {trades.map((trade) => (
                        <div
                          key={trade.id}
                          className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                trade.side === 'buy' 
                                  ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                                  : 'bg-red-500/20 text-red-600 dark:text-red-400'
                              }`}>
                                {trade.side.toUpperCase()}
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">{trade.symbol}</span>
                            </div>
                            <span className="text-gray-500 dark:text-gray-400 text-sm">
                              {formatDate(trade.executed_at)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">
                              {trade.quantity} shares @ {formatCurrency(trade.price)}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatCurrency(trade.total_amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Option Trades */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Option Trades</h2>
                  {optionTrades.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
                      <p className="text-gray-500 dark:text-gray-400">No option trades yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {optionTrades.map((trade) => (
                        <div
                          key={trade.id}
                          className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                trade.action.includes('buy') 
                                  ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                                  : 'bg-red-500/20 text-red-600 dark:text-red-400'
                              }`}>
                                {trade.action.replace(/_/g, ' ').toUpperCase()}
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {trade.contract.underlying_symbol}
                              </span>
                            </div>
                            <span className="text-gray-500 dark:text-gray-400 text-sm">
                              {formatDate(trade.executed_at)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {formatCurrency(trade.contract.strike_price)} {trade.contract.option_type.toUpperCase()} • Exp: {trade.contract.expiration_date}
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">
                              {trade.quantity} contract{trade.quantity > 1 ? 's' : ''} @ {formatCurrency(trade.premium)}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatCurrency(trade.total_amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Account Info */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Account Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Initial Balance</span>
                  <span className="text-gray-900 dark:text-white">{account ? formatCurrency(account.initial_balance) : '$1,000.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Account Created</span>
                  <span className="text-gray-900 dark:text-white">{account?.created_at ? formatDate(account.created_at) : '-'}</span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-red-500/20">
              <h3 className="font-medium text-red-500 mb-2">Danger Zone</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                Resetting your account will delete all positions and trade history. Your balance will be reset to $1,000.
              </p>
              <button
                onClick={handleResetAccount}
                disabled={isResetting}
                className="w-full bg-red-500/20 text-red-500 py-3 rounded-xl font-medium disabled:opacity-50 hover:bg-red-500/30 transition-colors"
              >
                {isResetting ? 'Resetting...' : 'Reset Account'}
              </button>
            </div>

            {/* Disable Paper Trading */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Disable Paper Trading</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                Disabling will hide paper trading features across the app. Your data will be preserved.
              </p>
              <button
                onClick={toggleEnabled}
                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white py-3 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Disable Paper Trading
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
