'use client';

import Image from "next/image";

import { useTheme } from "@/components/context/ThemeContext";
import CandleStickAnim from "@/components/ui/CandleStickAnim";
import { Button } from "@/components/ui/button"

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  // Define the logo source based on the current theme state
  const logoSrc = theme === 'dark' 
    ? '/login/logo-v1-white.png'   // Use this image when theme is 'dark'
    : '/login/logo-v1.png'; // Use this image when theme is 'light'

  const orDividerSrc = theme === 'dark' 
    ? '/login/or-line-light.png'   // Use this image when theme is 'dark'
    : '/login/or-line.png'; // Use this image when theme is 'light'
  
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
      
      <h3 className={`${theme === 'dark' ? 'text-white' : 'text-black'}`}>Sign in to your account</h3>

      <label>
        Email
        <br />
        <input type="email" placeholder="Text"/>
      </label>
      
      <br />
      <Button className='text-white bg-[#105B92]'>Send Magic Link</Button>

      <Image 
        src={orDividerSrc} 
        width={200}
        height={100}
        alt="Or Divider"
      />

      <Button 
        className={`${theme === 'dark' ? 'text-white bg-[#222]' : 'text-black bg-[#D9D9D9]'}`}>
          <Image 
            width={15}
            height={7}
            src="/icons/google-icon.png" 
            alt="Google Icon">
          </Image>
          Google Sign-In
        </Button>

    </div>
  );
}
