'use client';

import { useTheme } from '@/components/context/ThemeContext';
import { useToast } from '@/components/context/ToastContext';
import { Sun, Moon, Bell, BellOff, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { redirectTo } from '@/lib/redirect';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  
  // Username state
  const [currentUsername, setCurrentUsername] = useState('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccessMessage, setUsernameSuccessMessage] = useState('');

  // Check authentication and load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      setLoadError('');
      
      try {
        // Check if user is returning from email verification
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');
        const emailFromUrl = urlParams.get('email');
        const userIdFromUrl = urlParams.get('user_id');
        const usernameFromUrl = urlParams.get('username');
        const emailUpdated = urlParams.get('email_updated');
        
        if (tokenFromUrl && emailFromUrl && userIdFromUrl) {
          // User just verified email change - update localStorage with new data
          localStorage.setItem('auth_token', tokenFromUrl);
          localStorage.setItem('user', JSON.stringify({
            id: userIdFromUrl,
            email: emailFromUrl,
            username: usernameFromUrl || ''
          }));
          
          // Show success toast notification
          if (emailUpdated === 'true') {
            showToast('Email successfully updated and verified!', 'success', 6000);
          }
          
          // Clear URL parameters
          window.history.replaceState({}, '', '/settings');
        }
        
        const userString = localStorage.getItem('user');
        const token = localStorage.getItem('auth_token');
        
        if (!userString || !token) {
          // User is not authenticated, redirect to login
          redirectTo('http://192.168.1.68:3000/login');
          return;
        }
        
        // Simulate slight delay to show skeleton (remove in production if not needed)
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Load user data from localStorage
        const userData = JSON.parse(userString);
        if (userData.email) {
          setCurrentEmail(userData.email);
        }
        if (userData.username) {
          setCurrentUsername(userData.username);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setLoadError('Failed to load user data. Please refresh the page.');
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, []);

  // Email validation function
  const validateEmail = (email: string) => {
    if (!email.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[\w\.-]+@[\w\.-]+\.\w+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  // Username validation function
  const validateUsername = (username: string) => {
    if (!username.trim()) {
      return 'Username is required';
    }
    if (username.trim().length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (username.trim().length > 25) {
      return 'Username must be less than 25 characters';
    }
    // Allow alphanumeric, underscores, and hyphens
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return 'Username can only contain letters, numbers, underscores, and hyphens';
    }
    return '';
  };

  // Handle email input change with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewEmail(value);
    const error = validateEmail(value);
    setEmailError(error);
  };

  // Handle username input change with validation
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewUsername(value);
    const error = validateUsername(value);
    setUsernameError(error);
  };

  // Handle username save button click
  const handleSaveUsername = async () => {
    const error = validateUsername(newUsername);
    setUsernameError(error);
    if (error) {
      return;
    }

    // TODO: Implement API call to update username
    console.log('Update username to:', newUsername);
  };

  // Handle save button click
  const handleSaveEmail = async () => {
    const error = validateEmail(newEmail);
    setEmailError(error);
    if (error) {
      return;
    }

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setEmailError('Authentication token not found. Please log in again.');
        return;
      }
      
      // Make API call to change email
      const response = await fetch('http://127.0.0.1:8000/auth/settings/email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ new_email: newEmail })
      });

      if (response.ok) {
        // Success - show success message
        const data = await response.json();
        setSuccessMessage(data.message || 'Verification email sent! Check your email to confirm the change.');
        setEmailError('');
        // Keep modal open to show success message
        // Optional: Auto-close after delay
        // setTimeout(() => {
        //   setShowEmailModal(false);
        //   setNewEmail('');
        //   setSuccessMessage('');
        // }, 3000);
      } else if (response.status === 401) {
        // Handle unauthorized - token expired or invalid
        setEmailError('Your session has expired. Please log in again.');
        setSuccessMessage('');
        // Optionally redirect to login after a delay
        setTimeout(() => {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          redirectTo('http://192.168.1.68:3000/login');
        }, 2000);
      } else {
        // Handle error responses
        const errorData = await response.json();
        setEmailError(errorData.message || 'Failed to send verification email');
        setSuccessMessage('');
      }
    } catch (error) {
      console.error('Error changing email:', error);
      setEmailError('Network error. Please try again.');
      setSuccessMessage('');
    }
  };

  // Skeleton loader component
  const SkeletonLoader = () => (
    <div className="space-y-6">
      {/* Account Settings Skeleton */}
      <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
        <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" data-testid="skeleton" />
        <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse" data-testid="skeleton" />
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" data-testid="skeleton" />
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" data-testid="skeleton" />
            </div>
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" data-testid="skeleton" />
          </div>
          <div className="h-px bg-gray-200 dark:bg-gray-700 animate-pulse" data-testid="skeleton" />
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" data-testid="skeleton" />
              <div className="h-4 w-56 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" data-testid="skeleton" />
            </div>
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" data-testid="skeleton" />
          </div>
        </div>
      </div>
      
      {/* Display Settings Skeleton */}
      <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
        <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" data-testid="skeleton" />
        <div className="h-4 w-72 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse" data-testid="skeleton" />
        
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" data-testid="skeleton" />
            <div className="h-4 w-52 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" data-testid="skeleton" />
          </div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" data-testid="skeleton" />
        </div>
      </div>
      
      {/* Notifications Skeleton */}
      <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" data-testid="skeleton" />
        <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse" data-testid="skeleton" />
        
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" data-testid="skeleton" />
            <div className="h-4 w-60 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" data-testid="skeleton" />
          </div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" data-testid="skeleton" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      {/* Error Message */}
      {loadError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">
            {loadError}
          </p>
        </div>
      )}
      
      {/* Loading State or Content */}
      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <div className="space-y-6">
          {/* Account Settings */}
        <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Account Settings</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Manage your account preferences
          </p>
          
          <div className="space-y-4">
            {/* Username Section */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Username</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{currentUsername || 'No username set'}</p>
              </div>
              <button 
                className="w-32 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                onClick={() => setShowUsernameModal(true)}
              >
                Change Username
              </button>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            {/* Change Email Button */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Email Address</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Update your email address</p>
              </div>
              <button 
                className="w-32 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                onClick={() => setShowEmailModal(true)}
              >
                Change Email
              </button>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            {/* Delete Account Button */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-red-600 dark:text-red-400">Delete Account</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Permanently delete your account and all data</p>
              </div>
              <button 
                className="w-32 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-lg transition-colors"
                onClick={() => {/* TODO: Implement account deletion */}}
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Display Settings</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Customize the appearance of the application
          </p>
          
          <div className="space-y-4">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Theme</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Switch between light and dark mode
                </p>
              </div>
              <button
                onClick={toggleTheme}
                aria-label={theme === 'light' ? 'Toggle to dark mode' : 'Toggle to light mode'}
                className="w-32 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-4 h-4" />
                    <span>Dark</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4" />
                    <span>Light</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Notifications</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Configure your notification preferences
          </p>
          
          <div className="space-y-4">
            {/* Email Notifications Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Email Notifications</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive email alerts for trading opportunities
                </p>
              </div>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                aria-label="Toggle email notifications"
                className="w-32 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {emailNotifications ? (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>Enabled</span>
                  </>
                ) : (
                  <>
                    <BellOff className="w-4 h-4" />
                    <span>Disabled</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Change Username Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            role="dialog" 
            aria-labelledby="username-modal-title"
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 animate-slide-up"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 id="username-modal-title" className="text-xl font-semibold">
                Change Username
              </h2>
              <button
                onClick={() => {
                  setShowUsernameModal(false);
                  setUsernameSuccessMessage('');
                  setUsernameError('');
                  setNewUsername('');
                }}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4">
              {/* Current Username */}
              <div>
                <label htmlFor="current-username" className="block text-sm font-medium mb-1">
                  Current Username
                </label>
                <input
                  id="current-username"
                  type="text"
                  value={currentUsername}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>

              {/* New Username */}
              <div>
                <label htmlFor="new-username" className="block text-sm font-medium mb-1">
                  New Username
                </label>
                <input
                  id="new-username"
                  type="text"
                  maxLength={25}
                  value={newUsername}
                  onChange={handleUsernameChange}
                  placeholder="Enter new username"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
                />
                {usernameError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {usernameError}
                  </p>
                )}
                {!usernameError && newUsername.length === 25 && (
                  <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                    25 characters maximum
                  </p>
                )}
                {usernameSuccessMessage && (
                  <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                    {usernameSuccessMessage}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowUsernameModal(false);
                  setUsernameSuccessMessage('');
                  setUsernameError('');
                  setNewUsername('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUsername}
                disabled={!!usernameError}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
              >
                Update Username
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            role="dialog" 
            aria-labelledby="modal-title"
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 animate-slide-up"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 id="modal-title" className="text-xl font-semibold">
                Change Email Address
              </h2>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setSuccessMessage('');
                  setEmailError('');
                  setNewEmail('');
                }}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4">
              {/* Current Email */}
              <div>
                <label htmlFor="current-email" className="block text-sm font-medium mb-1">
                  Current Email
                </label>
                <input
                  id="current-email"
                  type="email"
                  value={currentEmail}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>

              {/* New Email */}
              <div>
                <label htmlFor="new-email" className="block text-sm font-medium mb-1">
                  New Email
                </label>
                <input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={handleEmailChange}
                  placeholder="Enter new email address"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
                />
                {emailError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {emailError}
                  </p>
                )}
                {successMessage && (
                  <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                    {successMessage}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setSuccessMessage('');
                  setEmailError('');
                  setNewEmail('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEmail}
                disabled={!!emailError}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
              >
                Send Verification Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
