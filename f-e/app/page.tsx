'use client';

import Image from "next/image";

import { useTheme } from "@/components/context/ThemeContext";
import ThemeToggleButton from "@/components/ui/ThemeToggleButton";
import CandleStickAnim from "@/components/ui/CandleStickAnim";
import { Button } from "@/components/ui/button"
import { AlertCircleIcon } from "lucide-react"
import { Alert, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";


export default function Home() {
	const { theme } = useTheme();

	// Determine logo and or/divider images based on theme
	const logoSrc = theme === 'dark' 
		? '/login/logo-v1-white.png'   // Use this image when theme is 'dark'
		: '/login/logo-v1.png'; // Use this image when theme is 'light'

	const orDividerSrc = theme === 'dark' 
		? '/login/or-line-light.png'   // Use this image when theme is 'dark'
		: '/login/or-line.png'; // Use this image when theme is 'light'
	
	// State for error message visibility and content (email validation)

	const [email, setEmail] = useState('');
	const [errorMessageTitle, setErrorMessageTitle] = useState('');
	const [showError, setShowError] = useState(false);

	function handleMagicLinkButtonClick() {
		console.log("Magic Link button clicked");

		// Check if the email state is empty (after trimming whitespace)
		if (email.trim() === '') {
			// --- CASE 1: EMPTY EMAIL ---
			setErrorMessageTitle("Please enter a valid email address.");
			setShowError(true);
			return; // Important: Exit the function if there is an error
		} 
		
		// 1. Hide any previous error message
		setShowError(false);
		setErrorMessageTitle(""); // Clear the title

		// 2. Perform advanced validation (e.g., check email format)
		if (!isValidEmail(email)) {
			setErrorMessageTitle("The email address provided is not valid.");
			setShowError(true);
			return; // Stop if format is invalid
		}
		
		// 3. If validation passes, proceed with the submission logic
		console.log(`Email is valid: ${email}. Proceeding to API call.`);
		// submitEmailForMagicLink(email);
	}

	// Helper function (you'd need to define this)
	function isValidEmail(email: string): boolean {
		// Simple regex check for validity
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	return (
		<div className={`${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white'} flex flex-col items-center justify-center lg:min-h-screen`}>

			{/* Desktop */}
			<div className={`hidden lg:block ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white'} `}>
				<CandleStickAnim></CandleStickAnim>

				<div className="w-full relative mx-auto" style={{ height: '0', paddingBottom: '20%', maxWidth: '300px' }}>
					<Image 
						src={logoSrc} 
						alt="Pivotal Logo No Desktop App"
						fill={true} 
						className="object-contain"
					/>
				</div>
				<b>This is currently only available for mobile devices at this time.</b>
			</div>

			{/* Mobile & Tablet - ADDED w-full, max-w-sm, mx-auto, and p-4 */}
			<div className="md:block lg:hidden w-full max-w-sm mx-auto p-4"> 

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
				<label className="block">
					<span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
						Email
					</span>
					<input 
						type="email" 
						value={email} // Added value binding
						onChange={(e: any) => {
							setEmail(e.target.value); 
							console.log(e.target.value);
							
							// Hide error immediately if user starts typing
							if (showError) setShowError(false);
						}}
						placeholder="you@example.com" 
						className="w-full p-3 mb-2 border border-gray-300 rounded-lg 
									focus:outline-none focus:ring-2 focus:ring-[#105B92] 
									focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
					/>
				</label>

				{/* Alert Box for Email Input */}
				<div 
					// Add transition and duration
					className={`
						transition-all duration-300 ease-in-out
						${showError ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
						overflow-hidden
					`}
				>
					<Alert className="mb-2" variant="destructive">
						{/* ... Alert content */}
						<AlertCircleIcon />
						<AlertTitle>{errorMessageTitle}</AlertTitle>
					</Alert>
				</div>

				{/* Magic Link Button */}
				<Button 
					onClick={handleMagicLinkButtonClick}
					className='text-white bg-[#105B92] w-full'>
					Send Magic Link
					</Button>

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