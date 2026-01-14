"use client";

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, Zap, AlertTriangle, BarChart3, Gauge, Activity, BookOpen, ChevronDown } from 'lucide-react';
import InfoModal from './InfoModal';

interface IndicatorInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EventInfo {
  name: string;
  type: 'bullish' | 'bearish' | 'warning' | 'neutral';
  description: string;
  interpretation: string;
}

interface IndicatorSection {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  description: string;
  events: EventInfo[];
}

// Animated SVG visualization component for each event type
function EventVisualization({ sectionTitle, eventName }: { sectionTitle: string; eventName: string }) {
  const isMACD = sectionTitle.includes('MACD');
  const isRSI = sectionTitle.includes('RSI');
  const isStochastic = sectionTitle.includes('Stochastic');
  const isBB = sectionTitle.includes('Bollinger');

  // MACD Visualizations
  if (isMACD) {
    if (eventName === 'Bullish Crossover') {
      return (
        <svg viewBox="0 0 200 80" className="w-full h-16 mt-3">
          <line x1="0" y1="40" x2="200" y2="40" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="4" />
          {/* Signal line (orange) */}
          <path d="M 10,55 Q 50,50 100,42 T 190,35" fill="none" stroke="#f97316" strokeWidth="2" />
          {/* MACD line (blue) - crosses above */}
          <path d="M 10,60 Q 50,55 100,42 T 190,25" fill="none" stroke="#3b82f6" strokeWidth="2">
            <animate attributeName="stroke-dasharray" from="0,300" to="300,0" dur="2s" repeatCount="indefinite" />
          </path>
          {/* Crossover point */}
          <circle cx="100" cy="42" r="4" fill="#22c55e">
            <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite" />
          </circle>
          <text x="105" y="38" fontSize="8" fill="#22c55e" fontWeight="bold">Cross</text>
        </svg>
      );
    }
    if (eventName === 'Bearish Crossover') {
      return (
        <svg viewBox="0 0 200 80" className="w-full h-16 mt-3">
          <line x1="0" y1="40" x2="200" y2="40" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="4" />
          {/* Signal line (orange) */}
          <path d="M 10,25 Q 50,30 100,38 T 190,45" fill="none" stroke="#f97316" strokeWidth="2" />
          {/* MACD line (blue) - crosses below */}
          <path d="M 10,20 Q 50,25 100,38 T 190,55" fill="none" stroke="#3b82f6" strokeWidth="2">
            <animate attributeName="stroke-dasharray" from="0,300" to="300,0" dur="2s" repeatCount="indefinite" />
          </path>
          {/* Crossover point */}
          <circle cx="100" cy="38" r="4" fill="#ef4444">
            <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite" />
          </circle>
          <text x="105" y="34" fontSize="8" fill="#ef4444" fontWeight="bold">Cross</text>
        </svg>
      );
    }
    if (eventName === 'Above Zero') {
      return (
        <svg viewBox="0 0 200 80" className="w-full h-16 mt-3">
          <line x1="0" y1="40" x2="200" y2="40" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
          <text x="5" y="38" fontSize="7" fill="currentColor" opacity="0.5">0</text>
          {/* Histogram bars transitioning from negative to positive */}
          {[20, 40, 60, 80, 100, 120, 140, 160, 180].map((x, i) => {
            const heights = [-15, -10, -5, 0, 8, 15, 20, 25, 28];
            const h = heights[i];
            return (
              <rect
                key={x}
                x={x - 6}
                y={h >= 0 ? 40 - h : 40}
                width="12"
                height={Math.abs(h)}
                fill={h >= 0 ? '#22c55e' : '#ef4444'}
                opacity="0.8"
              >
                <animate attributeName="height" from="0" to={Math.abs(h)} dur="0.3s" begin={`${i * 0.15}s`} fill="freeze" />
              </rect>
            );
          })}
        </svg>
      );
    }
    if (eventName === 'Below Zero') {
      return (
        <svg viewBox="0 0 200 80" className="w-full h-16 mt-3">
          <line x1="0" y1="40" x2="200" y2="40" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
          <text x="5" y="38" fontSize="7" fill="currentColor" opacity="0.5">0</text>
          {/* Histogram bars transitioning from positive to negative */}
          {[20, 40, 60, 80, 100, 120, 140, 160, 180].map((x, i) => {
            const heights = [28, 20, 12, 5, 0, -8, -15, -22, -28];
            const h = heights[i];
            return (
              <rect
                key={x}
                x={x - 6}
                y={h >= 0 ? 40 - h : 40}
                width="12"
                height={Math.abs(h)}
                fill={h >= 0 ? '#22c55e' : '#ef4444'}
                opacity="0.8"
              >
                <animate attributeName="height" from="0" to={Math.abs(h)} dur="0.3s" begin={`${i * 0.15}s`} fill="freeze" />
              </rect>
            );
          })}
        </svg>
      );
    }
    if (eventName === 'Rising Momentum') {
      return (
        <svg viewBox="0 0 200 80" className="w-full h-16 mt-3">
          <line x1="0" y1="40" x2="200" y2="40" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
          {/* Growing positive histogram bars */}
          {[25, 50, 75, 100, 125, 150, 175].map((x, i) => {
            const h = 5 + i * 5;
            return (
              <rect key={x} x={x - 8} y={40 - h} width="16" height={h} fill="#22c55e" opacity="0.8">
                <animate attributeName="height" from="0" to={h} dur="0.4s" begin={`${i * 0.2}s`} fill="freeze" />
                <animate attributeName="y" from="40" to={40 - h} dur="0.4s" begin={`${i * 0.2}s`} fill="freeze" />
              </rect>
            );
          })}
          <path d="M 20,38 L 180,10" stroke="#22c55e" strokeWidth="1" strokeDasharray="4" opacity="0.5" />
        </svg>
      );
    }
    if (eventName === 'Falling Momentum') {
      return (
        <svg viewBox="0 0 200 80" className="w-full h-16 mt-3">
          <line x1="0" y1="40" x2="200" y2="40" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
          {/* Growing negative histogram bars */}
          {[25, 50, 75, 100, 125, 150, 175].map((x, i) => {
            const h = 5 + i * 5;
            return (
              <rect key={x} x={x - 8} y={40} width="16" height={h} fill="#ef4444" opacity="0.8">
                <animate attributeName="height" from="0" to={h} dur="0.4s" begin={`${i * 0.2}s`} fill="freeze" />
              </rect>
            );
          })}
          <path d="M 20,42 L 180,70" stroke="#ef4444" strokeWidth="1" strokeDasharray="4" opacity="0.5" />
        </svg>
      );
    }
  }

  // RSI Visualizations
  if (isRSI) {
    if (eventName === 'Entering Overbought') {
      return (
        <svg viewBox="0 0 200 80" className="w-full h-16 mt-3">
          {/* Overbought zone */}
          <rect x="0" y="0" width="200" height="24" fill="#ef4444" opacity="0.1" />
          <line x1="0" y1="24" x2="200" y2="24" stroke="#ef4444" strokeOpacity="0.5" strokeDasharray="4" />
          <text x="3" y="18" fontSize="7" fill="#ef4444" opacity="0.7">70</text>
          {/* Oversold zone */}
          <rect x="0" y="56" width="200" height="24" fill="#22c55e" opacity="0.1" />
          <line x1="0" y1="56" x2="200" y2="56" stroke="#22c55e" strokeOpacity="0.5" strokeDasharray="4" />
          <text x="3" y="68" fontSize="7" fill="#22c55e" opacity="0.7">30</text>
          {/* RSI line entering overbought */}
          <path d="M 10,50 Q 60,45 100,30 T 190,15" fill="none" stroke="#8b5cf6" strokeWidth="2">
            <animate attributeName="stroke-dasharray" from="0,300" to="300,0" dur="2s" repeatCount="indefinite" />
          </path>
          <circle cx="120" cy="24" r="4" fill="#f59e0b">
            <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite" />
          </circle>
        </svg>
      );
    }
    if (eventName === 'Entering Oversold') {
      return (
        <svg viewBox="0 0 200 80" className="w-full h-16 mt-3">
          <rect x="0" y="0" width="200" height="24" fill="#ef4444" opacity="0.1" />
          <line x1="0" y1="24" x2="200" y2="24" stroke="#ef4444" strokeOpacity="0.5" strokeDasharray="4" />
          <text x="3" y="18" fontSize="7" fill="#ef4444" opacity="0.7">70</text>
          <rect x="0" y="56" width="200" height="24" fill="#22c55e" opacity="0.1" />
          <line x1="0" y1="56" x2="200" y2="56" stroke="#22c55e" strokeOpacity="0.5" strokeDasharray="4" />
          <text x="3" y="68" fontSize="7" fill="#22c55e" opacity="0.7">30</text>
          {/* RSI line entering oversold */}
          <path d="M 10,30 Q 60,35 100,50 T 190,65" fill="none" stroke="#8b5cf6" strokeWidth="2">
            <animate attributeName="stroke-dasharray" from="0,300" to="300,0" dur="2s" repeatCount="indefinite" />
          </path>
          <circle cx="120" cy="56" r="4" fill="#22c55e">
            <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite" />
          </circle>
        </svg>
      );
    }
    if (eventName === 'Exiting Overbought') {
      return (
        <svg viewBox="0 0 200 80" className="w-full h-16 mt-3">
          <rect x="0" y="0" width="200" height="24" fill="#ef4444" opacity="0.1" />
          <line x1="0" y1="24" x2="200" y2="24" stroke="#ef4444" strokeOpacity="0.5" strokeDasharray="4" />
          <text x="3" y="18" fontSize="7" fill="#ef4444" opacity="0.7">70</text>
          <rect x="0" y="56" width="200" height="24" fill="#22c55e" opacity="0.1" />
          <line x1="0" y1="56" x2="200" y2="56" stroke="#22c55e" strokeOpacity="0.5" strokeDasharray="4" />
          <text x="3" y="68" fontSize="7" fill="#22c55e" opacity="0.7">30</text>
          {/* RSI line exiting overbought */}
          <path d="M 10,15 Q 60,18 100,24 T 190,40" fill="none" stroke="#8b5cf6" strokeWidth="2">
            <animate attributeName="stroke-dasharray" from="0,300" to="300,0" dur="2s" repeatCount="indefinite" />
          </path>
          <circle cx="100" cy="24" r="4" fill="#ef4444">
            <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite" />
          </circle>
        </svg>
      );
    }
    if (eventName === 'Exiting Oversold') {
      return (
        <svg viewBox="0 0 200 80" className="w-full h-16 mt-3">
          <rect x="0" y="0" width="200" height="24" fill="#ef4444" opacity="0.1" />
          <line x1="0" y1="24" x2="200" y2="24" stroke="#ef4444" strokeOpacity="0.5" strokeDasharray="4" />
          <text x="3" y="18" fontSize="7" fill="#ef4444" opacity="0.7">70</text>
          <rect x="0" y="56" width="200" height="24" fill="#22c55e" opacity="0.1" />
          <line x1="0" y1="56" x2="200" y2="56" stroke="#22c55e" strokeOpacity="0.5" strokeDasharray="4" />
          <text x="3" y="68" fontSize="7" fill="#22c55e" opacity="0.7">30</text>
          {/* RSI line exiting oversold */}
          <path d="M 10,65 Q 60,62 100,56 T 190,40" fill="none" stroke="#8b5cf6" strokeWidth="2">
            <animate attributeName="stroke-dasharray" from="0,300" to="300,0" dur="2s" repeatCount="indefinite" />
          </path>
          <circle cx="100" cy="56" r="4" fill="#22c55e">
            <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite" />
          </circle>
        </svg>
      );
    }
    if (eventName === 'Bullish Momentum') {
      return (
        <svg viewBox="0 0 200 80" className="w-full h-16 mt-3">
          <line x1="0" y1="40" x2="200" y2="40" stroke="currentColor" strokeOpacity="0.3" strokeDasharray="4" />
          <text x="3" y="38" fontSize="7" fill="currentColor" opacity="0.5">50</text>
          {/* Rising RSI above 50 */}
          <path d="M 10,50 Q 60,45 100,38 T 190,25" fill="none" stroke="#8b5cf6" strokeWidth="2">
            <animate attributeName="stroke-dasharray" from="0,300" to="300,0" dur="2s" repeatCount="indefinite" />
          </path>
          <polygon points="185,20 195,25 185,30" fill="#22c55e">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" />
          </polygon>
        </svg>
      );
    }
    if (eventName === 'Bearish Momentum') {
      return (
        <svg viewBox="0 0 200 80" className="w-full h-16 mt-3">
          <line x1="0" y1="40" x2="200" y2="40" stroke="currentColor" strokeOpacity="0.3" strokeDasharray="4" />
          <text x="3" y="38" fontSize="7" fill="currentColor" opacity="0.5">50</text>
          {/* Falling RSI below 50 */}
          <path d="M 10,30 Q 60,35 100,42 T 190,55" fill="none" stroke="#8b5cf6" strokeWidth="2">
            <animate attributeName="stroke-dasharray" from="0,300" to="300,0" dur="2s" repeatCount="indefinite" />
          </path>
          <polygon points="185,50 195,55 185,60" fill="#ef4444">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" />
          </polygon>
        </svg>
      );
    }
  }

  // Stochastic Visualizations
  if (isStochastic) {
    if (eventName === 'Bullish Crossover') {
      return (
        <svg viewBox="0 0 200 80" className="w-full h-16 mt-3">
          <rect x="0" y="0" width="200" height="16" fill="#ef4444" opacity="0.1" />
          <line x1="0" y1="16" x2="200" y2="16" stroke="#ef4444" strokeOpacity="0.3" strokeDasharray="4" />
          <text x="3" y="12" fontSize="7" fill="#ef4444" opacity="0.5">80</text>
          <rect x="0" y="64" width="200" height="16" fill="#22c55e" opacity="0.1" />
          <line x1="0" y1="64" x2="200" y2="64" stroke="#22c55e" strokeOpacity="0.3" strokeDasharray="4" />
          <text x="3" y="76" fontSize="7" fill="#22c55e" opacity="0.5">20</text>
          {/* %D (slow) */}
          <path d="M 10,55 Q 60,52 100,45 T 190,35" fill="none" stroke="#f97316" strokeWidth="2" />
          {/* %K (fast) crosses above */}
          <path d="M 10,60 Q 60,55 100,45 T 190,25" fill="none" stroke="#3b82f6" strokeWidth="2">
            <animate attributeName="stroke-dasharray" from="0,300" to="300,0" dur="2s" repeatCount="indefinite" />
          </path>
          <circle cx="100" cy="45" r="4" fill="#22c55e">
            <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite" />
          </circle>
        </svg>
      );
    }
    if (eventName === 'Bearish Crossover') {
      return (
        <svg viewBox="0 0 200 80" className="w-full h-16 mt-3">
          <rect x="0" y="0" width="200" height="16" fill="#ef4444" opacity="0.1" />
          <line x1="0" y1="16" x2="200" y2="16" stroke="#ef4444" strokeOpacity="0.3" strokeDasharray="4" />
          <text x="3" y="12" fontSize="7" fill="#ef4444" opacity="0.5">80</text>
          <rect x="0" y="64" width="200" height="16" fill="#22c55e" opacity="0.1" />
          <line x1="0" y1="64" x2="200" y2="64" stroke="#22c55e" strokeOpacity="0.3" strokeDasharray="4" />
          <text x="3" y="76" fontSize="7" fill="#22c55e" opacity="0.5">20</text>
          {/* %D (slow) */}
          <path d="M 10,25 Q 60,28 100,35 T 190,45" fill="none" stroke="#f97316" strokeWidth="2" />
          {/* %K (fast) crosses below */}
          <path d="M 10,20 Q 60,25 100,35 T 190,55" fill="none" stroke="#3b82f6" strokeWidth="2">
            <animate attributeName="stroke-dasharray" from="0,300" to="300,0" dur="2s" repeatCount="indefinite" />
          </path>
          <circle cx="100" cy="35" r="4" fill="#ef4444">
            <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite" />
          </circle>
        </svg>
      );
    }
    if (eventName === 'Oversold Bounce') {
      return (
        <svg viewBox="0 0 200 80" className="w-full h-16 mt-3">
          <rect x="0" y="64" width="200" height="16" fill="#22c55e" opacity="0.15" />
          <line x1="0" y1="64" x2="200" y2="64" stroke="#22c55e" strokeOpacity="0.5" strokeDasharray="4" />
          <text x="3" y="76" fontSize="7" fill="#22c55e" opacity="0.7">20</text>
          {/* Lines bouncing in oversold */}
          <path d="M 10,70 Q 60,72 100,68 T 190,50" fill="none" stroke="#3b82f6" strokeWidth="2">
            <animate attributeName="stroke-dasharray" from="0,300" to="300,0" dur="2s" repeatCount="indefinite" />
          </path>
          <path d="M 10,72 Q 60,74 100,70 T 190,55" fill="none" stroke="#f97316" strokeWidth="2" opacity="0.7" />
          <polygon points="185,45 195,50 185,55" fill="#22c55e">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" />
          </polygon>
        </svg>
      );
    }
    if (eventName === 'Overbought Reversal') {
      return (
        <svg viewBox="0 0 200 80" className="w-full h-16 mt-3">
          <rect x="0" y="0" width="200" height="16" fill="#ef4444" opacity="0.15" />
          <line x1="0" y1="16" x2="200" y2="16" stroke="#ef4444" strokeOpacity="0.5" strokeDasharray="4" />
          <text x="3" y="12" fontSize="7" fill="#ef4444" opacity="0.7">80</text>
          {/* Lines reversing in overbought */}
          <path d="M 10,10 Q 60,8 100,12 T 190,30" fill="none" stroke="#3b82f6" strokeWidth="2">
            <animate attributeName="stroke-dasharray" from="0,300" to="300,0" dur="2s" repeatCount="indefinite" />
          </path>
          <path d="M 10,8 Q 60,6 100,10 T 190,25" fill="none" stroke="#f97316" strokeWidth="2" opacity="0.7" />
          <polygon points="185,25 195,30 185,35" fill="#ef4444">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" />
          </polygon>
        </svg>
      );
    }
  }

  // Bollinger Bands Visualizations
  if (isBB) {
    if (eventName === 'Upper Band Touch') {
      return (
        <svg viewBox="0 0 200 80" className="w-full h-16 mt-3">
          {/* Upper band */}
          <path d="M 0,15 Q 50,12 100,15 T 200,12" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.6" />
          {/* Middle band */}
          <path d="M 0,40 Q 50,38 100,40 T 200,38" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4" />
          {/* Lower band */}
          <path d="M 0,65 Q 50,68 100,65 T 200,68" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeOpacity="0.6" />
          {/* Band fill */}
          <path d="M 0,15 Q 50,12 100,15 T 200,12 L 200,68 Q 150,65 100,65 T 0,68 Z" fill="currentColor" opacity="0.05" />
          {/* Price touching upper */}
          <path d="M 10,50 Q 60,35 100,20 T 150,15" fill="none" stroke="#8b5cf6" strokeWidth="2">
            <animate attributeName="stroke-dasharray" from="0,200" to="200,0" dur="2s" repeatCount="indefinite" />
          </path>
          <circle cx="150" cy="15" r="4" fill="#f59e0b">
            <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite" />
          </circle>
        </svg>
      );
    }
    if (eventName === 'Lower Band Touch') {
      return (
        <svg viewBox="0 0 200 80" className="w-full h-16 mt-3">
          <path d="M 0,15 Q 50,12 100,15 T 200,12" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.6" />
          <path d="M 0,40 Q 50,38 100,40 T 200,38" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4" />
          <path d="M 0,65 Q 50,68 100,65 T 200,68" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeOpacity="0.6" />
          <path d="M 0,15 Q 50,12 100,15 T 200,12 L 200,68 Q 150,65 100,65 T 0,68 Z" fill="currentColor" opacity="0.05" />
          {/* Price touching lower */}
          <path d="M 10,30 Q 60,45 100,60 T 150,65" fill="none" stroke="#8b5cf6" strokeWidth="2">
            <animate attributeName="stroke-dasharray" from="0,200" to="200,0" dur="2s" repeatCount="indefinite" />
          </path>
          <circle cx="150" cy="65" r="4" fill="#22c55e">
            <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite" />
          </circle>
        </svg>
      );
    }
    if (eventName === 'Upper Breakout') {
      return (
        <svg viewBox="0 0 200 80" className="w-full h-16 mt-3">
          <path d="M 0,25 Q 50,22 100,25 T 200,22" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.6" />
          <path d="M 0,45 Q 50,43 100,45 T 200,43" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4" />
          <path d="M 0,65 Q 50,68 100,65 T 200,68" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeOpacity="0.6" />
          <path d="M 0,25 Q 50,22 100,25 T 200,22 L 200,68 Q 150,65 100,65 T 0,68 Z" fill="currentColor" opacity="0.05" />
          {/* Price breaking above upper */}
          <path d="M 10,50 Q 60,40 100,28 T 180,8" fill="none" stroke="#8b5cf6" strokeWidth="2">
            <animate attributeName="stroke-dasharray" from="0,250" to="250,0" dur="2s" repeatCount="indefinite" />
          </path>
          <polygon points="175,3 185,8 175,13" fill="#ef4444">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="0.8s" repeatCount="indefinite" />
          </polygon>
        </svg>
      );
    }
    if (eventName === 'Lower Breakout') {
      return (
        <svg viewBox="0 0 200 80" className="w-full h-16 mt-3">
          <path d="M 0,15 Q 50,12 100,15 T 200,12" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.6" />
          <path d="M 0,35 Q 50,33 100,35 T 200,33" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4" />
          <path d="M 0,55 Q 50,58 100,55 T 200,58" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeOpacity="0.6" />
          <path d="M 0,15 Q 50,12 100,15 T 200,12 L 200,58 Q 150,55 100,55 T 0,58 Z" fill="currentColor" opacity="0.05" />
          {/* Price breaking below lower */}
          <path d="M 10,30 Q 60,40 100,52 T 180,72" fill="none" stroke="#8b5cf6" strokeWidth="2">
            <animate attributeName="stroke-dasharray" from="0,250" to="250,0" dur="2s" repeatCount="indefinite" />
          </path>
          <polygon points="175,67 185,72 175,77" fill="#22c55e">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="0.8s" repeatCount="indefinite" />
          </polygon>
        </svg>
      );
    }
    if (eventName === 'Mean Reversion (Bullish)') {
      return (
        <svg viewBox="0 0 200 80" className="w-full h-16 mt-3">
          <path d="M 0,15 Q 50,12 100,15 T 200,12" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.6" />
          <path d="M 0,40 Q 50,38 100,40 T 200,38" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4" />
          <path d="M 0,65 Q 50,68 100,65 T 200,68" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeOpacity="0.6" />
          <path d="M 0,15 Q 50,12 100,15 T 200,12 L 200,68 Q 150,65 100,65 T 0,68 Z" fill="currentColor" opacity="0.05" />
          {/* Price reverting from lower to middle */}
          <path d="M 10,65 Q 60,60 100,50 T 190,40" fill="none" stroke="#8b5cf6" strokeWidth="2">
            <animate attributeName="stroke-dasharray" from="0,250" to="250,0" dur="2s" repeatCount="indefinite" />
          </path>
          <circle cx="100" cy="50" r="3" fill="#22c55e">
            <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite" />
          </circle>
        </svg>
      );
    }
    if (eventName === 'Mean Reversion (Bearish)') {
      return (
        <svg viewBox="0 0 200 80" className="w-full h-16 mt-3">
          <path d="M 0,15 Q 50,12 100,15 T 200,12" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.6" />
          <path d="M 0,40 Q 50,38 100,40 T 200,38" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4" />
          <path d="M 0,65 Q 50,68 100,65 T 200,68" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeOpacity="0.6" />
          <path d="M 0,15 Q 50,12 100,15 T 200,12 L 200,68 Q 150,65 100,65 T 0,68 Z" fill="currentColor" opacity="0.05" />
          {/* Price reverting from upper to middle */}
          <path d="M 10,15 Q 60,20 100,30 T 190,40" fill="none" stroke="#8b5cf6" strokeWidth="2">
            <animate attributeName="stroke-dasharray" from="0,250" to="250,0" dur="2s" repeatCount="indefinite" />
          </path>
          <circle cx="100" cy="30" r="3" fill="#ef4444">
            <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite" />
          </circle>
        </svg>
      );
    }
  }

  return null;
}

