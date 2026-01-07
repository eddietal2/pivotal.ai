'use client';

import React, { useState, useEffect } from 'react';

const PivyPage: React.FC = () => {
  // State to toggle between List and Slide views
  // true for Slide view, false for List view
  const [isEnabled, setIsEnabled] = useState(true); // Start with List view to show skeleton
  const [selectedYear, setSelectedYear] = useState('2023');
  const [selectedMonth, setSelectedMonth] = useState('January');
  const [selectedWeek, setSelectedWeek] = useState('1');
  const [loading, setLoading] = useState(true); // Set to true initially to show skeleton

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000); // Simulate loading for 2 seconds
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <style>{`
        .custom-select option {
          color: #999;
        }
      `}</style>
      {/* Header */}
      <header className="bg-gray-100 dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-xs font-medium rounded">
            {/* {isEnabled ? 'List' : 'Slide'} */}
            {isEnabled ? 'YR/MN' : 'WK/MN'}
          </span>
          {isEnabled ? (
            // List View Selection
            <>
              <section className="flex-1 min-w-[60px]">
                {loading ? (
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 animate-pulse rounded"></div>
                ) : (
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="custom-select w-full text-md font-semibold text-gray-900 dark:text-white bg-transparent border-none outline-none"
                  >
                    <option value="2025">2026</option>
                  </select>
                )}
              </section>
              <section className="flex-1 min-w-[80px]">
                {loading ? (
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 animate-pulse rounded"></div>
                ) : (
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="custom-select w-full text-md font-semibold text-black dark:text-white bg-transparent border-none outline-none"
                  >
                    <option value="January">January</option>
                    <option value="February">February</option>
                    <option value="March">March</option>
                    <option value="April">April</option>
                    <option value="May">May</option>
                    <option value="June">June</option>
                    <option value="July">July</option>
                    <option value="August">August</option>
                    <option value="September">September</option>
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                  </select>
                )}
              </section>
            </>
          ) : (
            // Slide View Selection
            <>
              <section className="flex-1 min-w-[60px]">
                {loading ? (
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 animate-pulse rounded"></div>
                ) : (
                  <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                    className="custom-select w-full text-md font-semibold text-gray-900 dark:text-white bg-transparent border-none outline-none"
                  >
                    {Array.from({ length: 52 }, (_, i) => (
                      <option key={i + 1} value={(i + 1).toString()}>Week {i + 1}</option>
                    ))}
                  </select>
                )}
              </section>
              <section className="flex-1 min-w-[80px]">
                {loading ? (
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 animate-pulse rounded"></div>
                ) : (
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="custom-select w-full text-md font-semibold text-black dark:text-white bg-transparent border-none outline-none"
                  >
                    <option value="January">January</option>
                    <option value="February">February</option>
                    <option value="March">March</option>
                    <option value="April">April</option>
                    <option value="May">May</option>
                    <option value="June">June</option>
                    <option value="July">July</option>
                    <option value="August">August</option>
                    <option value="September">September</option>
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                  </select>
                )}
              </section>
            </>
          )}
        </div>
        <div className="flex items-center">
          <button 
            className="px-4 sm:ml-2 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => setIsEnabled(!isEnabled)}
          >
            View
          </button>
        </div>
      </header>

      {/* Views */}
      <main className="p-4">
        {isEnabled ? (
          <div>
            <h2>Slide</h2>
            {/* Slide content */}
          </div>
        ) : (
          <div>
            <h2>List (view)</h2>
            {/* List content */}
          </div>
        )}
      </main>
    </div>
  );
};

export default PivyPage;