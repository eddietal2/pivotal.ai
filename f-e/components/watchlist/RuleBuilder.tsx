"use client";

import React, { useState } from 'react';
import StrategyHeader from './StrategyHeader';
import ConditionBlock, { Condition } from './ConditionBlock';

export default function RuleBuilder() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [operators, setOperators] = useState<Array<'AND'|'OR'>>([]);

  const addCondition = () => {
    const id = Math.random().toString(36).slice(2, 9);
    setConditions((p) => [...p, { id }]);
    setOperators((p) => (p.length ? [...p, 'AND'] : p));
  };

  const deleteCondition = (id: string) => {
    setConditions((p) => p.filter((c) => c.id !== id));
    setOperators((p) => p.slice(0, Math.max(0, p.length - 1)));
  };

  const updateCondition = (c: Condition) => {
    setConditions((p) => p.map((x) => (x.id === c.id ? c : x)));
  };

  const toggleOperator = (index: number) => {
    setOperators((p) => p.map((op, i) => (i === index ? (op === 'AND' ? 'OR' : 'AND') : op)));
  };

  return (
    <div>
      <StrategyHeader name={name} description={description} onNameChange={setName} onDescriptionChange={setDescription} onSave={() => alert('Saved (mock)')} />

      <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        {conditions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <div className="text-gray-600 dark:text-gray-400 text-sm">Start building your strategy by adding a condition.</div>
            <button onClick={addCondition} className="px-4 py-2 bg-indigo-600 text-white rounded-md">+ Add New Condition</button>
          </div>
        ) : (
          <div className="space-y-3">
            {conditions.map((c, idx) => (
              <div key={c.id}>
                <ConditionBlock condition={c} onChange={updateCondition} onDelete={deleteCondition} />
                {idx < conditions.length - 1 && (
                  <div className="my-2 flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Operator</div>
                      <button onClick={() => toggleOperator(idx)} className="px-2 py-1 bg-gray-50 dark:bg-gray-900 rounded-md text-xs">{operators[idx] ?? 'AND'}</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div className="flex items-center justify-center">
              <button onClick={addCondition} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-sm">+ Add Another Condition</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
