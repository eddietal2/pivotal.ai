'use client';
import React, { useState, useEffect } from 'react';
import { ChevronRight, Loader2, Plus, Settings, ChevronDown, Layout } from 'lucide-react';
import SlideViewIllustration from '../../components/illustrations/SlideViewIllustration';
import ListViewIllustration from '../../components/illustrations/ListViewIllustration';
import CandleStickAnim from '../../components/ui/CandleStickAnim';

const PivyPage: React.FC = () => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // State to toggle between List and Slide views
  // true for Slide view, false for List view
  const [isSlideView, setIsSlideView] = useState(false); // Start with List view to show skeleton
  const [selectedYear, setSelectedYear] = useState(2023);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [loading, setLoading] = useState(true); // Set to true initially to show skeleton
  const [isSwitching, setIsSwitching] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(true);
  const [isAlertClosing, setIsAlertClosing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [viewModeExpanded, setViewModeExpanded] = useState(false);
  const [notificationsExpanded, setNotificationsExpanded] = useState(false);
  const [timeframeExpanded, setTimeframeExpanded] = useState(false);
  const [timeframeType, setTimeframeType] = useState('month');

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
        <div className="flex gap-2 items-center">
          <div className="w-[30px] h-[30px] relative bottom-6.5 mr-2">
            <CandleStickAnim />
          </div>
          <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-sm font-medium rounded">
            {timeframeType === 'week' ? `Week ${selectedWeek}, ${months[selectedMonth - 1]}` : `${months[selectedMonth - 1]}, ${selectedYear}`}
          </span>
        </div>
        <div>
          <button 
            onClick={() => {
              setIsDrawerOpen(true);
              setViewModeExpanded(true);
            }}
            className="p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <Layout className="w-4 h-4" />
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
          isSlideView ? (
            <div>
              <h2>Slide</h2>
              {/* Slide content */}
            </div>
          ) : (
            <div>
              <ul className="space-y-4">
                {loading ? (
                  // Skeleton for PivyChats
                  Array.from({ length: 3 }, (_, index) => (
                    <li key={index} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                      <div className="flex-1 animate-pulse">
                        <div className="flex justify-between items-center mb-2">
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                        </div>
                        <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                        <div className="space-y-1">
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  pivyChats.map((chat, index) => (
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
                  ))
                )}
              </ul>
            </div>
          )
        )}
      </main>

      {/* Floating Button */}
      {!isDrawerOpen && (
        <div className="fixed bottom-28 right-4 z-50">
          <button 
            className="bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
            onClick={() => setIsDrawerOpen(true)}
          >
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      {/* Bottom Drawer */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[99] transition-opacity ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsDrawerOpen(false)}
      >
        <div 
          className={`fixed inset-0 bg-white/80 dark:bg-gray-800/20 backdrop-blur-lg shadow-lg z-[100] transform transition-transform ${isDrawerOpen ? 'translate-y-0' : 'translate-y-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4">

              {/* Header of Bottom Drawer */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-lg font-semibold">Pivy Chat Settings</h3>
                </div>
                <div className="flex gap-2">
                  {(timeframeExpanded ? 1 : 0) + (viewModeExpanded ? 1 : 0) + (notificationsExpanded ? 1 : 0) > 0 && (
                    <button 
                      onClick={() => {
                        setTimeframeExpanded(false);
                        setViewModeExpanded(false);
                        setNotificationsExpanded(false);
                      }}
                      className="px-2 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                    >
                      Collapse All
                    </button>
                  )}
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Timeframe */}
              <button 
                className='text-2xl mt-4 flex items-center justify-between w-full text-left'
                onClick={() => setTimeframeExpanded(!timeframeExpanded)}
              >
                <h3>Timeframe</h3>
                <ChevronDown className={`w-5 h-5 transition-transform ${timeframeExpanded ? 'rotate-180' : ''}`} />
              </button>
              {timeframeExpanded && (
                <div className="mt-2">
                  <div className="mt-4 flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                    <button 
                      className={`flex-1 h-10 py-2 px-4 rounded-md transition-colors ${timeframeType === 'week' ? 'bg-amber-900 dark:bg-amber-800 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                      onClick={() => {
                        setTimeframeType('week');
                        setIsSlideView(true);
                      }}
                    >
                      Week
                    </button>
                    <button 
                      className={`flex-1 h-10 py-2 px-4 rounded-md transition-colors ${timeframeType === 'month' ? 'bg-amber-900 dark:bg-amber-800 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                      onClick={() => {
                        setTimeframeType('month');
                        setIsSlideView(false);
                      }}
                    >
                      Month
                    </button>
                  </div>
                  <div className="mt-4">
                    {timeframeType === 'week' ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-lg">Current Week {selectedWeek} of {months[selectedMonth - 1]}</span>
                        <select 
                          value={selectedWeek} 
                          onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                          className="bg-gray-200 dark:bg-gray-700 rounded px-2 py-1"
                        >
                          {Array.from({length: 5}, (_, i) => (
                            <option key={i+1} value={i+1}>{i+1}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-lg">Current Month: {months[selectedMonth - 1]} {selectedYear}</span>
                        <input 
                          type="month" 
                          value={`${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`} 
                          onChange={(e) => {
                            const [year, month] = e.target.value.split('-');
                            setSelectedYear(parseInt(year));
                            setSelectedMonth(parseInt(month));
                          }}
                          className="bg-gray-200 dark:bg-gray-700 rounded px-2 py-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}


              {/* View Mode */}
              <button 
                className='text-2xl mt-4 pt-2 border-t border-gray-300 dark:border-gray-700 flex items-center justify-between w-full text-left'
                onClick={() => setViewModeExpanded(!viewModeExpanded)}
              >
                <h3>View Mode</h3>
                <ChevronDown className={`w-5 h-5 transition-transform ${viewModeExpanded ? 'rotate-180' : ''}`} />
              </button>
              {viewModeExpanded && (
                <div className="mt-2">
                  <div className="mt-4 flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                    <button 
                      className={`flex-1 h-10 py-2 px-4 rounded-md transition-colors ${!isSlideView ? 'bg-amber-900 dark:bg-amber-800 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                      onClick={() => {
                        setIsSlideView(false);
                        setTimeframeType('month');
                        setIsSwitching(true);
                        setIsDrawerOpen(false);
                        setTimeout(() => setIsSwitching(false), 1200);
                      }}
                      disabled={isSwitching}
                    >
                      {isSwitching ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : 'List'}
                    </button>
                    <button 
                      className={`flex-1 h-10 py-2 px-4 rounded-md transition-colors ${isSlideView ? 'bg-amber-900 dark:bg-amber-800 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                      onClick={() => {
                        setIsSlideView(true);
                        setTimeframeType('week');
                        setIsSwitching(true);
                        setIsDrawerOpen(false);
                        setTimeout(() => setIsSwitching(false), 1200);
                      }}
                      disabled={isSwitching}
                    >
                      {isSwitching ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : 'Slide'}
                    </button>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    <div className='h-2'></div>
                    <b>Slide View</b>: Shows chats in Week/Month format. You'll be able to see all chats in a given week - 5 slides per trading day a week.
                    <div>
                      <SlideViewIllustration />
                    </div>
                    <b>List View</b>: Shows chats in Month/Year format. You'll be able to see all chats in a given month - around 20 trading days a month in a list, maximum.
                    <div>
                      <ListViewIllustration />
                    </div>
                  </p>
                </div>
              )}

              {/* Notifications */}
              <button 
                className='text-2xl mt-4 pt-2 border-t border-gray-300 dark:border-gray-700 flex items-center justify-between w-full text-left'
                onClick={() => setNotificationsExpanded(!notificationsExpanded)}
              >
                <h3>Notifications</h3>
                <ChevronDown className={`w-5 h-5 transition-transform ${notificationsExpanded ? 'rotate-180' : ''}`} />
              </button>
              {notificationsExpanded && (
                <div className="mt-2">
                  <p className="text-gray-600 dark:text-gray-300">Each trading day's Pivy Chat will send chat notifications throughout the day.</p>
                  <div className="mt-4 flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                    <button 
                      className={`flex-1 h-10 py-2 px-4 rounded-md transition-colors ${notificationsEnabled ? 'bg-amber-900 dark:bg-amber-800 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                      onClick={() => setNotificationsEnabled(true)}
                    >
                      On
                    </button>
                    <button 
                      className={`flex-1 h-10 py-2 px-4 rounded-md transition-colors ${!notificationsEnabled ? 'bg-amber-900 dark:bg-amber-800 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                      onClick={() => setNotificationsEnabled(false)}
                    >
                      Off
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Close button of Bottom Drawer */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 w-full py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PivyPage;