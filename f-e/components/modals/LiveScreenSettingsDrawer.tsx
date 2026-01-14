"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Settings, X, Clock, BarChart3, Gauge, TrendingUp, Activity, Zap } from 'lucide-react';
import { lockScroll, unlockScroll } from './scrollLock';

// Toggle switch component - defined outside to prevent recreation on each render
function ToggleSwitch({ checked, onChange, disabled = false }: { checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange?.(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
        checked ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

interface LiveScreenSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  // Settings state
  autoRefresh?: boolean;
  onAutoRefreshChange?: (value: boolean) => void;
  refreshInterval?: number;
  onRefreshIntervalChange?: (value: number) => void;
  showMACD?: boolean;
  onShowMACDChange?: (value: boolean) => void;
  showRSI?: boolean;
  onShowRSIChange?: (value: boolean) => void;
  showStochastic?: boolean;
  onShowStochasticChange?: (value: boolean) => void;
  showBB?: boolean;
  onShowBBChange?: (value: boolean) => void;
  showVolume?: boolean;
  onShowVolumeChange?: (value: boolean) => void;
  showMovingAverages?: boolean;
  onShowMovingAveragesChange?: (value: boolean) => void;
}

export default function LiveScreenSettingsDrawer({ 
  isOpen, 
  onClose,
  autoRefresh: autoRefreshProp = true,
  onAutoRefreshChange,
  refreshInterval: refreshIntervalProp = 30,
  onRefreshIntervalChange,
  showMACD: showMACDProp = true,
  onShowMACDChange,
  showRSI: showRSIProp = true,
  onShowRSIChange,
  showStochastic: showStochasticProp = true,
  onShowStochasticChange,
  showBB: showBBProp = true,
  onShowBBChange,
  showVolume: showVolumeProp = true,
  onShowVolumeChange,
  showMovingAverages: showMovingAveragesProp = true,
  onShowMovingAveragesChange,
}: LiveScreenSettingsDrawerProps) {
  const [rendered, setRendered] = useState(isOpen);
  const [closing, setClosing] = useState(false);
  const closingHandledRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);

  // Internal state for settings (allows component to work standalone)
  const [autoRefresh, setAutoRefresh] = useState(autoRefreshProp);
  const [refreshInterval, setRefreshInterval] = useState(refreshIntervalProp);
  const [showMACD, setShowMACD] = useState(showMACDProp);
  const [showRSI, setShowRSI] = useState(showRSIProp);
  const [showStochastic, setShowStochastic] = useState(showStochasticProp);
  const [showBB, setShowBB] = useState(showBBProp);
  const [showVolume, setShowVolume] = useState(showVolumeProp);
  const [showMovingAverages, setShowMovingAverages] = useState(showMovingAveragesProp);

  // Sync internal state with props when they change (controlled component support)
  useEffect(() => { setAutoRefresh(autoRefreshProp); }, [autoRefreshProp]);
  useEffect(() => { setRefreshInterval(refreshIntervalProp); }, [refreshIntervalProp]);
  useEffect(() => { setShowMACD(showMACDProp); }, [showMACDProp]);
  useEffect(() => { setShowRSI(showRSIProp); }, [showRSIProp]);
  useEffect(() => { setShowStochastic(showStochasticProp); }, [showStochasticProp]);
  useEffect(() => { setShowBB(showBBProp); }, [showBBProp]);
  useEffect(() => { setShowVolume(showVolumeProp); }, [showVolumeProp]);
  useEffect(() => { setShowMovingAverages(showMovingAveragesProp); }, [showMovingAveragesProp]);

  // Handlers that update internal state and call external callbacks
  const handleAutoRefreshChange = (value: boolean) => {
    setAutoRefresh(value);
    onAutoRefreshChange?.(value);
  };
  const handleRefreshIntervalChange = (value: number) => {
    setRefreshInterval(value);
    onRefreshIntervalChange?.(value);
  };
  const handleShowMACDChange = (value: boolean) => {
    setShowMACD(value);
    onShowMACDChange?.(value);
  };
  const handleShowRSIChange = (value: boolean) => {
    setShowRSI(value);
    onShowRSIChange?.(value);
  };
  const handleShowStochasticChange = (value: boolean) => {
    setShowStochastic(value);
    onShowStochasticChange?.(value);
  };
  const handleShowBBChange = (value: boolean) => {
    setShowBB(value);
    onShowBBChange?.(value);
  };
  const handleShowVolumeChange = (value: boolean) => {
    setShowVolume(value);
    onShowVolumeChange?.(value);
  };
  const handleShowMovingAveragesChange = (value: boolean) => {
    setShowMovingAverages(value);
    onShowMovingAveragesChange?.(value);
  };

  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      closingHandledRef.current = false;
    }
    if (!isOpen && rendered) {
      setClosing(true);
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      closeTimerRef.current = window.setTimeout(() => {
        if (closingHandledRef.current) return;
        closingHandledRef.current = true;
        setClosing(false);
        setRendered(false);
        setTimeout(() => { closingHandledRef.current = false; }, 50);
      }, 320);
    }
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [isOpen, rendered]);

  // Lock scroll and handle escape key
  useEffect(() => {
    if (!rendered) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    lockScroll();
    return () => {
      document.removeEventListener('keydown', onEsc);
      unlockScroll();
    };
  }, [rendered, onClose]);

  if (!rendered) return null;

  const indicators = [
    { key: 'macd', label: 'MACD', icon: BarChart3, color: 'text-purple-500', checked: showMACD, onChange: handleShowMACDChange },
    { key: 'rsi', label: 'RSI', icon: Gauge, color: 'text-blue-500', checked: showRSI, onChange: handleShowRSIChange },
    { key: 'stoch', label: 'Stochastic', icon: TrendingUp, color: 'text-green-500', checked: showStochastic, onChange: handleShowStochasticChange },
    { key: 'bb', label: 'Bollinger Bands', icon: Activity, color: 'text-cyan-500', checked: showBB, onChange: handleShowBBChange },
    { key: 'ma', label: 'Moving Averages', icon: TrendingUp, color: 'text-emerald-500', checked: showMovingAverages, onChange: handleShowMovingAveragesChange },
    { key: 'vol', label: 'Volume', icon: BarChart3, color: 'text-orange-500', checked: showVolume, onChange: handleShowVolumeChange },
  ];

  const refreshOptions = [15, 30, 60, 120];

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-[100] bg-black/40 dark:bg-black/60 transition-opacity duration-300 ${closing ? 'opacity-0' : 'opacity-100'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Live Screen Settings"
        className={`fixed bottom-0 left-0 right-0 z-[101] bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[80vh] overflow-hidden ${closing ? 'animate-drawerSlideDown' : 'animate-drawerSlideUp'}`}
        onAnimationEnd={(e) => {
          if (e.currentTarget !== e.target) return;
          if (!closing) return;
          if (closingHandledRef.current) return;
          closingHandledRef.current = true;
          if (closeTimerRef.current) {
            window.clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
          }
          setClosing(false);
          setRendered(false);
          setTimeout(() => { closingHandledRef.current = false; }, 50);
        }}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Live Screen Settings</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Customize your analysis view</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-6 overflow-y-auto max-h-[calc(80vh-180px)]">
          
          {/* Auto Refresh Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 px-1">
              Data Refresh
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Auto Refresh</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Automatically update data</p>
                  </div>
                </div>
                <ToggleSwitch checked={autoRefresh} onChange={handleAutoRefreshChange} />
              </div>

              {autoRefresh && (
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Refresh Interval</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">How often to update</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {refreshOptions.map((seconds) => (
                      <button
                        key={seconds}
                        onClick={() => handleRefreshIntervalChange(seconds)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          refreshInterval === seconds
                            ? 'bg-purple-500 text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        {seconds}s
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Indicators Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 px-1">
              Visible Indicators
            </h3>
            <div className="space-y-2">
              {indicators.map((indicator) => {
                const Icon = indicator.icon;
                return (
                  <div 
                    key={indicator.key}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        indicator.checked 
                          ? 'bg-opacity-20 dark:bg-opacity-30' 
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`} style={{ backgroundColor: indicator.checked ? `${indicator.color.replace('text-', '')}20` : undefined }}>
                        <Icon className={`w-5 h-5 ${indicator.checked ? indicator.color : 'text-gray-400'}`} />
                      </div>
                      <span className={`font-medium ${indicator.checked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                        {indicator.label}
                      </span>
                    </div>
                    <ToggleSwitch checked={indicator.checked} onChange={indicator.onChange} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
            <p className="text-sm text-purple-700 dark:text-purple-300">
              <span className="font-medium">Tip:</span> Disable indicators you don&apos;t use to improve performance and reduce visual clutter.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pt-4 pb-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 safe-area-bottom">
          <button
            onClick={onClose}
            className="block w-full text-center py-3 px-4 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600 transition-all shadow-md"
          >
            Done
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes drawerSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-drawerSlideUp {
          animation: drawerSlideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards;
        }
        @keyframes drawerSlideDown {
          from { transform: translateY(0); }
          to { transform: translateY(100%); }
        }
        .animate-drawerSlideDown {
          animation: drawerSlideDown 0.25s cubic-bezier(0.32, 0.72, 0, 1) forwards;
        }
        .safe-area-bottom {
          padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </>
  );
}
