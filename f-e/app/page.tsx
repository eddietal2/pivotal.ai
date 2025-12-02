'use client';

import Image from "next/image";

import { useTheme } from "@/components/context/ThemeContext";
import ThemeToggleButton from "@/components/ui/ThemeToggleButton";
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
  

  return (
    <div className={`${theme === 'dark' ? 'bg-black' : 'bg-white'} flex flex-col items-center justify-center`}>

      {/* Desktop */}
      <div className={`mt-32 hidden lg:block ${theme === 'dark' ? 'bg-black' : 'bg-white'} `}>
        <CandleStickAnim></CandleStickAnim>

        <div className="w-full relative mx-auto" style={{ height: '0', paddingBottom: '20%', maxWidth: '300px' }}>
          <Image 
              src={logoSrc} 
              alt="Pivotal Logo No Desktop App"
              fill={true} 
              className="object-contain"
          />
        </div>
        <b>This is currently only designed for mobile and tablet screens.</b>
      </div>

      {/* Mobile & Tablet */}
      <div className="p-4 md:block lg:hidden">

        {/* Light/Dark Mode */}
        <ThemeToggleButton></ThemeToggleButton>
        
        {/* Illustration */}
        <CandleStickAnim></CandleStickAnim>

        {/* Logo */}
        <div className="w-full relative mx-auto" style={{ height: '0', paddingBottom: '20%', maxWidth: '300px' }}>
          <Image 
              src={logoSrc} 
              alt="Pivotal Logo"
              fill={true} 
              className="object-contain"
          />
        </div>

        {/* Sign In Heading */}
        <h3 className={`text-xl text-center my-8 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Sign in to your account.</h3>

        {/* Email Input */}
        <label className="">
           <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
        Email
           </span>
           <input 
               type="email" 
               placeholder="you@example.com" 
               className="w-full p-3 mb-2 border border-gray-300 rounded-lg 
                          focus:outline-none focus:ring-2 focus:ring-[#105B92] 
                          focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
           />
        </label>

        {/* Magic Link Button */}
        <Button className='text-white bg-[#105B92] w-full'>Send Magic Link</Button>

        {/* OR Divider */}
        <div className="relative w-full h-8 my-4"> 
          <Image 
              className="object-contain" // Ensures the image scales properly within the container
              src={orDividerSrc} 
              alt="Or Divider"
              fill={true} 
          />
        </div>

        {/* Google Sign-In Button */}
        <Button 
          className={`w-full ${theme === 'dark' ? 'text-white bg-[#222]' : 'text-black bg-[#D9D9D9]'}`}>
            <Image 
              width={15}
              height={7}
              src="/icons/google-icon.png" 
              alt="Google Icon">
            </Image>
          Google Sign-In
        </Button>
      </div>

    </div>
  );
}
