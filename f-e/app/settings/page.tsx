'use client';

import { useTheme } from '@/components/context/ThemeContext';
import { Sun, Moon, Bell, BellOff, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { redirectTo } from '@/lib/redirect';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [currentEmail] = useState('user@example.com'); // TODO: Get from user context
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Check authentication on mount
  useEffect(() => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');
    
    if (!user || !token) {
      // User is not authenticated, redirect to login
      redirectTo('http://192.168.1.68:3000/login');
    }
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

  // Handle email input change with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewEmail(value);
    const error = validateEmail(value);
    setEmailError(error);
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
        // Success - close modal and reset form
        setShowEmailModal(false);
        setNewEmail('');
        setEmailError('');
        // TODO: Show success toast notification
      } else {
        // Handle error responses
        const errorData = await response.json();
        setEmailError(errorData.message || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Error changing email:', error);
      setEmailError('Network error. Please try again.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="space-y-6">

        {/* Account Settings */}
        <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Account Settings</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Manage your account preferences
          </p>
          
          <div className="space-y-4">
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
                onClick={() => setShowEmailModal(false)}
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
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEmailModal(false)}
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
