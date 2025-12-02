'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

// 1. Create the Context object
type ThemeContextType = {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Custom Hook to use the Theme context anywhere in the application.
 * Returns the current theme ('light' or 'dark'), and the function to toggle it.
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// 2. The Provider Component
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize state based on system preference (client-side only)
  const [theme, setTheme] = useState<'light' | 'dark'>('light'); // Default to light

  // Effect runs only once after component mounts on the client
  useEffect(() => {
    // Check if the user has a dark mode preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Set initial theme
    const initialTheme: 'light' | 'dark' = mediaQuery.matches ? 'dark' : 'light';
    setTheme(initialTheme);
    
    // Listen for changes in system preference
    const listener = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', listener);

    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Function to manually toggle the theme
  const toggleTheme = () => {
    setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'));
  };

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo<ThemeContextType>(() => ({ theme, toggleTheme }), [theme]);

  // Apply the theme class to the <html> or <body> element 
  // so Tailwind CSS can automatically pick it up.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);
  

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};