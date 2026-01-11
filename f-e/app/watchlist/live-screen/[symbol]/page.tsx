"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Activity, TrendingUp, TrendingDown, BarChart3, Gauge, Settings } from 'lucide-react';

export default function LiveScreenDetailPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = params.symbol as string;
  
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '1d'>('5m');

  // TODO: Fetch real indicator data from API
  // TODO: Add real-time updates via WebSocket or polling

  // Placeholder MACD history
  const macdHistory = Array.from({ length: 30 }, () => (Math.random() - 0.5) * 0.3);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" />
              <h1 className="text-lg font-semibold">{decodeURIComponent(symbol)}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
              className="text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 outline-none"
            >
              <option value="1m">1 Minute</option>
              <option value="5m">5 Minutes</option>
              <option value="15m">15 Minutes</option>
              <option value="1h">1 Hour</option>
              <option value="1d">1 Day</option>
            </select>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              <Settings className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-28 space-y-6 max-w-2xl mx-auto">
        
        {/* Live Status Banner */}
        <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-sm text-purple-700 dark:text-purple-300">Live • Updates every {selectedTimeframe}</span>
        </div>

        {/* MACD Section */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              <h2 className="font-semibold">MACD (12, 26, 9)</h2>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              Coming Soon
            </span>
          </div>
          
          {/* MACD Histogram */}
          <div className="h-32 bg-white dark:bg-gray-900 rounded-xl p-3 flex items-end justify-between gap-0.5">
            {macdHistory.map((value, index) => (
              <div
                key={index}
                className={`flex-1 rounded-t-sm transition-all ${value >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ 
                  height: `${Math.abs(value) * 100}%`, 
                  opacity: 0.4 + (index / macdHistory.length) * 0.6 
                }}
              />
            ))}
          </div>
          
          {/* MACD Values */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">MACD Line</p>
              <p className="text-lg font-semibold">--</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Signal Line</p>
              <p className="text-lg font-semibold">--</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Histogram</p>
              <p className="text-lg font-semibold">--</p>
            </div>
          </div>
        </div>

        {/* RSI Section */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold">RSI (14)</h2>
            </div>
            <span className="text-2xl font-bold">--</span>
          </div>
          
          {/* RSI Gauge */}
          <div className="relative h-4 bg-gradient-to-r from-green-500 via-gray-300 to-red-500 rounded-full overflow-hidden">
            <div className="absolute inset-y-0 left-[30%] w-px bg-white/50" />
            <div className="absolute inset-y-0 left-[70%] w-px bg-white/50" />
            {/* Placeholder indicator at 50% */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-gray-400"
              style={{ left: '50%', transform: 'translate(-50%, -50%)' }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>0 - Oversold</span>
            <span>50 - Neutral</span>
            <span>100 - Overbought</span>
          </div>
        </div>

        {/* Moving Averages Section */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h2 className="font-semibold">Moving Averages</h2>
          </div>
          
          <div className="space-y-3">
            {[
              { label: 'SMA 20', value: '--', status: 'neutral' },
              { label: 'SMA 50', value: '--', status: 'neutral' },
              { label: 'SMA 200', value: '--', status: 'neutral' },
              { label: 'EMA 12', value: '--', status: 'neutral' },
              { label: 'EMA 26', value: '--', status: 'neutral' },
            ].map((ma) => (
              <div key={ma.label} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                <span className="text-sm text-gray-600 dark:text-gray-400">{ma.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{ma.value}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500">
                    {ma.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Volume Section */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-yellow-500" />
              <h2 className="font-semibold">Volume Analysis</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Current Volume</p>
              <p className="text-lg font-semibold">--</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg Volume (20)</p>
              <p className="text-lg font-semibold">--</p>
            </div>
          </div>
          
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-yellow-500 rounded-full" />
          </div>
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">Volume vs Average: --</p>
        </div>

        {/* Bollinger Bands Section */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-500" />
              <h2 className="font-semibold">Bollinger Bands (20, 2)</h2>
            </div>
          </div>
          
          <div className="relative h-20 bg-white dark:bg-gray-900 rounded-xl p-3">
            {/* Upper band */}
            <div className="absolute top-3 left-3 right-3 h-0.5 bg-red-400/50 rounded" />
            {/* Middle band */}
            <div className="absolute top-1/2 left-3 right-3 h-0.5 bg-gray-400 rounded -translate-y-1/2" />
            {/* Lower band */}
            <div className="absolute bottom-3 left-3 right-3 h-0.5 bg-green-400/50 rounded" />
            {/* Price indicator */}
            <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-white border-2 border-purple-500 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg" />
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Upper</p>
              <p className="font-medium text-red-500">--</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Middle</p>
              <p className="font-medium">--</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Lower</p>
              <p className="font-medium text-green-500">--</p>
            </div>
          </div>
        </div>

        {/* Overall Signal */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Overall Technical Signal</p>
              <p className="text-2xl font-bold text-gray-400">--</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Confidence</p>
              <p className="text-lg font-semibold text-gray-400">--%</p>
            </div>
          </div>
        </div>

      </div>

      {/* Fixed floating close button */}
      <button
        onClick={() => router.push('/watchlist')}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-md py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-2 border-purple-200 dark:border-purple-700 font-semibold rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all flex items-center justify-center gap-2 shadow-lg"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Watchlist
      </button>
    </div>
  );
}