const indicatorSections: IndicatorSection[] = [
  {
    title: 'MACD (Moving Average Convergence Divergence)',
    icon: <BarChart3 className="w-5 h-5" />,
    iconColor: 'text-purple-500',
    description: 'MACD is a trend-following momentum indicator that shows the relationship between two moving averages of a security\'s price.',
    events: [
      {
        name: 'Bullish Crossover',
        type: 'bullish',
        description: 'MACD line crosses above the Signal line',
        interpretation: 'A bullish signal suggesting upward momentum is building. Often indicates the start of a new uptrend. Best confirmed with increasing volume.',
      },
      {
        name: 'Bearish Crossover',
        type: 'bearish',
        description: 'MACD line crosses below the Signal line',
        interpretation: 'A bearish signal suggesting downward momentum is building. May indicate the start of a downtrend or pullback. Consider reducing positions.',
      },
      {
        name: 'Above Zero',
        type: 'bullish',
        description: 'Histogram crosses from negative to positive',
        interpretation: 'The short-term average has moved above the long-term average, confirming bullish momentum. Price is in an uptrend.',
      },
      {
        name: 'Below Zero',
        type: 'bearish',
        description: 'Histogram crosses from positive to negative',
        interpretation: 'The short-term average has dropped below the long-term average, confirming bearish momentum. Price is in a downtrend.',
      },
      {
        name: 'Rising Momentum',
        type: 'bullish',
        description: 'Histogram is positive and increasing',
        interpretation: 'Bullish momentum is strengthening. The gap between MACD and Signal line is widening in a bullish direction.',
      },
      {
        name: 'Falling Momentum',
        type: 'bearish',
        description: 'Histogram is negative and decreasing',
        interpretation: 'Bearish momentum is strengthening. The gap between MACD and Signal line is widening in a bearish direction.',
      },
    ],
  },
  {
    title: 'RSI (Relative Strength Index)',
    icon: <Gauge className="w-5 h-5" />,
    iconColor: 'text-blue-500',
    description: 'RSI measures the speed and magnitude of recent price changes to evaluate overbought or oversold conditions. Values range from 0 to 100.',
    events: [
      {
        name: 'Entering Overbought',
        type: 'warning',
        description: 'RSI crosses above 70',
        interpretation: 'The asset may be overbought and due for a pullback. However, in strong uptrends, RSI can remain overbought for extended periods.',
      },
      {
        name: 'Entering Oversold',
        type: 'bullish',
        description: 'RSI crosses below 30',
        interpretation: 'The asset may be oversold and due for a bounce. This can be a buying opportunity, but in strong downtrends, prices can remain oversold.',
      },
      {
        name: 'Exiting Overbought',
        type: 'bearish',
        description: 'RSI crosses back below 70',
        interpretation: 'Upward momentum is fading. This can signal the beginning of a price decline or consolidation period.',
      },
      {
        name: 'Exiting Oversold',
        type: 'bullish',
        description: 'RSI crosses back above 30',
        interpretation: 'Downward momentum is fading. This often signals a potential reversal or the start of a recovery rally.',
      },
      {
        name: 'Bullish Momentum',
        type: 'bullish',
        description: 'RSI is rising and above 50',
        interpretation: 'Price momentum is positive. The trend is likely to continue upward in the near term.',
      },
      {
        name: 'Bearish Momentum',
        type: 'bearish',
        description: 'RSI is falling and below 50',
        interpretation: 'Price momentum is negative. The trend is likely to continue downward in the near term.',
      },
    ],
  },
  {
    title: 'Stochastic Oscillator',
    icon: <TrendingUp className="w-5 h-5" />,
    iconColor: 'text-green-500',
    description: 'The Stochastic Oscillator compares a security\'s closing price to its price range over a given period. %K is the fast line, %D is the slow signal line.',
    events: [
      {
        name: 'Bullish Crossover',
        type: 'bullish',
        description: '%K line crosses above %D line',
        interpretation: 'Short-term momentum is turning positive. Most effective when occurring in oversold territory (below 20).',
      },
      {
        name: 'Bearish Crossover',
        type: 'bearish',
        description: '%K line crosses below %D line',
        interpretation: 'Short-term momentum is turning negative. Most effective when occurring in overbought territory (above 80).',
      },
      {
        name: 'Oversold Bounce',
        type: 'bullish',
        description: '%K is below 20 and starting to rise',
        interpretation: 'The asset is oversold and showing early signs of a potential reversal. Watch for confirmation with price action.',
      },
      {
        name: 'Overbought Reversal',
        type: 'bearish',
        description: '%K is above 80 and starting to decline',
        interpretation: 'The asset is overbought and showing early signs of a potential reversal. Consider taking profits or tightening stops.',
      },
    ],
  },
  {
    title: 'Bollinger Bands',
    icon: <Activity className="w-5 h-5" />,
    iconColor: 'text-cyan-500',
    description: 'Bollinger Bands consist of a middle band (SMA) with upper and lower bands based on standard deviation. %B shows where price is relative to the bands.',
    events: [
      {
        name: 'Upper Band Touch',
        type: 'warning',
        description: 'Price reaches or exceeds the upper band (%B ≥ 100)',
        interpretation: 'Price is at the upper extreme of recent volatility. This can indicate overbought conditions or strong upward momentum in a trend.',
      },
      {
        name: 'Lower Band Touch',
        type: 'bullish',
        description: 'Price reaches or falls below the lower band (%B ≤ 0)',
        interpretation: 'Price is at the lower extreme of recent volatility. This can indicate oversold conditions or a potential buying opportunity.',
      },
      {
        name: 'Upper Breakout',
        type: 'bearish',
        description: 'Price breaks above the upper band',
        interpretation: 'Strong momentum or potential exhaustion. In ranging markets, this often leads to mean reversion. In trending markets, it can signal continuation.',
      },
      {
        name: 'Lower Breakout',
        type: 'bullish',
        description: 'Price breaks below the lower band',
        interpretation: 'Extreme selling or potential capitulation. Often precedes a bounce or reversal, especially with high volume.',
      },
      {
        name: 'Mean Reversion (Bullish)',
        type: 'bullish',
        description: '%B rises back above 20 after being below',
        interpretation: 'Price is reverting toward the middle band from oversold conditions. This often signals the start of a recovery move.',
      },
      {
        name: 'Mean Reversion (Bearish)',
        type: 'bearish',
        description: '%B falls back below 80 after being above',
        interpretation: 'Price is reverting toward the middle band from overbought conditions. This often signals the start of a pullback.',
      },
    ],
  },
];

