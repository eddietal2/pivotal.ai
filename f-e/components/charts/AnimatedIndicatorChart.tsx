"use client";

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Activity } from 'lucide-react';

// Trend Pulse Animation Component - Shows actual indicator pattern scrolling
function TrendPulse({ 
  trend, 
  indicator,
  dataPoints,
  width = 100,
  height = 24 
}: { 
  trend: 'up' | 'down' | 'neutral' | 'overbought' | 'oversold';
  indicator: 'MACD' | 'RSI' | 'STOCH' | 'BB' | 'VOL';
  dataPoints: number[];
  width?: number;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const offsetRef = useRef(0);

  const getColor = () => {
    if (trend === 'up' || trend === 'oversold') return { main: '#22c55e', glow: 'rgba(34, 197, 94, 0.3)' };
    if (trend === 'down' || trend === 'overbought') return { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)' };
    return { main: '#6b7280', glow: 'rgba(107, 114, 128, 0.3)' };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dataPoints || dataPoints.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const colors = getColor();
    const padding = 2;
    const chartHeight = height - padding * 2;
    
    // Normalize data points
    const minVal = Math.min(...dataPoints);
    const maxVal = Math.max(...dataPoints);
    const range = maxVal - minVal || 1;
    
    const normalizedPoints = dataPoints.map(v => 
      padding + chartHeight - ((v - minVal) / range) * chartHeight
    );

    // We'll show a window of points that scrolls through the data
    const pointsToShow = Math.min(30, normalizedPoints.length);
    const scrollSpeed = 0.5; // pixels per frame

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Calculate which points are visible based on offset
      const totalDataWidth = normalizedPoints.length * 3; // 3px per point
      const currentOffset = offsetRef.current % totalDataWidth;
      
      // Draw the scrolling line
      ctx.beginPath();
      ctx.strokeStyle = colors.main;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const pointSpacing = width / (pointsToShow - 1);
      let lastY = 0;
      
      for (let i = 0; i < pointsToShow; i++) {
        // Calculate which data point to show (wrapping around)
        const dataOffset = Math.floor(offsetRef.current / 2);
        const dataIndex = (dataOffset + i) % normalizedPoints.length;
        const y = normalizedPoints[dataIndex];
        const x = i * pointSpacing;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        if (i === pointsToShow - 1) {
          lastY = y;
        }
      }
      
      ctx.stroke();

      // Draw glowing dot at the end (right side)
      const pulseSize = 4 + Math.sin(offsetRef.current * 0.1) * 1.5;
      
      ctx.beginPath();
      ctx.arc(width - 2, lastY, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = colors.glow;
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(width - 2, lastY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = colors.main;
      ctx.fill();

      // Draw trailing fade effect on left side
      const isDark = document.documentElement.classList.contains('dark');
      const fadeGradient = ctx.createLinearGradient(0, 0, width * 0.2, 0);
      if (isDark) {
        fadeGradient.addColorStop(0, 'rgba(17,24,39,1)');
        fadeGradient.addColorStop(1, 'rgba(17,24,39,0)');
      } else {
        fadeGradient.addColorStop(0, 'rgba(255,255,255,1)');
        fadeGradient.addColorStop(1, 'rgba(255,255,255,0)');
      }
      ctx.fillStyle = fadeGradient;
      ctx.fillRect(0, 0, width * 0.15, height);

      offsetRef.current += scrollSpeed;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dataPoints, trend, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="rounded"
    />
  );
}

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
  volume?: {
    volumes: number[];
    avgVolume: number;
    current: { volume: number; avgVolume: number; ratio: number };
    trend: string;
  };
}

interface AnimatedIndicatorChartProps {
  data: IndicatorData | null;
  indicator: 'MACD' | 'RSI' | 'STOCH' | 'BB' | 'VOL';
  height?: number;
  width?: number;
  animated?: boolean;
  animationDuration?: number;
  showLabels?: boolean;
  compact?: boolean;
  isLoading?: boolean;
  className?: string;
  interactive?: boolean;
  onScrubChange?: (value: { index: number; values: Record<string, number> } | null) => void;
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
  interactive = false,
  onScrubChange,
}: AnimatedIndicatorChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const animationRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Get data array length for scrubbing calculations
  const getDataLength = useCallback(() => {
    if (!data) return 0;
    if (indicator === 'MACD' && data.macd) return data.macd.macd.length;
    if (indicator === 'RSI' && data.rsi) return data.rsi.rsi.length;
    if (indicator === 'STOCH' && data.stochastic) return data.stochastic.k.length;
    if (indicator === 'BB' && data.bollingerBands) return data.bollingerBands.percentB.length;
    if (indicator === 'VOL' && data.volume?.volumes) return data.volume.volumes.length;
    return 0;
  }, [data, indicator]);

  // Get values at scrub index
  const getScrubValues = useCallback((index: number): Record<string, number> | null => {
    if (!data || index < 0) return null;
    
    if (indicator === 'MACD' && data.macd) {
      const { macd, signal, histogram } = data.macd;
      if (index >= macd.length) return null;
      return { macd: macd[index], signal: signal[index], histogram: histogram[index] };
    }
    if (indicator === 'RSI' && data.rsi) {
      if (index >= data.rsi.rsi.length) return null;
      return { rsi: data.rsi.rsi[index] };
    }
    if (indicator === 'STOCH' && data.stochastic) {
      const { k, d } = data.stochastic;
      if (index >= k.length) return null;
      return { k: k[index], d: d[index] };
    }
    if (indicator === 'BB' && data.bollingerBands) {
      const { upper, middle, lower, percentB } = data.bollingerBands;
      if (index >= percentB.length) return null;
      return { 
        upper: upper[index] ?? 0, 
        middle: middle[index] ?? 0, 
        lower: lower[index] ?? 0, 
        percentB: percentB[index] 
      };
    }
    if (indicator === 'VOL' && data.volume?.volumes) {
      const { volumes, avgVolume } = data.volume;
      if (index >= volumes.length) return null;
      return { volume: volumes[index], avgVolume, ratio: volumes[index] / avgVolume };
    }
    return null;
  }, [data, indicator]);

  // Handle scrubbing
  const handleScrub = useCallback((clientX: number) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const dataLength = getDataLength();
    if (dataLength === 0) return;
    const index = Math.round(percent * (dataLength - 1));
    setScrubIndex(index);
    
    if (onScrubChange) {
      const values = getScrubValues(index);
      onScrubChange(values ? { index, values } : null);
    }
  }, [interactive, getDataLength, getScrubValues, onScrubChange]);

  const handleScrubStart = useCallback((e: React.PointerEvent) => {
    if (!interactive) return;
    setIsScrubbing(true);
    handleScrub(e.clientX);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [interactive, handleScrub]);

  const handleScrubMove = useCallback((e: React.PointerEvent) => {
    if (!isScrubbing) return;
    handleScrub(e.clientX);
  }, [isScrubbing, handleScrub]);

  const handleScrubEnd = useCallback(() => {
    setIsScrubbing(false);
    setScrubIndex(null);
    if (onScrubChange) {
      onScrubChange(null);
    }
  }, [onScrubChange]);

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
    } else if (indicator === 'VOL' && data.volume?.volumes?.length) {
      drawVolume(ctx, data.volume, chartWidth, chartHeight, padding, progress);
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

  // Draw Volume chart
  const drawVolume = (
    ctx: CanvasRenderingContext2D,
    volumeData: NonNullable<IndicatorData['volume']>,
    chartWidth: number,
    chartHeight: number,
    padding: number,
    progress: number
  ) => {
    const { volumes, avgVolume } = volumeData;
    
    const visiblePoints = Math.floor(volumes.length * progress);
    if (visiblePoints < 2) return;

    const maxVol = Math.max(...volumes.slice(0, visiblePoints));
    const minVol = 0;
    const range = maxVol - minVol || 1;

    const getX = (i: number) => padding + (i / (volumes.length - 1)) * chartWidth;
    const getY = (val: number) => padding + chartHeight - ((val - minVol) / range) * chartHeight;

    // Draw average volume line
    const avgY = getY(avgVolume);
    ctx.strokeStyle = '#f59e0b'; // Orange
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(padding, avgY);
    ctx.lineTo(padding + chartWidth * progress, avgY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw volume bars
    const barWidth = Math.max(3, chartWidth / volumes.length - 2);
    for (let i = 0; i < visiblePoints; i++) {
      const x = getX(i) - barWidth / 2;
      const vol = volumes[i];
      const y = getY(vol);
      const barHeight = chartHeight - (y - padding);
      
      // Color based on volume relative to average
      const ratio = vol / avgVolume;
      let color: string;
      if (ratio >= 2) {
        color = 'rgba(34, 197, 94, 0.7)'; // High volume - green
      } else if (ratio >= 1.5) {
        color = 'rgba(34, 197, 94, 0.5)'; // Above average - lighter green
      } else if (ratio < 0.5) {
        color = 'rgba(239, 68, 68, 0.5)'; // Low volume - red
      } else {
        color = 'rgba(107, 114, 128, 0.5)'; // Normal - gray
      }
      
      ctx.fillStyle = color;
      ctx.fillRect(x, y, barWidth, barHeight);
    }

    // Highlight current volume bar
    if (visiblePoints > 0) {
      const lastIdx = visiblePoints - 1;
      const lastX = getX(lastIdx) - barWidth / 2;
      const lastVol = volumes[lastIdx];
      const lastY = getY(lastVol);
      const lastBarHeight = chartHeight - (lastY - padding);
      const ratio = lastVol / avgVolume;
      
      // Draw highlight border on current bar
      ctx.strokeStyle = ratio >= 1.5 ? '#22c55e' : ratio < 0.5 ? '#ef4444' : '#f97316';
      ctx.lineWidth = 2;
      ctx.strokeRect(lastX, lastY, barWidth, lastBarHeight);
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
        dataPoints: data.macd.macd, // Use MACD line for the pulse
      };
    }
    if (indicator === 'RSI' && data.rsi) {
      const val = data.rsi.current;
      return {
        primary: val.toFixed(1),
        trend: val >= 70 ? 'overbought' : val <= 30 ? 'oversold' : 'neutral',
        dataPoints: data.rsi.rsi,
      };
    }
    if (indicator === 'STOCH' && data.stochastic) {
      const val = data.stochastic.current.k;
      return {
        primary: val.toFixed(1),
        secondary: data.stochastic.current.d.toFixed(1),
        trend: val >= 80 ? 'overbought' : val <= 20 ? 'oversold' : 'neutral',
        dataPoints: data.stochastic.k, // Use %K line for the pulse
      };
    }
    if (indicator === 'BB' && data.bollingerBands) {
      const val = data.bollingerBands.current.percentB;
      return {
        primary: val.toFixed(1) + '%',
        trend: val >= 80 ? 'overbought' : val <= 20 ? 'oversold' : 'neutral',
        dataPoints: data.bollingerBands.percentB,
      };
    }
    if (indicator === 'VOL' && data.volume) {
      const ratio = data.volume.current.ratio;
      return {
        primary: ratio.toFixed(2) + 'x',
        trend: ratio >= 1.5 ? 'up' : ratio < 0.5 ? 'down' : 'neutral',
        dataPoints: data.volume.volumes,
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

  // Calculate scrub indicator position
  const getScrubPosition = () => {
    if (scrubIndex === null || !containerRef.current) return null;
    const dataLength = getDataLength();
    if (dataLength === 0) return null;
    const x = (scrubIndex / (dataLength - 1)) * dimensions.width;
    return x;
  };

  const scrubX = getScrubPosition();
  const scrubValues = scrubIndex !== null ? getScrubValues(scrubIndex) : null;

  // Format scrub value for display
  const formatScrubDisplay = () => {
    if (!scrubValues) return null;
    
    if (indicator === 'MACD') {
      return `MACD: ${scrubValues.macd?.toFixed(3)} | Signal: ${scrubValues.signal?.toFixed(3)}`;
    }
    if (indicator === 'RSI') {
      return `RSI: ${scrubValues.rsi?.toFixed(1)}`;
    }
    if (indicator === 'STOCH') {
      return `%K: ${scrubValues.k?.toFixed(1)} | %D: ${scrubValues.d?.toFixed(1)}`;
    }
    if (indicator === 'BB') {
      return `%B: ${scrubValues.percentB?.toFixed(1)}%`;
    }
    if (indicator === 'VOL') {
      const vol = scrubValues.volume ?? 0;
      const formatted = vol >= 1000000 ? `${(vol / 1000000).toFixed(1)}M` : vol >= 1000 ? `${(vol / 1000).toFixed(1)}K` : vol.toFixed(0);
      return `Vol: ${formatted} (${scrubValues.ratio?.toFixed(2)}x avg)`;
    }
    return null;
  };

  return (
    <div className={`${className}`}>
      <div 
        ref={containerRef} 
        className={`relative ${interactive ? 'touch-none cursor-crosshair' : ''}`} 
        style={{ height }}
        onPointerDown={interactive ? handleScrubStart : undefined}
        onPointerMove={interactive ? handleScrubMove : undefined}
        onPointerUp={interactive ? handleScrubEnd : undefined}
        onPointerLeave={interactive ? handleScrubEnd : undefined}
        onPointerCancel={interactive ? handleScrubEnd : undefined}
      >
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height, pointerEvents: 'none' }}
          className="rounded-xl bg-white dark:bg-gray-900"
        />

      {/* Scrub indicator */}
      {interactive && isScrubbing && scrubX !== null && (
        <>
          {/* Vertical line */}
          <div 
            className="absolute top-0 bottom-0 w-px bg-gray-500/50 dark:bg-gray-400/50 pointer-events-none"
            style={{ left: scrubX }}
          />
          {/* Scrub dot */}
          <div 
            className="absolute w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-gray-900 shadow-md pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: scrubX, top: height / 2 }}
          />
          {/* Value display */}
          {scrubValues && (
            <div 
              className="absolute top-1 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900/80 dark:bg-gray-100/90 text-white dark:text-gray-900 text-[10px] font-medium rounded shadow-lg whitespace-nowrap pointer-events-none z-10"
            >
              {formatScrubDisplay()}
            </div>
          )}
        </>
      )}

      {/* Legend for MACD */}
      {showLabels && !compact && indicator === 'MACD' && !isScrubbing && (
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
      {showLabels && !compact && indicator === 'STOCH' && !isScrubbing && (
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
      {showLabels && !compact && indicator === 'BB' && !isScrubbing && (
        <div className="absolute bottom-2 left-3 flex items-center gap-4 text-[10px]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-purple-500 rounded" />
            <span className="text-gray-500 dark:text-gray-400">%B Position</span>
          </span>
        </div>
      )}

      {/* Trend Pulse Animation */}
      {showLabels && !compact && currentValue && currentValue.dataPoints && progress >= 1 && !isScrubbing && (
        <div className="absolute bottom-2 right-3 flex items-center gap-2">
          <span className="text-[9px] text-gray-400 uppercase tracking-wide">Trend</span>
          <TrendPulse 
            trend={currentValue.trend as 'up' | 'down' | 'neutral' | 'overbought' | 'oversold'} 
            indicator={indicator}
            dataPoints={currentValue.dataPoints}
            width={70}
            height={22}
          />
        </div>
      )}

      {/* Touch hint for interactive charts */}
      {interactive && !isScrubbing && !compact && (
        <div className="absolute top-1.5 right-2 text-[9px] text-gray-400 dark:text-gray-500 pointer-events-none opacity-60">
          Touch to scrub
        </div>
      )}
      </div>

      {/* Time Axis Labels */}
      {data?.timestamps && data.timestamps.length > 0 && !isLoading && (
        <div className="flex justify-between px-1 mt-1 text-[10px] text-gray-400 dark:text-gray-500 select-none">
          {(() => {
            const timestamps = data.timestamps;
            const totalLabels = 5; // Show 5 evenly spaced labels
            const indices = Array.from({ length: totalLabels }, (_, i) => 
              Math.floor((i / (totalLabels - 1)) * (timestamps.length - 1))
            );
            return indices.map((idx, i) => (
              <span key={i} className="truncate max-w-[60px]">
                {timestamps[idx]}
              </span>
            ));
          })()}
        </div>
      )}
    </div>
  );
}
