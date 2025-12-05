'use client';

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="space-y-6">
        <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Account Settings</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account preferences
          </p>
        </div>
        
        <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Notifications</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Configure your notification preferences
          </p>
        </div>
      </div>
    </div>
  );
}
