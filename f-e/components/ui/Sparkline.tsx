import React from 'react';

type SparklineProps = {
  data: number[];
  stroke?: string;
  strokeWidth?: number;
  className?: string;
  width?: number;
  height?: number;
  fill?: string | 'none';
  gradient?: boolean;
  fillOpacity?: number;
};

export default function Sparkline({ data, stroke = '#34d399', strokeWidth = 2, className = '', width = 80, height = 28, fill = 'none', gradient = false, fillOpacity = 0.12 }: SparklineProps) {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / Math.max(1, data.length - 1);
  const points = data.map((d, i) => {
    const x = (i * step);
    // invert y for svg coordinate system
    const y = height - ((d - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  // Optional area path (not filled by default)
  const areaPath = `M0,${height} L${points.split(' ').join(' L ')} L${width},${height} Z`;
  const uid = React.useId?.() ?? `sparkline-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <svg className={className} width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden>
      {gradient && (
        <defs>
          <linearGradient id={uid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={fillOpacity} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
      )}
      <path d={areaPath} fill={fill === 'none' ? 'none' : fill} stroke="none" />
      <polyline points={points} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      {gradient && (
        <path d={areaPath} fill={`url(#${uid})`} stroke="none" />
      )}
    </svg>
  );
}
