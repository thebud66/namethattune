import React, { useState } from 'react';

const Settings = () => {
  const [settings, setSettings] = useState({
    notifications: false,
    darkMode: true,
    emailUpdates: false
  });

  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleUpdateProfile = () => {
    alert('Profile updated!');
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      alert('Account deletion requested. This would typically redirect to a confirmation process.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Settings</h1>
      <div className="bg-white p-8 rounded-lg shadow-md space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Preferences</h3>
          <div className="space-y-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="mr-3"
                checked={settings.notifications}
                onChange={() => handleToggle('notifications')}
              />
              <span>Enable notifications</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="mr-3"
                checked={settings.darkMode}
                onChange={() => handleToggle('darkMode')}
              />
              <span>Dark mode</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="mr-3"
                checked={settings.emailUpdates}
                onChange={() => handleToggle('emailUpdates')}
              />
              <span>Email updates</span>
            </label>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3">Account</h3>
          <button
            onClick={handleUpdateProfile}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md mr-3 transition-colors"
          >
            Update Profile
          </button>
          <button
            onClick={handleDeleteAccount}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;