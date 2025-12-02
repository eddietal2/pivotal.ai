'use client';

import React, { useState } from "react";

// Define the animation keyframes in standard CSS
const animationStyles = `
/* Keyframes for subtle vertical market movement */
@keyframes market-movement {
    0%, 100% {
        transform: translateY(0);
        opacity: 1;
    }
    25% {
        transform: translateY(-5px); /* Bullish movement */
        opacity: 0.95;
    }
    50% {
        transform: translateY(5px); /* Bearish movement, slight drop in body */
        opacity: 1;
    }
    75% {
        transform: translateY(-2px);
        opacity: 0.98;
    }
}

/* Keyframes for a specific candle to "flicker" between colors (mocking rapid price change) */
@keyframes flicker {
    0%, 100% { fill: #00BF63; } /* Green */
    40% { fill: #FF4500; } /* Red */
    70% { fill: #00BF63; }
}

/* Custom Tailwind utility classes */
.animate-market {
    animation: market-movement 10s linear infinite;
}
`;


export default function CandleStickAnim() {
    // This state can be used to control themes, but for now, we'll keep colors fixed.
    // Assuming a dark background for better visibility of the bright colors.
    const isDark = true; 
    
    // Colors
    const bullColor = "#00BF63"; // Bright Green
    const bearColor = "#FF4500"; // Bright Red/Orange
    const wickColor = isDark ? "#A0A0A0" : "#555555";
    const bgColor = isDark ? "transparent" : "transparent";

    // Candlestick data defining their position, size, and animation delay
    const candles = [
        { x: 10, y: 70, height: 40, width: 10, wickLength: 10, bodyColor: bullColor, delay: '0s' },
        { x: 30, y: 55, height: 50, width: 10, wickLength: 15, bodyColor: bearColor, delay: '1s', flicker: true },
        { x: 50, y: 80, height: 30, width: 10, wickLength: 5, bodyColor: bullColor, delay: '2s' },
        { x: 70, y: 40, height: 60, width: 10, wickLength: 20, bodyColor: bearColor, delay: '3s' },
        { x: 90, y: 65, height: 35, width: 10, wickLength: 10, bodyColor: bullColor, delay: '4s' },
    ];

    type CandleProps = {
        x: number;
        y: number;
        height: number;
        width: number;
        wickLength: number;
        bodyColor: string;
        delay?: string;
        flicker?: boolean;
    };

    const Candle: React.FC<CandleProps> = ({ x, y, height, width, wickLength, bodyColor, delay = '0s', flicker = false }) => {
        // Calculate Y position for the top of the body (Y is from the top of the SVG)
        const bodyY = y - height;

        // Wick calculations
        const topWickY2 = bodyY - wickLength / 2;
        const bottomWickY2 = y + wickLength / 2;

        const animationClass = `animate-market`;
        
        return (
            <g
                className={animationClass}
                style={{
                    animationDelay: delay,
                    animation: `market-movement 10s linear infinite ${delay}, 
                                ${flicker ? 'flicker 5s ease-in-out infinite' : ''}`,
                    transformOrigin: `${x + width / 2}px ${y}px`, // Anchor point for movement
                }}
            >
                {/* Top Wick */}
                <line 
                    x1={x + width / 2} y1={bodyY} 
                    x2={x + width / 2} y2={topWickY2} 
                    stroke={wickColor} strokeWidth="1"
                />

                {/* Body */}
                <rect 
                    x={x} y={bodyY} 
                    width={width} height={height} 
                    fill={bodyColor} 
                    rx="1.5" ry="1.5" // Subtle rounded corners
                />
                
                {/* Bottom Wick */}
                <line 
                    x1={x + width / 2} y1={y} 
                    x2={x + width / 2} y2={bottomWickY2} 
                    stroke={wickColor} strokeWidth="1"
                />
            </g>
        );
    };


    return (
        <div className="flex justify-center items-center w-full max-w-sm mx-auto pt-8" data-testid="candlestick-animation">
            {/* Inject animation keyframes into the DOM */}
            <style dangerouslySetInnerHTML={{ __html: animationStyles }} />

            <svg 
                viewBox="0 0 100 120" 
                className="w-full h-auto max-h-24"
                style={{ 
                    backgroundColor: bgColor, 
                    overflow: 'visible', // Allows movement outside the canvas without clipping
                }}
            >
                {/* Axis Line - Horizontal line for a visual base */}
                {/* <line x1="5" y1="110" x2="95" y2="110" stroke={wickColor} strokeWidth="0.5" /> */}
                
                {/* Render the animated candles */}
                {candles.map((c, index) => (
                    <Candle
                        key={index}
                        {...c}
                        // Flicker is applied to the second candle to show rapid color/price change
                        flicker={c.flicker} 
                    />
                ))}
            </svg>
        </div>
    );
}