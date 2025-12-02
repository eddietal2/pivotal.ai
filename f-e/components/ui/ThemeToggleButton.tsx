'use client'

import { useTheme } from '@/components/context/ThemeContext';

export default function ThemeToggleButton() {

    const { theme, toggleTheme } = useTheme();
    const handleToggle = () => {
        toggleTheme();
    };

    return (
        <div className="flex justify-center mt-6">
          <button 
            onClick={handleToggle} 
            // Position: Fixed, Top-Right corner
            className="fixed top-4 right-4 
                       p-3 rounded-full 
                       text-gray-900 dark:text-yellow-300 
                       bg-gray-100 dark:bg-gray-800 
                       shadow-lg transition-all duration-300 
                       hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/50"
                      aria-label={`Toggle to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  >
                      {theme === 'dark' ? (
                // Moon Icon (for Dark Theme)
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-moon">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                </svg>
                      ) : (
                // Sun Icon (for Light Theme)
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sun">
                    <circle cx="12" cy="12" r="4"/>
                    <path d="M12 2v2"/>
                    <path d="M12 20v2"/>
                    <path d="m4.93 4.93 1.41 1.41"/>
                    <path d="m17.66 17.66 1.41 1.41"/>
                    <path d="M2 12h2"/>
                    <path d="M20 12h2"/>
                    <path d="m6.34 17.66-1.41 1.41"/>
                    <path d="m19.07 4.93-1.41 1.41"/>
                </svg>
                      )}
          </button>
        </div>
    );
}