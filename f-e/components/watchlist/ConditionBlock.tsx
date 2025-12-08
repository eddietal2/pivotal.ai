"use client";

import React from 'react';

export type MetricCategory = 'MACD' | 'RSI' | 'Volume' | 'Price Action';
export type Comparator = 'gt' | 'lt' | 'crosses_above' | 'crosses_below';

export type Condition = {
  id: string;
  category?: MetricCategory;
  metric?: string;
  comparator?: Comparator;
  value?: string;
};

type Props = {
  condition: Condition;
  onChange?: (c: Condition) => void;
  onDelete?: (id: string) => void;
};

const metricsMap: Record<MetricCategory, string[]> = {
  MACD: ['MACD Line', 'Signal Line', 'MACD Histogram'],
  RSI: ['RSI'],
  Volume: ['Today Volume', '20-Day Avg Volume'],
  'Price Action': ['Price', '20-Day SMA'],
};

export default function ConditionBlock({ condition, onChange, onDelete }: Props) {
  const update = (patch: Partial<Condition>) => onChange && onChange({ ...condition, ...patch });

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400">Metric</label>
          <select
            value={condition.category ?? 'RSI'}
            onChange={(e) => update({ category: e.target.value as MetricCategory, metric: undefined })}
            className="mt-1 block w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-sm"
          >
            {Object.keys(metricsMap).map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400">Metric Line</label>
          <select
            value={condition.metric ?? metricsMap.RSI[0]}
            onChange={(e) => update({ metric: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-sm"
          >
            {(metricsMap[condition.category ?? 'RSI'] || metricsMap.RSI).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400">Comparator</label>
          <select
            value={condition.comparator ?? 'gt'}
            onChange={(e) => update({ comparator: e.target.value as Comparator })}
            className="mt-1 block w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-sm"
          >
            <option value="gt">&gt;</option>
            <option value="lt">&lt;</option>
            <option value="crosses_above">crosses above</option>
            <option value="crosses_below">crosses below</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400">Value</label>
          <input
            value={condition.value ?? ''}
            onChange={(e) => update({ value: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-sm"
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button onClick={() => onDelete && onDelete(condition.id)} className="text-xs text-red-600 hover:underline">Remove</button>
      </div>
    </div>
  );
}
