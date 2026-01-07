'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, Loader2, Plus } from 'lucide-react';

const PivyPage: React.FC = () => {
  // State to toggle between List and Slide views
  // true for Slide view, false for List view
  const [isEnabled, setIsEnabled] = useState(false); // Start with List view to show skeleton
  const [selectedYear, setSelectedYear] = useState('2023');
  const [selectedMonth, setSelectedMonth] = useState('January');
  const [selectedWeek, setSelectedWeek] = useState('1');
  const [loading, setLoading] = useState(true); // Set to true initially to show skeleton
  const [isSwitching, setIsSwitching] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(true);
  const [isAlertClosing, setIsAlertClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000); // Simulate loading for 2 seconds
    return () => clearTimeout(timer);
  }, []);

  // Sample data for PivyChats
  const pivyChats = [
    {
      title: 'This is a very long title that should test the maximum length for display purposes and see how it wraps.',
      date: '01/07/26',
      recentTime: '10:30 AM',
      messages: [
        { text: 'Hello, how are you?', sender: 'User', time: '10:25 AM' },
        { text: 'I\'m good, thanks!', sender: 'AI', time: '10:30 AM' },
      ],
    },
    {
      title: 'Weather Update',
      date: '01/06/26',
      recentTime: '5:15 PM',
      messages: [
        { text: 'What\'s the weather like?', sender: 'User', time: '5:10 PM' },
        { text: 'It\'s sunny today.', sender: 'AI', time: '5:15 PM' },
      ],
    },
    {
      title: 'Fun Time',
      date: '01/05/26',
      recentTime: '2:45 PM',
      messages: [
        { text: 'Tell me a joke.', sender: 'User', time: '2:40 PM' },
        { text: 'Why did the chicken cross the road? To get to the other side!', sender: 'AI', time: '2:45 PM' },
      ],
    },
  ];

  return (
    <div>
      <style>{`
        .custom-select option {
          color: #999;
        }
      `}</style>
      {/* Header */}
      <header className="bg-gray-100 dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center z-10 relative">
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
            onClick={() => {
              setIsSwitching(true);
              setTimeout(() => {
                setIsEnabled(!isEnabled);
                setIsSwitching(false);
              }, 1200);
            }}
          >
            View
          </button>
        </div>
      </header>

      {/* Message Alert */}
      {isAlertVisible && (
        <div className={`bg-yellow-100 dark:bg-yellow-900 p-4 border-b border-yellow-200 dark:border-yellow-700 flex justify-between items-center transform transition-transform duration-300 z-0 ${isAlertClosing ? '-translate-y-full' : 'translate-y-0'}`}>
          <p className="text-yellow-800 dark:text-yellow-200">Welcome to Pivy! Start a new conversation or browse existing chats.</p>
          <button 
            onClick={() => {
              setIsAlertClosing(true);
              setTimeout(() => setIsAlertVisible(false), 300);
            }}
            className="text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100 ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Views */}
      <main className="p-4">
        {isSwitching ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin w-8 h-8 text-gray-500" />
          </div>
        ) : (
          isEnabled ? (
            <div>
              <h2>Slide</h2>
              {/* Slide content */}
            </div>
          ) : (
            <div>
              <ul className="space-y-4">
                {pivyChats.map((chat, index) => (
                  <li key={index} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow cursor-pointer flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{chat.date}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{chat.recentTime}</span>
                      </div>
                      <h3 className="py-2 text-base font-semibold text-gray-900 dark:text-white mb-2">{chat.title}</h3>
                      <div className="space-y-1">
                        {chat.messages.slice(-1).map((msg, msgIndex) => (
                          <div key={msgIndex} className="text-sm">
                            <span className="font-medium">{msg.sender === 'AI' ? '🤖' : msg.sender + ':'}</span> {msg.text} <span className="text-xs text-gray-400">({msg.time})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 ml-4" />
                  </li>
                ))}
              </ul>
            </div>
          )
        )}
      </main>

      {/* Floating Button */}
      <div className="fixed bottom-28 right-4 z-50">
        <button 
          className="bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
          onClick={() => setIsDrawerOpen(true)}
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Drawer */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsDrawerOpen(false)}
      >
        <div 
          className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 p-4 rounded-t-lg shadow-lg z-50 transform transition-transform min-h-[50vh] ${isDrawerOpen ? 'translate-y-0' : 'translate-y-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">New Chat</h3>
            <button 
              onClick={() => setIsDrawerOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-300">Start a new conversation here.</p>
          {/* Add more content as needed */}
        </div>
      </div>
    </div>
  );
};

export default PivyPage;