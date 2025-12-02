'use client';

import Image from "next/image";
import CandleStickAnim from "@/components/ui/CandleStickAnim";
import { useTheme } from "@/components/context/ThemeContext";

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  // Define the logo source based on the current theme state
  const logoSrc = theme === 'dark' 
    ? '/logo-dark.png'   // Use this image when theme is 'dark'
    : '/logo-light.png'; // Use this image when theme is 'light'
  
  // DEV: Function to manually toggle the theme (useful for testing)
  const handleToggle = () => {
    toggleTheme();
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      
      {/* DEV: Theme Toggle Button for manual testing */}
      <button 
        onClick={handleToggle} 
        className="p-2 m-4 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
      >
        Current Theme: {theme}
      </button>

      <CandleStickAnim></CandleStickAnim>
      
      <Image 
        src={logoSrc} 
        width={200}
        height={100}
        alt="Pivotal Logo"
      />
      
      <h3 className={`min-h-screen ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Whaddup Doe</h3>
    </div>
  );
}
