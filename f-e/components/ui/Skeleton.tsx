"use client";

import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className = '',
  width,
  height,
  variant = 'rectangular',
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-xl',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
}

// Pre-built skeleton patterns for common use cases
export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          variant="text" 
          height={16} 
          width={i === lines - 1 && lines > 1 ? '70%' : '100%'} 
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton variant="text" width={100} height={18} />
        </div>
        <Skeleton variant="rounded" width={80} height={24} />
      </div>
      <Skeleton variant="rounded" height={120} className="w-full" />
      <div className="flex gap-2">
        <Skeleton variant="rounded" width={80} height={24} />
        <Skeleton variant="rounded" width={100} height={24} />
      </div>
    </div>
  );
}

// Skeleton for indicator chart card
export function SkeletonIndicatorCard({ 
  height = 140,
  showValues = true,
  className = '' 
}: { 
  height?: number;
  showValues?: boolean;
  className?: string;
}) {
  return (
    <div className={`bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-3 animate-pulse ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton variant="text" width={120} height={18} />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="text" width={50} height={18} />
          <Skeleton variant="rounded" width={60} height={22} />
        </div>
      </div>
      
      {/* Chart area */}
      <div 
        className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl relative overflow-hidden"
        style={{ height }}
      >
        {/* Animated wave effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200/50 dark:via-gray-600/30 to-transparent animate-shimmer" />
      </div>
      
      {/* Event badges placeholder */}
      <div className="flex gap-2">
        <Skeleton variant="rounded" width={90} height={22} />
        <Skeleton variant="rounded" width={75} height={22} />
      </div>
      
      {/* Values grid */}
      {showValues && (
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center space-y-1">
              <Skeleton variant="text" width="60%" height={10} className="mx-auto" />
              <Skeleton variant="text" width="80%" height={16} className="mx-auto" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Skeleton for Moving Averages section
export function SkeletonMovingAverages({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Skeleton variant="circular" width={20} height={20} />
        <Skeleton variant="text" width={130} height={20} />
      </div>
      
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
            <Skeleton variant="text" width={60} height={16} />
            <div className="flex items-center gap-2">
              <Skeleton variant="text" width={70} height={16} />
              <Skeleton variant="rounded" width={55} height={20} />
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width={90} height={14} />
          <Skeleton variant="text" width={80} height={20} />
        </div>
      </div>
    </div>
  );
}

// Skeleton for Volume Analysis section
export function SkeletonVolumeAnalysis({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton variant="text" width={120} height={20} />
        </div>
        <Skeleton variant="rounded" width={60} height={20} />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-3 text-center space-y-2">
          <Skeleton variant="text" width="70%" height={12} className="mx-auto" />
          <Skeleton variant="text" width="50%" height={24} className="mx-auto" />
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-3 text-center space-y-2">
          <Skeleton variant="text" width="70%" height={12} className="mx-auto" />
          <Skeleton variant="text" width="50%" height={24} className="mx-auto" />
        </div>
      </div>
      
      <Skeleton variant="rounded" height={10} className="w-full" />
      <Skeleton variant="text" width="60%" height={12} className="mx-auto" />
    </div>
  );
}

// Skeleton for Overall Signal card
export function SkeletonSignalCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800/50 dark:to-gray-800/30 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton variant="circular" width={16} height={16} />
            <Skeleton variant="text" width={140} height={14} />
          </div>
          <Skeleton variant="text" width={80} height={32} />
        </div>
        <div className="text-right space-y-2">
          <Skeleton variant="text" width={70} height={12} />
          <Skeleton variant="text" width={50} height={24} />
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="flex justify-between">
          <Skeleton variant="text" width={60} height={10} />
          <Skeleton variant="text" width={40} height={10} />
          <Skeleton variant="text" width={60} height={10} />
        </div>
        <div className="relative">
          <Skeleton variant="rounded" height={8} className="w-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Skeleton variant="circular" width={12} height={12} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Skeleton for the timeframe selector
export function SkeletonTimeframeSelector({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-1.5">
        <Skeleton variant="text" width={48} height={12} />
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" width={40} height={28} />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Skeleton variant="text" width={48} height={12} />
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" width={40} height={28} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Skeleton;
