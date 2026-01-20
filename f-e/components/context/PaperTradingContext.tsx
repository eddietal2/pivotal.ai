'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface PaperTradingAccount {
  id: number;
  balance: string;
  initial_balance: string;
  total_value: string;
  total_pl: string;
  total_pl_percent: string;
  created_at: string;
}

interface PaperTradingPosition {
  symbol: string;
  name: string;
  quantity: string;
  average_cost: string;
  current_price: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_pl_percent: string;
  opened_at: string;
}

interface OptionPosition {
  id: number;
  contract: {
    id: number;
    contract_symbol: string;
    underlying_symbol: string;
    option_type: 'call' | 'put';
    strike_price: string;
    expiration_date: string;
    multiplier: number;
    is_expired: boolean;
    days_to_expiration: number;
  };
  position_type: 'long' | 'short';
  quantity: number;
  average_cost: string;
  current_price: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_pl_percent: string;
  opened_at: string;
}

interface PaperTradingContextType {
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  toggleEnabled: () => void;
  account: PaperTradingAccount | null;
  positions: PaperTradingPosition[];
  optionPositions: OptionPosition[];
  isLoading: boolean;
  error: string | null;
  refreshAccount: () => Promise<void>;
  hasPosition: (symbol: string) => boolean;
  getPosition: (symbol: string) => PaperTradingPosition | undefined;
  hasOptionPosition: (contractSymbol: string) => boolean;
  getOptionPosition: (contractSymbol: string) => OptionPosition | undefined;
  getOptionPositionsForUnderlying: (symbol: string) => OptionPosition[];
}

const PaperTradingContext = createContext<PaperTradingContextType | undefined>(undefined);

const PAPER_TRADING_ENABLED_KEY = 'paper_trading_enabled';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

function getUserEmail(): string | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('user');
  if (!user) return null;
  try {
    return JSON.parse(user).email;
  } catch {
    return null;
  }
}

export const PaperTradingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [account, setAccount] = useState<PaperTradingAccount | null>(null);
  const [positions, setPositions] = useState<PaperTradingPosition[]>([]);
  const [optionPositions, setOptionPositions] = useState<OptionPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load enabled state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PAPER_TRADING_ENABLED_KEY);
      if (saved === 'true') {
        setIsEnabled(true);
      }
    } catch (err) {
      console.error('Error loading paper trading state:', err);
    }
    setIsHydrated(true);
  }, []);

  // Persist enabled state to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(PAPER_TRADING_ENABLED_KEY, String(isEnabled));
    } catch (err) {
      console.error('Error saving paper trading state:', err);
    }
  }, [isEnabled, isHydrated]);

  // Fetch account when enabled
  const refreshAccount = useCallback(async () => {
    const email = getUserEmail();
    if (!email) {
      setError('Not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch stock account and positions
      const response = await fetch(`${BACKEND_URL}/api/paper-trading/account/`, {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': email,
        },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch account');
      }

      const data = await response.json();
      setAccount(data.account);
      setPositions(data.positions || []);

      // Fetch options positions
      try {
        const optionsResponse = await fetch(`${BACKEND_URL}/api/paper-trading/options/positions/`, {
          headers: {
            'Content-Type': 'application/json',
            'X-User-Email': email,
          },
        });

        if (optionsResponse.ok) {
          const optionsData = await optionsResponse.json();
          setOptionPositions(optionsData.positions || []);
        }
      } catch (optErr) {
        console.error('Error fetching options positions:', optErr);
        // Don't fail the whole request if options fetch fails
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setAccount(null);
      setPositions([]);
      setOptionPositions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch account when enabled changes to true
  useEffect(() => {
    if (isHydrated && isEnabled) {
      refreshAccount();
    }
  }, [isEnabled, isHydrated, refreshAccount]);

  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    if (!enabled) {
      // Clear account data when disabled
      setAccount(null);
      setPositions([]);
      setOptionPositions([]);
      setError(null);
    }
  }, []);

  const toggleEnabled = useCallback(() => {
    setIsEnabled(prev => {
      const newValue = !prev;
      if (!newValue) {
        setAccount(null);
        setPositions([]);
        setOptionPositions([]);
        setError(null);
      }
      return newValue;
    });
  }, []);

  const hasPosition = useCallback((symbol: string) => {
    if (!isEnabled) return false;
    return positions.some(p => p.symbol.toUpperCase() === symbol.toUpperCase());
  }, [isEnabled, positions]);

  const getPosition = useCallback((symbol: string) => {
    if (!isEnabled) return undefined;
    return positions.find(p => p.symbol.toUpperCase() === symbol.toUpperCase());
  }, [isEnabled, positions]);

  const hasOptionPosition = useCallback((contractSymbol: string) => {
    if (!isEnabled) return false;
    return optionPositions.some(p => p.contract.contract_symbol === contractSymbol);
  }, [isEnabled, optionPositions]);

  const getOptionPosition = useCallback((contractSymbol: string) => {
    if (!isEnabled) return undefined;
    return optionPositions.find(p => p.contract.contract_symbol === contractSymbol);
  }, [isEnabled, optionPositions]);

  const getOptionPositionsForUnderlying = useCallback((symbol: string) => {
    if (!isEnabled) return [];
    return optionPositions.filter(p => p.contract.underlying_symbol.toUpperCase() === symbol.toUpperCase());
  }, [isEnabled, optionPositions]);

  return (
    <PaperTradingContext.Provider
      value={{
        isEnabled,
        setEnabled,
        toggleEnabled,
        account,
        positions,
        optionPositions,
        isLoading,
        error,
        refreshAccount,
        hasPosition,
        getPosition,
        hasOptionPosition,
        getOptionPosition,
        getOptionPositionsForUnderlying,
      }}
    >
      {children}
    </PaperTradingContext.Provider>
  );
};

export const usePaperTrading = () => {
  const context = useContext(PaperTradingContext);
  if (context === undefined) {
    throw new Error('usePaperTrading must be used within a PaperTradingProvider');
  }
  return context;
};

export default PaperTradingContext;
