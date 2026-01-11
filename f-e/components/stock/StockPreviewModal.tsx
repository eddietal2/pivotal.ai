"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';

interface StockPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  name: string;
  price: number | string;
  change: number;
  valueChange: number;
  sparkline: number[];
  timeframe: string;
}

export default function StockPreviewModal({
  isOpen,
  onClose,
  symbol,
  name,
  price,
  change,
  valueChange,
  sparkline,
  timeframe,
}: StockPreviewModalProps) {
  const router = useRouter();
  const [isClosing, setIsClosing] = React.useState(false);

  // Handle close with animation
  const handleClose = React.useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 280); // Match animation duration
  }, [onClose]);

  // Prevent scroll on body when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const handleOpenFullView = () => {
    handleClose();
    // Navigate after animation completes
    setTimeout(() => {
      router.push(`/stock/${encodeURIComponent(symbol)}`);
    }, 280);
  };

  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  const isPositive = change >= 0;

  // Render sparkline chart
  const renderSparkline = () => {
    if (!sparkline || sparkline.length < 2) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          No chart data available
        </div>
      );
    }

    const min = Math.min(...sparkline);
    const max = Math.max(...sparkline);
    const range = max - min || 1;

    const points = sparkline
      .map((val, i) => {
        const x = (i / (sparkline.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 100;
        return `${x},${y}`;
      })
      .join(' ');

    // Create gradient fill
    const fillPoints = `0,100 ${points} 100,100`;

    return (
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="modalChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity="0.3" />
            <stop offset="100%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon fill="url(#modalChartGradient)" points={fillPoints} />
        <polyline
          fill="none"
          stroke={isPositive ? '#22c55e' : '#ef4444'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] transition-opacity ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet Modal */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-[101] bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-preview-title"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{symbol}</p>
            <h2 id="stock-preview-title" className="text-xl font-bold text-gray-900 dark:text-white">{name}</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close preview"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[50vh]">
          {/* Price */}
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              ${!isNaN(numericPrice) ? numericPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : price}
            </span>
            <div className={`flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="font-semibold">
                {isPositive ? '+' : ''}{valueChange?.toFixed(2) || '0.00'} ({isPositive ? '+' : ''}{change?.toFixed(2) || '0.00'}%)
              </span>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-gray-100 dark:bg-gray-700/50 rounded-xl p-4 h-44">
            {renderSparkline()}
          </div>

          {/* Timeframe indicator */}
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {timeframe} timeframe
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          <button
            onClick={handleOpenFullView}
            className="w-full py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-5 h-5" />
            Open Full View
          </button>
          <button
            onClick={handleClose}
            className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        @keyframes slide-down {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(100%);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fade-out {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
        .animate-slide-down {
          animation: slide-down 0.28s ease-in forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        .animate-fade-out {
          animation: fade-out 0.25s ease-in forwards;
        }
      `}</style>
    </>
  );
}
