"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface AnimatedPriceProps {
  value: number;
  prefix?: string;
  suffix?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  className?: string;
  duration?: number; // Animation duration in ms
}

/**
 * AnimatedPrice - Robinhood-style digit flipping animation for price changes
 * Shows a rolling/slot-machine effect when digits change
 */
export default function AnimatedPrice({
  value,
  prefix = '',
  suffix = '',
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
  className = '',
  duration = 250,
}: AnimatedPriceProps) {
  const prevValueRef = useRef<number>(value);
  const [currentValue, setCurrentValue] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'up' | 'down'>('up');

  // Format number to string with proper formatting
  const formatValue = useCallback((val: number): string => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits,
      maximumFractionDigits,
    });
  }, [minimumFractionDigits, maximumFractionDigits]);

  useEffect(() => {
    if (value !== prevValueRef.current) {
      setPrevValue(prevValueRef.current);
      setCurrentValue(value);
      setDirection(value > prevValueRef.current ? 'up' : 'down');
      setIsAnimating(true);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, duration);
      
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
  }, [value, duration]);

  const currentDigits = formatValue(currentValue).split('');
  const prevDigits = formatValue(prevValue).split('');
  
  // Pad to same length
  const maxLen = Math.max(currentDigits.length, prevDigits.length);
  while (currentDigits.length < maxLen) currentDigits.unshift(' ');
  while (prevDigits.length < maxLen) prevDigits.unshift(' ');

  return (
    <span className={`inline-flex items-baseline ${className}`}>
      {prefix && <span>{prefix}</span>}
      <span className="inline-flex">
        {currentDigits.map((digit, index) => {
          const prevDigit = prevDigits[index];
          const hasChanged = digit !== prevDigit && isAnimating;
          const isNumber = /\d/.test(digit);
          
          return (
            <span
              key={index}
              className="relative inline-block overflow-hidden"
              style={{
                minWidth: isNumber ? '0.6em' : digit === ',' ? '0.3em' : digit === '.' ? '0.25em' : digit === ' ' ? '0' : 'auto',
                height: '1.2em',
              }}
            >
              {/* Current digit */}
              <span
                className={`inline-block ${
                  hasChanged 
                    ? direction === 'up' 
                      ? 'animate-slide-in-up' 
                      : 'animate-slide-in-down'
                    : ''
                }`}
                style={{ 
                  display: 'block',
                  textAlign: 'center',
                }}
              >
                {digit}
              </span>
              {/* Previous digit (slides out) */}
              {hasChanged && (
                <span
                  className={`absolute inset-0 inline-block ${
                    direction === 'up' 
                      ? 'animate-slide-out-up' 
                      : 'animate-slide-out-down'
                  }`}
                  style={{ 
                    display: 'block',
                    textAlign: 'center',
                  }}
                >
                  {prevDigit}
                </span>
              )}
            </span>
          );
        })}
      </span>
      {suffix && <span>{suffix}</span>}
    </span>
  );
}

/**
 * AnimatedPriceCompact - Simpler version that animates the entire price
 * with a subtle scale/fade effect (better performance for rapid updates)
 */
export function AnimatedPriceCompact({
  value,
  prefix = '',
  suffix = '',
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
  className = '',
}: Omit<AnimatedPriceProps, 'duration'>) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);
  const prevValueRef = useRef<number>(value);

  useEffect(() => {
    if (value !== prevValueRef.current) {
      setDirection(value > prevValueRef.current ? 'up' : 'down');
      setIsAnimating(true);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setDirection(null);
      }, 300);
      
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  const formattedValue = value.toLocaleString(undefined, {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  return (
    <span
      className={`inline-block transition-all duration-200 ${className} ${
        isAnimating
          ? direction === 'up'
            ? 'animate-price-flash-green'
            : 'animate-price-flash-red'
          : ''
      }`}
    >
      {prefix}{formattedValue}{suffix}
    </span>
  );
}
