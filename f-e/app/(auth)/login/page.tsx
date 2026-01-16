'use client';

import Image from "next/image";
import { useState, useEffect } from "react";
import { AlertCircleIcon, Mail, Lock, Loader2 } from "lucide-react";

import { useTheme } from "@/components/context/ThemeContext";
import { useToast } from '@/components/context/ToastContext';
import ThemeToggleButton from "@/components/ui/ThemeToggleButton";
import CandleStickAnim from "@/components/ui/CandleStickAnim";
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { redirectTo } from '@/lib/redirect';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://pivotalai-production.up.railway.app';
// Use window.location.origin in browser, fallback for SSR
const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
        return process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    }
    return process.env.NEXT_PUBLIC_BASE_URL || 'https://pivotal-ai-web-app.vercel.app';
};
const MAGIC_LINK_API_ENDPOINT = `${BACKEND_URL}/auth/magic-link`;

// Helper function (moved the regex outside for efficiency)
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Helper function to simulate logging only in development/not in test environment
const log = (...args: any[]) => {
    if (process.env.NODE_ENV !== 'test') {
        console.log(...args);
    }
};

export default function LoginPage() {
    const { theme } = useTheme();

    const [email, setEmail] = useState('');
    const [errorMessageTitle, setErrorMessageTitle] = useState('');
    const [showError, setShowError] = useState(false);
    const [successMessage, setSuccessMessage] = useState(''); // New state for success
    const [isSubmitting, setIsSubmitting] = useState(false); // New state for loading/submitting
    const { showToast } = useToast();

    // Check if user is already authenticated on mount
    useEffect(() => {
        // First check for magic link callback params in URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const urlEmail = urlParams.get('email');
        const userId = urlParams.get('user_id');
        const username = urlParams.get('username');
        
        if (token && urlEmail) {
            // User clicked magic link - store auth data and redirect
            log('Magic link authentication detected');
            
            const userData = {
                id: userId,
                email: urlEmail,
                username: username || ''
            };
            
            localStorage.setItem('auth_token', token);
            localStorage.setItem('user', JSON.stringify(userData));
                        // Persist a toast message so it can be shown on the Home page after redirect — include the user's name if available
                        try { 
                            const name = username || (urlEmail ? urlEmail.split('@')[0] : '');
                            localStorage.setItem('post_login_toast', JSON.stringify({ message: name ? `Welcome back, ${name}!` : 'Successfully logged in', type: 'success', duration: 6000 })); 
                        } catch (e) { /* ignore in tests */ }
            
            log('Auth data stored, redirecting to home...');
            redirectTo(`${getBaseUrl()}/home`);
            return;
        }
        
        // Check if user is already authenticated
        const user = localStorage.getItem('user');
        const existingToken = localStorage.getItem('auth_token');
        
        if (user && existingToken) {
            log('User already authenticated, redirecting to home...');
            redirectTo(`${getBaseUrl()}/home`);
        }
    }, []); // Empty dependency array [] ensures this runs only once on mount

    // Determine logo and or/divider images based on theme
    const logoSrc = theme === 'dark' 
        ? '/login/logo-v1-white.png'
        : '/login/logo-v1.png';

    const orDividerSrc = theme === 'dark' 
        ? '/login/or-line-light.png'
        : '/login/or-line.png';

    const handleMagicLinkSubmit = async () => {
        log("Magic Link button clicked");

        // 1. Reset states
        setShowError(false);
        setErrorMessageTitle('');
        setSuccessMessage('');

        // 2. Validation Checks
        const trimmedEmail = email.trim();
        if (trimmedEmail === '') {
            setErrorMessageTitle("Please enter your email address.");
            setShowError(true);
            return;
        } 
        
        if (!isValidEmail(trimmedEmail)) {
            setErrorMessageTitle("The email address provided is not valid.");
            setShowError(true);
            return;
        }
        
        // 3. Start Submission
        setIsSubmitting(true);
        log(`Email is valid: ${trimmedEmail}. Submitting to API.`);

        try {
            // THE CRITICAL API CALL IMPLEMENTATION
            const response = await fetch(MAGIC_LINK_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: trimmedEmail }),
            });

            if (response.ok) {
                // Success: Parse response data
                const data = await response.json().catch(() => ({}));
                
                // Update success message
                setSuccessMessage(
                    data.message || `Magic link sent! Check your email.`
                );
                
                // Store authentication data if user info is provided
                if (data.user) {
                    // Store user data in localStorage for persistence across pages
                    localStorage.setItem('user', JSON.stringify(data.user));
                    log('User data stored in localStorage');
                }
                
                // If the server returns a redirect_url: persist the toast and redirect
                if (data.redirect_url) {
                    const token = data.token || data.access_token;
                    if (token) {
                        localStorage.setItem('auth_token', token);
                        log('Authentication token stored');
                    }
                                        // Persist toast for next page after redirect (include user's name if present)
                                        try {
                                            const userName = data.user?.username || data.user?.first_name || (data.user?.email ? data.user.email.split('@')[0] : '');
                                            localStorage.setItem('post_login_toast', JSON.stringify({ message: userName ? `Welcome back, ${userName}!` : (data.message || 'Successfully logged in'), type: 'success', duration: 6000 }));
                                        } catch (e) { /* ignore */ }
                }
                // If token was returned without a redirect, store it and show toast on the current page
                else if (data.token || data.access_token) {
                    const token = data.token || data.access_token;
                    localStorage.setItem('auth_token', token);
                    log('Authentication token stored');
                    try { showToast(data.message || 'Successfully logged in', 'success', 4000); } catch (e) { /* ignore in tests */ }
                }
                
                // If redirect_url is provided, redirect the user
                if (data.redirect_url) {
                    log(`Redirecting to: ${data.redirect_url}`);
                    redirectTo(data.redirect_url);
                }
            } else {
                // Error: Handle non-200 responses
                const errorData = await response.json().catch(() => ({ message: 'Server error' }));
                setErrorMessageTitle(errorData.message || 'An unexpected error occurred. Please try again.');
                setShowError(true);
            }
        } catch (error) {
            // Network error
            log("Network or API submission error:", error);
            setErrorMessageTitle('Failed to connect to the sign-in service. Check your internet connection.');
            setShowError(true);
        } finally {
            // Always stop loading, unless success message is set (form should be locked on success)
            if (!successMessage) { 
                 setIsSubmitting(false);
            }
        }
    }
	 // Google OAuth Sign-In Handler
	const GOOGLE_AUTH_REDIRECT_URL = `${BACKEND_URL}/auth/google-oauth`; 
    const handleGoogleSignIn = () => {
        // Redirect to the Django/backend Google OAuth endpoint via helper
        redirectTo(GOOGLE_AUTH_REDIRECT_URL);
        log("Google Sign-In button clicked - Redirecting to Google OAuth endpoint.");
    }

    // Determine the message and variant for the displayed Alert
    const displayMessage = successMessage || errorMessageTitle;
    const alertVariant = successMessage ? 'default' : 'destructive';
    const alertIcon = successMessage ? <Mail className="h-5 w-5" /> : <AlertCircleIcon className="h-5 w-5" />;

    return (
        <div className={`${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white'} flex flex-col items-center justify-center lg:min-h-screen font-sans`}>

            {/* Mobile & Tablet Login Card */}
            <div className="w-full max-w-sm mx-auto p-6 bg-transparent"> 

                {/* Theme Toggle Button */}
                <div className="flex justify-end mb-4">
                    <ThemeToggleButton />
                </div>
                
                {/* Illustration */}
                <CandleStickAnim />

                {/* Logo */}
                <div className="w-full relative mx-auto" style={{ height: '0', paddingBottom: '20%', maxWidth: '300px' }}>
                    <Image 
                        src={logoSrc} 
                        alt="Pivotal Logo"
                        fill={true} 
                        className="object-contain"
                        priority
                    />
                </div>

                {/* Sign In Heading */}
                <h3 className={`text-2xl font-bold text-center my-8 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Sign in to your account
                </h3>

                {/* Alert Box for Messages (Error or Success) */}
                <div 
                    data-testid="alert-box"
                    className={`
                        transition-all duration-300 ease-in-out mb-4
                        ${(showError || successMessage) ? 'max-h-screen opacity-100 p-1' : 'max-h-0 opacity-0'}
                        overflow-hidden
                    `}
                >
                    {(showError || successMessage) && (
                        <Alert variant={alertVariant} className="flex items-start space-x-3 rounded-lg shadow-md">
                            <div className={`flex-shrink-0 mt-0.5 ${successMessage ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                                {alertIcon}
                            </div>
                            <div className="flex-grow">
                                <AlertTitle className={`text-base font-semibold ${successMessage ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                                    {successMessage ? 'Login Link Sent' : 'Validation Error'}
                                </AlertTitle>
                                <AlertDescription className={`text-sm ${successMessage ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                                    {displayMessage}
                                </AlertDescription>
                            </div>
                        </Alert>
                    )}
                </div>


                {/* Email Input */}
                <label className="block space-y-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                        Email Address
                    </span>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value); 
                            // Clear error/success messages immediately when user starts typing
                            setShowError(false);
                            setSuccessMessage('');
                        }}
                        placeholder="you@example.com" 
                        disabled={isSubmitting || !!successMessage} // Disable while submitting or on success
                        className="w-full p-3 border border-gray-300 rounded-lg 
                                   focus:outline-none focus:ring-2 focus:ring-[#105B92] 
                                   focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        data-testid="email-input"
                    />
                </label>

                {/* Magic Link Button */}
                <Button 
                    onClick={handleMagicLinkSubmit}
                    disabled={isSubmitting || !!successMessage} // Disable while submitting or on success
                    className='text-white bg-[#105B92] hover:bg-[#0c4770] w-full mt-4 transition-all duration-200'
                    data-testid="magic-link-button"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                        </>
                    ) : (
                        <>
                            <Lock className="h-4 w-4 mr-2" />
                            Send Magic Link
                        </>
                    )}
                </Button>

                {/* OR Divider */}
                <div className="relative w-full h-8 my-4 flex items-center justify-center"> 
                    <Image 
                        className="object-contain" 
                        src={orDividerSrc} 
                        alt="Or Divider"
                        fill={true} 
                    />
                </div>

                {/* Google Sign-In Button */}
                <Button 
                    onClick={handleGoogleSignIn}
                    disabled={isSubmitting || !!successMessage} // Disable while submitting or on success
                    className={`w-full hover:shadow-lg hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-700 transition-all duration-200 
                                ${theme === 'dark' ? 'text-white bg-[#222] hover:bg-[#333]' : 'text-gray-800 bg-[#D9D9D9] hover:bg-[#c9c9c9]'}`}
                    data-testid="google-sign-in-button"
                >
                    {/* Using an external public SVG for Google icon for better compatibility */}
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor"><path d="M22.04 12.01c0-.75-.07-1.46-.21-2.14h-9.83v4.06h5.5c-.24 1.25-.97 2.37-2.07 3.16v2.64h3.4a9.922 9.922 0 0 0 3.17-7.72z" fill="#4285F4"/><path d="M12 22a9.92 9.92 0 0 0 6.89-2.52l-3.4-2.64c-.93.63-2.11 1.01-3.49 1.01-2.67 0-4.94-1.78-5.74-4.18H2.76v2.75a9.998 9.998 0 0 0 9.24 5.48z" fill="#34A853"/><path d="M6.26 13.91c-.13-.38-.21-.78-.21-1.2s.08-.82.21-1.2V9.96H2.76A9.997 9.997 0 0 0 2.01 12c0 .76.13 1.5.34 2.18l3.91-3.04z" fill="#FBBC04"/><path d="M12 4.16c1.69 0 3.2.58 4.4 1.72l3.03-3.03C17.76 1.85 15.05 1 12 1A9.998 9.998 0 0 0 2.76 4.88l3.49 2.75C7.06 5.94 9.33 4.16 12 4.16z" fill="#EA4335"/></svg>
                    Sign in with Google
                </Button>
            </div>

        </div>
    );
}
