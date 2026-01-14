"use client";

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Activity } from 'lucide-react';

export interface IndicatorData {
  symbol: string;
  timeframe: string;
  timestamps: string[];
  dataPoints: number;
  macd?: {
    macd: number[];
    signal: number[];
    histogram: number[];
    current: { macd: number; signal: number; histogram: number };
  };
  rsi?: {
    rsi: number[];
    overbought: number;
    oversold: number;
    current: number;
  };
  stochastic?: {
    k: number[];
    d: number[];
    overbought: number;
    oversold: number;
    current: { k: number; d: number };
  };
  bollingerBands?: {
    upper: (number | null)[];
    middle: (number | null)[];
    lower: (number | null)[];
    percentB: number[];
    current: { upper: number | null; middle: number | null; lower: number | null; percentB: number; price: number | null };
  };
}

interface AnimatedIndicatorChartProps {
  data: IndicatorData | null;
  indicator: 'MACD' | 'RSI' | 'STOCH' | 'BB';
  height?: number;
  width?: number;
  animated?: boolean;
  animationDuration?: number;
  showLabels?: boolean;
  compact?: boolean;
  isLoading?: boolean;
  className?: string;
}

export default function AnimatedIndicatorChart({
  data,
  indicator,
  height = 120,
  width = 300,
  animated = true,
  animationDuration = 1500,
  showLabels = true,
  compact = false,
  isLoading = false,
  className = '',
}: AnimatedIndicatorChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const animationRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });

  // Responsive sizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        setDimensions({
          width: containerWidth > 0 ? containerWidth : width,
          height,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [width, height]);

  // Animation loop
  const animate = useCallback(() => {
    if (!animated) {
      setProgress(1);
      return;
    }

    const startTime = performance.now();
    
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const newProgress = Math.min(elapsed / animationDuration, 1);
      
      // Easing function for smooth animation
      const eased = 1 - Math.pow(1 - newProgress, 3);
      setProgress(eased);
      
      if (newProgress < 1) {
        animationRef.current = requestAnimationFrame(step);
      }
    };

    animationRef.current = requestAnimationFrame(step);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animated, animationDuration]);

  // Start animation when data loads
  useEffect(() => {
    if (data && !isLoading) {
      setProgress(0);
      const cleanup = animate();
      return cleanup;
    }
  }, [data, isLoading, animate]);

  // Draw on canvas
  useEffect(() => {
    if (!canvasRef.current || !data || isLoading) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width: w, height: h } = dimensions;

    // Set up high DPI canvas
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    const padding = compact ? 8 : 15;
    const chartWidth = w - padding * 2;
    const chartHeight = h - padding * 2;

    // Draw based on indicator type
    if (indicator === 'MACD' && data.macd) {
      drawMACD(ctx, data.macd, chartWidth, chartHeight, padding, progress);
    } else if (indicator === 'RSI' && data.rsi) {
      drawRSI(ctx, data.rsi, chartWidth, chartHeight, padding, progress);
    } else if (indicator === 'STOCH' && data.stochastic) {
      drawStochastic(ctx, data.stochastic, chartWidth, chartHeight, padding, progress);
    } else if (indicator === 'BB' && data.bollingerBands) {
      drawBollingerBands(ctx, data.bollingerBands, chartWidth, chartHeight, padding, progress);
    }
  }, [data, progress, dimensions, indicator, compact, isLoading]);

  // Drawing functions
  const drawMACD = (
    ctx: CanvasRenderingContext2D,
    macdData: NonNullable<IndicatorData['macd']>,
    chartWidth: number,
    chartHeight: number,
    padding: number,
    progress: number
  ) => {
    const { macd, signal, histogram } = macdData;
    
    const visiblePoints = Math.floor(macd.length * progress);
    if (visiblePoints < 2) return;

    const allValues = [...macd.slice(0, visiblePoints), ...signal.slice(0, visiblePoints), ...histogram.slice(0, visiblePoints)];
    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);
    const range = maxVal - minVal || 1;

    const getX = (i: number) => padding + (i / (macd.length - 1)) * chartWidth;
    const getY = (val: number) => padding + chartHeight - ((val - minVal) / range) * chartHeight;

    // Draw zero line
    const zeroY = getY(0);
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding, zeroY);
    ctx.lineTo(padding + chartWidth * progress, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw histogram bars
    const barWidth = Math.max(2, chartWidth / macd.length - 1);
    for (let i = 0; i < visiblePoints; i++) {
      const x = getX(i) - barWidth / 2;
      const val = histogram[i];
      const y = getY(val);
      const barHeight = Math.abs(y - zeroY);
      
      ctx.fillStyle = val >= 0 
        ? 'rgba(34, 197, 94, 0.6)'  // Green
        : 'rgba(239, 68, 68, 0.6)'; // Red
      
      if (val >= 0) {
        ctx.fillRect(x, y, barWidth, barHeight);
      } else {
        ctx.fillRect(x, zeroY, barWidth, barHeight);
      }
    }

    // Draw MACD line
    ctx.strokeStyle = '#3b82f6'; // Blue
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < visiblePoints; i++) {
      const x = getX(i);
      const y = getY(macd[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw Signal line
    ctx.strokeStyle = '#f59e0b'; // Orange
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < visiblePoints; i++) {
      const x = getX(i);
      const y = getY(signal[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw endpoint dots
    if (visiblePoints > 0) {
      const lastIdx = visiblePoints - 1;
      const lastX = getX(lastIdx);
      
      // MACD dot
      ctx.beginPath();
      ctx.arc(lastX, getY(macd[lastIdx]), 4, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
      
      // Signal dot
      ctx.beginPath();
      ctx.arc(lastX, getY(signal[lastIdx]), 4, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
    }
  };

  const drawRSI = (
    ctx: CanvasRenderingContext2D,
    rsiData: NonNullable<IndicatorData['rsi']>,
    chartWidth: number,
    chartHeight: number,
    padding: number,
    progress: number
  ) => {
    const { rsi, overbought, oversold } = rsiData;
    
    const visiblePoints = Math.floor(rsi.length * progress);
    if (visiblePoints < 2) return;

    const getX = (i: number) => padding + (i / (rsi.length - 1)) * chartWidth;
    const getY = (val: number) => padding + chartHeight - (val / 100) * chartHeight;

    // Draw overbought zone
    ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
    ctx.fillRect(padding, padding, chartWidth * progress, getY(overbought) - padding);
    
    // Draw oversold zone
    ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
    const oversoldY = getY(oversold);
    ctx.fillRect(padding, oversoldY, chartWidth * progress, chartHeight + padding - oversoldY);

    // Draw threshold lines
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding, getY(overbought));
    ctx.lineTo(padding + chartWidth * progress, getY(overbought));
    ctx.stroke();

    ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
    ctx.beginPath();
    ctx.moveTo(padding, getY(oversold));
    ctx.lineTo(padding + chartWidth * progress, getY(oversold));
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw 50 line
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.3)';
    ctx.beginPath();
    ctx.moveTo(padding, getY(50));
    ctx.lineTo(padding + chartWidth * progress, getY(50));
    ctx.stroke();

    // Draw RSI line with gradient based on value
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < visiblePoints; i++) {
      const x = getX(i);
      const y = getY(rsi[i]);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    // Color based on current RSI value
    const currentRSI = rsi[visiblePoints - 1];
    if (currentRSI >= overbought) {
      ctx.strokeStyle = '#ef4444'; // Red - overbought
    } else if (currentRSI <= oversold) {
      ctx.strokeStyle = '#22c55e'; // Green - oversold
    } else {
      ctx.strokeStyle = '#8b5cf6'; // Purple - neutral
    }
    ctx.stroke();

    // Draw current value dot
    if (visiblePoints > 0) {
      const lastX = getX(visiblePoints - 1);
      const lastY = getY(rsi[visiblePoints - 1]);
      ctx.beginPath();
      ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
      
      // Glow effect
      ctx.beginPath();
      ctx.arc(lastX, lastY, 8, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle.replace(')', ', 0.3)').replace('rgb', 'rgba');
      ctx.fill();
    }
  };

  const drawStochastic = (
    ctx: CanvasRenderingContext2D,
    stochData: NonNullable<IndicatorData['stochastic']>,
    chartWidth: number,
    chartHeight: number,
    padding: number,
    progress: number
  ) => {
    const { k, d, overbought, oversold } = stochData;
    
    const visiblePoints = Math.floor(k.length * progress);
    if (visiblePoints < 2) return;

    const getX = (i: number) => padding + (i / (k.length - 1)) * chartWidth;
    const getY = (val: number) => padding + chartHeight - (val / 100) * chartHeight;

    // Draw overbought/oversold zones
    ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
    ctx.fillRect(padding, padding, chartWidth * progress, getY(overbought) - padding);
    
    ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
    const oversoldY = getY(oversold);
    ctx.fillRect(padding, oversoldY, chartWidth * progress, chartHeight + padding - oversoldY);

    // Draw threshold lines
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding, getY(overbought));
    ctx.lineTo(padding + chartWidth * progress, getY(overbought));
    ctx.stroke();

    ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
    ctx.beginPath();
    ctx.moveTo(padding, getY(oversold));
    ctx.lineTo(padding + chartWidth * progress, getY(oversold));
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw %K line (fast)
    ctx.strokeStyle = '#3b82f6'; // Blue
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < visiblePoints; i++) {
      const x = getX(i);
      const y = getY(k[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw %D line (slow)
    ctx.strokeStyle = '#f59e0b'; // Orange
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < visiblePoints; i++) {
      const x = getX(i);
      const y = getY(d[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw endpoint dots
    if (visiblePoints > 0) {
      const lastIdx = visiblePoints - 1;
      const lastX = getX(lastIdx);
      
      ctx.beginPath();
      ctx.arc(lastX, getY(k[lastIdx]), 4, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(lastX, getY(d[lastIdx]), 4, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
    }
  };

  const drawBollingerBands = (
    ctx: CanvasRenderingContext2D,
    bbData: NonNullable<IndicatorData['bollingerBands']>,
    chartWidth: number,
    chartHeight: number,
    padding: number,
    progress: number
  ) => {
    const { upper, middle, lower, percentB } = bbData;
    
    // Filter out nulls for calculation
    const validUpper = upper.filter((v): v is number => v !== null);
    const validLower = lower.filter((v): v is number => v !== null);
    
    if (validUpper.length < 2) return;

    const visiblePoints = Math.floor(upper.length * progress);
    if (visiblePoints < 2) return;

    // Use percentB for visualization (0-100 scale)
    const getX = (i: number) => padding + (i / (percentB.length - 1)) * chartWidth;
    const getY = (val: number) => padding + chartHeight - (val / 100) * chartHeight;

    // Draw band fill area
    ctx.fillStyle = 'rgba(147, 51, 234, 0.1)';
    ctx.beginPath();
    
    // Top edge
    for (let i = 0; i < visiblePoints; i++) {
      const x = getX(i);
      const y = getY(100); // Upper band at 100%
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    
    // Bottom edge (reverse)
    for (let i = visiblePoints - 1; i >= 0; i--) {
      const x = getX(i);
      const y = getY(0); // Lower band at 0%
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Draw bands
    ctx.setLineDash([4, 4]);
    
    // Upper band
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < visiblePoints; i++) {
      const x = getX(i);
      if (i === 0) ctx.moveTo(x, getY(100));
      else ctx.lineTo(x, getY(100));
    }
    ctx.stroke();

    // Lower band
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
    ctx.beginPath();
    for (let i = 0; i < visiblePoints; i++) {
      const x = getX(i);
      if (i === 0) ctx.moveTo(x, getY(0));
      else ctx.lineTo(x, getY(0));
    }
    ctx.stroke();

    ctx.setLineDash([]);

    // Draw middle band
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < visiblePoints; i++) {
      const x = getX(i);
      if (i === 0) ctx.moveTo(x, getY(50));
      else ctx.lineTo(x, getY(50));
    }
    ctx.stroke();

    // Draw %B line (price position within bands)
    ctx.strokeStyle = '#8b5cf6'; // Purple
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < visiblePoints; i++) {
      const x = getX(i);
      const y = getY(percentB[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw current position dot
    if (visiblePoints > 0) {
      const lastIdx = visiblePoints - 1;
      const lastX = getX(lastIdx);
      const lastY = getY(percentB[lastIdx]);
      
      ctx.beginPath();
      ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#8b5cf6';
      ctx.fill();
      
      // Glow
      ctx.beginPath();
      ctx.arc(lastX, lastY, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.fill();
    }
  };

  // Get current indicator value for display
  const getCurrentValue = () => {
    if (!data) return null;
    
    if (indicator === 'MACD' && data.macd) {
      return {
        primary: data.macd.current.macd.toFixed(3),
        secondary: data.macd.current.histogram.toFixed(3),
        trend: data.macd.current.histogram >= 0 ? 'up' : 'down',
      };
    }
    if (indicator === 'RSI' && data.rsi) {
      const val = data.rsi.current;
      return {
        primary: val.toFixed(1),
        trend: val >= 70 ? 'overbought' : val <= 30 ? 'oversold' : 'neutral',
      };
    }
    if (indicator === 'STOCH' && data.stochastic) {
      const val = data.stochastic.current.k;
      return {
        primary: val.toFixed(1),
        secondary: data.stochastic.current.d.toFixed(1),
        trend: val >= 80 ? 'overbought' : val <= 20 ? 'oversold' : 'neutral',
      };
    }
    if (indicator === 'BB' && data.bollingerBands) {
      const val = data.bollingerBands.current.percentB;
      return {
        primary: val.toFixed(1) + '%',
        trend: val >= 80 ? 'overbought' : val <= 20 ? 'oversold' : 'neutral',
      };
    }
    return null;
  };

  const currentValue = getCurrentValue();

  if (isLoading) {
    return (
      <div 
        ref={containerRef}
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800/50 rounded-xl animate-pulse ${className}`}
        style={{ height }}
      >
        <Activity className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div 
        ref={containerRef}
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800/50 rounded-xl ${className}`}
        style={{ height }}
      >
        <span className="text-xs text-gray-400">No data</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ height }}>
      {/* Labels */}
      {showLabels && !compact && currentValue && (
        <div className="absolute top-2 right-3 z-10 flex items-center gap-2">
          <span className={`text-sm font-bold ${
            currentValue.trend === 'up' || currentValue.trend === 'oversold' 
              ? 'text-green-500' 
              : currentValue.trend === 'down' || currentValue.trend === 'overbought'
                ? 'text-red-500'
                : 'text-gray-500 dark:text-gray-400'
          }`}>
            {currentValue.primary}
          </span>
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height }}
        className="rounded-xl bg-white dark:bg-gray-900"
      />

      {/* Legend for MACD */}
      {showLabels && !compact && indicator === 'MACD' && (
        <div className="absolute bottom-2 left-3 flex items-center gap-4 text-[10px]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-500 rounded" />
            <span className="text-gray-500 dark:text-gray-400">MACD</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-orange-500 rounded" />
            <span className="text-gray-500 dark:text-gray-400">Signal</span>
          </span>
        </div>
      )}

      {/* Legend for Stochastic */}
      {showLabels && !compact && indicator === 'STOCH' && (
        <div className="absolute bottom-2 left-3 flex items-center gap-4 text-[10px]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-500 rounded" />
            <span className="text-gray-500 dark:text-gray-400">%K</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-orange-500 rounded" />
            <span className="text-gray-500 dark:text-gray-400">%D</span>
          </span>
        </div>
      )}

      {/* Legend for Bollinger Bands */}
      {showLabels && !compact && indicator === 'BB' && (
        <div className="absolute bottom-2 left-3 flex items-center gap-4 text-[10px]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-purple-500 rounded" />
            <span className="text-gray-500 dark:text-gray-400">%B Position</span>
          </span>
        </div>
      )}
    </div>
  );
}