export default function IndicatorInfoModal({ isOpen, onClose }: IndicatorInfoModalProps) {
  const getEventTypeStyles = (type: EventInfo['type']) => {
    switch (type) {
      case 'bullish':
        return 'bg-green-100 dark:bg-green-900/10 text-gray-700gray dark:text-gray-300 border-green-200 dark:border-green-800';
      case 'bearish':
        return 'bg-red-100 dark:bg-red-900/10 text-gray-700 dark:text-gray-300 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-amber-100 dark:bg-amber-900/10 text-gray-700 dark:text-gray-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const [expandedSections, setExpandedSections] = useState<number[]>([0]);

  const toggleSection = (idx: number) => {
    setExpandedSections((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <InfoModal
      open={isOpen}
      onClose={onClose}
      title={
        <>
          <BookOpen className="w-5 h-5 text-purple-500" />
          Technical Indicator Guide
        </>
      }
      ariaLabel="Technical Indicator Guide"
    >
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 space-y-8">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Understanding event badges and signals displayed on your indicator charts.
        </p>

        {indicatorSections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            {/* Accordion Header */}
            <button
              onClick={() => toggleSection(sectionIdx)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className={section.iconColor}>{section.icon}</span>
                <div className="text-left">
                  <h3 className="font-semibold text-lg">{section.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{section.description}</p>
                </div>
              </div>
              <ChevronDown 
                className={`w-16 h-16 text-gray-500 transition-transform duration-200 ${
                  expandedSections.includes(sectionIdx) ? 'rotate-180' : ''
                }`} 
              />
            </button>

            {/* Accordion Content */}
            <div
              className={`transition-all duration-200 ease-in-out overflow-hidden ${
                expandedSections.includes(sectionIdx) ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="p-4 space-y-3">
                {section.events.map((event, eventIdx) => (
                  <div 
                    key={eventIdx}
                    className={`rounded-xl border p-4 ${getEventTypeStyles(event.type)}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm">{event.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${
                        event.type === 'bullish' ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                        : event.type === 'bearish' ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                        : event.type === 'warning' ? 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                      }`}>
                        {event.type}
                      </span>
                    </div>
                    <p className="text-xs opacity-80 mb-2">{event.description}</p>
                    <p className="text-sm">{event.interpretation}</p>
                    <EventVisualization sectionTitle={section.title} eventName={event.name} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Disclaimer */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mt-6">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <strong>Disclaimer:</strong> Technical indicators are tools for analysis and should not be used as the sole basis for investment decisions. 
            Always consider multiple factors including fundamental analysis, market conditions, and your personal risk tolerance before making trades. 
            Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    </InfoModal>
  );
}
