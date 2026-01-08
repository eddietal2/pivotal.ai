'use client';
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/context/ToastContext';

// Sample data for PivyChats (same as main page)
const pivyChats = [
  {
    title: 'This is a very long title that should test the maximum length for display purposes and see how it wraps.',
    date: '01/07/26',
    recentTime: '10:30 AM',
    messages: [
      { text: 'Hello, how are you?', sender: 'User', time: '10:25 AM' },
      { text: 'I\'m good, thanks!', sender: 'AI', time: '10:30 AM' },
      { text: 'That\'s great to hear. What\'s on your mind today?', sender: 'AI', time: '10:31 AM' },
      { text: 'I was thinking about the weather.', sender: 'User', time: '10:32 AM' },
      { text: 'The weather is nice today, sunny with a chance of clouds.', sender: 'AI', time: '10:33 AM' },
      { text: 'Sounds perfect for a walk.', sender: 'User', time: '10:34 AM' },
      { text: 'Absolutely! Do you have any plans?', sender: 'AI', time: '10:35 AM' },
      { text: 'Maybe later. What about you?', sender: 'User', time: '10:36 AM' },
      { text: 'I\'m here to chat whenever you need.', sender: 'AI', time: '10:37 AM' },
      { text: 'That\'s helpful. Tell me a fun fact.', sender: 'User', time: '10:38 AM' },
      { text: 'Did you know octopuses have three hearts?', sender: 'AI', time: '10:39 AM' },
      { text: 'Wow, that\'s interesting!', sender: 'User', time: '10:40 AM' },
      { text: 'Nature is full of surprises.', sender: 'AI', time: '10:41 AM' },
      { text: 'What\'s your favorite animal?', sender: 'User', time: '10:42 AM' },
      { text: 'I don\'t have favorites, but I like all of them!', sender: 'AI', time: '10:43 AM' },
      { text: 'Fair enough. How about technology?', sender: 'User', time: '10:44 AM' },
      { text: 'Tech is fascinating. What interests you?', sender: 'AI', time: '10:45 AM' },
      { text: 'AI and machine learning.', sender: 'User', time: '10:46 AM' },
      { text: 'That\'s my world! What would you like to know?', sender: 'AI', time: '10:47 AM' },
      { text: 'How does AI learn?', sender: 'User', time: '10:48 AM' },
      { text: 'Through data and algorithms, basically.', sender: 'AI', time: '10:49 AM' },
    ],
  },
  {
    title: 'Weather Update',
    date: '01/06/26',
    recentTime: '5:15 PM',
    messages: [
      { text: 'What\'s the weather like?', sender: 'User', time: '5:10 PM' },
      { text: 'It\'s sunny today.', sender: 'AI', time: '5:15 PM' },
      { text: 'Will it rain tomorrow?', sender: 'User', time: '5:16 PM' },
      { text: 'There\'s a 20% chance of rain tomorrow.', sender: 'AI', time: '5:17 PM' },
    ],
  },
  {
    title: 'Fun Time',
    date: '01/05/26',
    recentTime: '2:45 PM',
    messages: [
      { text: 'Tell me a joke.', sender: 'User', time: '2:40 PM' },
      { text: 'Why did the chicken cross the road? To get to the other side!', sender: 'AI', time: '2:45 PM' },
      { text: 'That\'s hilarious!', sender: 'User', time: '2:46 PM' },
      { text: 'Glad you liked it. Want another one?', sender: 'AI', time: '2:47 PM' },
    ],
  },
];

const PivyChatInstancePage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { showToast } = useToast();

  const mainRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (mainRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = mainRef.current;
      const scrolledFromBottom = scrollHeight - scrollTop - clientHeight;
      const threshold = clientHeight * 0.1; // 10% from bottom
      setShowScrollButton(scrolledFromBottom > threshold);
    }
  };

  const chatIndex = parseInt(id);
  const chat = pivyChats[chatIndex];

  const handleSend = () => {
    if (inputValue.trim()) {
      const newMessage = {
        text: inputValue,
        sender: 'User',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, newMessage]);
      setInputValue('');
    }
  };

   useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setLoading(false), 2000); // Simulate loading for 2 seconds
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const element = mainRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll);
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    if (chat) {
      setMessages(chat.messages);
    }
  }, [chat]);

  useLayoutEffect(() => {
    if (!loading && messages.length > 0) {
      mainRef.current?.scrollTo({ top: mainRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [loading, messages]);


  if (!chat) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Chat Not Found</h1>
          <Link href="/pivy" className="text-blue-500 hover:text-blue-700">
            Back to Pivy
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transform transition-all duration-500 overflow-hidden ${mounted && !isExiting ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
      <div className="absolute inset-0 bg-gray-50 dark:bg-gray-900 z-[-1]"></div>
      
      {/* Header */}
      <header className="bg-gray-100 dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
        <button 
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/pivy');
              }
            }, 500);
          }}
          className="mr-4 p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {loading ? (
          <div className="flex-1 animate-pulse">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-1"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
          </div>
        ) : (
          <div className="flex-1">
            <h1 className="text-xl text-gray-500 dark:text-gray-400">🤖 {chat.date}</h1>
            <p className="text-xs text-gray-900 dark:text-white">{chat.title}</p>
          </div>
        )}
      </header>

      {/* Chat Messages */}
      <main ref={mainRef} className="p-4 max-w-4xl mx-auto h-[calc(100vh-8rem)] overflow-y-auto">
        {loading ? (
            // Skeleton for chat messages
          <div className="space-y-4">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className={`flex ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className="w-full h-12 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'User' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.sender === 'User'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow'
                }`}>
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.sender === 'User' ? 'text-blue-200' : 'text-gray-400'}`}>
                    {msg.time}
                  </p>

                  {/* AI message toolbar (Copy, future actions) */}
                  {msg.sender !== 'User' && (
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                              await navigator.clipboard.writeText(msg.text);
                            } else {
                              const el = document.createElement('textarea');
                              el.value = msg.text;
                              document.body.appendChild(el);
                              el.select();
                              document.execCommand('copy');
                              document.body.removeChild(el);
                            }
                            setCopiedIndex(index);
                            showToast('Message copied to clipboard', 'success', 2000);
                            setTimeout(() => setCopiedIndex(null), 2000);
                          } catch (err) {
                            showToast('Could not copy message', 'error', 3000);
                          }
                        }}
                        title="Copy message"
                        aria-label={`Copy message ${index}`}
                        className="flex items-center gap-2 px-2 py-1 rounded-md text-xs text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {copiedIndex === index ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedIndex === index ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {/* Bottom Buttons */}
            <div className="flex justify-center mt-12 border-t border-gray-300 dark:border-gray-700 pt-4 mt-4">
              <button
                onClick={() => {
                  setIsExiting(true);
                  setTimeout(() => router.push('/pivy'), 500);
                }}
                className="w-full mb-32 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Input Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Send
          </button>
        </div>
      </footer>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <button
          onClick={() => mainRef.current?.scrollTo({ top: mainRef.current.scrollHeight, behavior: 'smooth' })}
          className="fixed bottom-24 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-10"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}    </div>
  );
};

export default PivyChatInstancePage;