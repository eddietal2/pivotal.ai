"use client";

import React from 'react';

type Props = {
  name: string;
  description?: string;
  onNameChange?: (v: string) => void;
  onDescriptionChange?: (v: string) => void;
  onSave?: () => void;
};

export default function StrategyHeader({ name, description, onNameChange, onDescriptionChange, onSave }: Props) {
  return (
    <div className="mb-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <label className="text-xs text-gray-500 dark:text-gray-400">Strategy Name</label>
          <input
            value={name}
            onChange={(e) => onNameChange && onNameChange(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-sm"
          />
          <label className="text-xs text-gray-500 dark:text-gray-400 mt-2 block">Description</label>
          <input
            value={description}
            onChange={(e) => onDescriptionChange && onDescriptionChange(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-sm"
          />
        </div>
        <div className="flex flex-col items-end">
          <div className="text-xs text-gray-500 dark:text-gray-400">Preview: 12 Matches</div>
          <button onClick={() => onSave && onSave()} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">Save Strategy</button>
        </div>
      </div>
    </div>
  );
}
