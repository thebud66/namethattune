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
      alert('Account deletion requested.');
    }
  };

  return (
    <div className="container">
      <h1>Settings</h1>
      <p className="subtitle">Manage your account preferences</p>

      <div className="settings-section">
        <h3 className="section-title">Preferences</h3>
        <div className="settings-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={() => handleToggle('notifications')}
            />
            <span>Enable notifications</span>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.darkMode}
              onChange={() => handleToggle('darkMode')}
            />
            <span>Dark mode</span>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.emailUpdates}
              onChange={() => handleToggle('emailUpdates')}
            />
            <span>Email updates</span>
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="section-title">Account</h3>
        <div className="btn-group">
          <button onClick={handleUpdateProfile} className="btn-secondary">
            Update Profile
          </button>
          <button onClick={handleDeleteAccount} className="btn-danger">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
