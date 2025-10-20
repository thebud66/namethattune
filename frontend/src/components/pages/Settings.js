// frontend/src/components/pages/Settings.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Music, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const Settings = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playlistId, setPlaylistId] = useState('');
  const [savedPlaylistId, setSavedPlaylistId] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkAuthStatus();
    fetchPlaylistSetting();
    
    // Check for auth success in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      setMessage('Successfully connected to Spotify!');
      setIsAuthenticated(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/spotify/auth/status');
      setIsAuthenticated(response.data.authenticated);
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaylistSetting = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/gameplay-settings/SPOTIFY_PLAYLIST');
      setPlaylistId(response.data.value);
      setSavedPlaylistId(response.data.value);
    } catch (error) {
      console.log('No playlist configured yet');
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/spotify/auth/login');
      // Redirect to Spotify login
      window.location.href = response.data.auth_url;
    } catch (error) {
      console.error('Error initiating login:', error);
      setMessage('Failed to initiate Spotify login. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://127.0.0.1:8000/api/spotify/auth/logout');
      setIsAuthenticated(false);
      setMessage('Logged out of Spotify');
    } catch (error) {
      console.error('Error logging out:', error);
      setMessage('Failed to logout');
    }
  };

  const handleSavePlaylist = async () => {
    if (!playlistId.trim()) {
      setMessage('Please enter a playlist ID');
      return;
    }

    setSaving(true);
    try {
      await axios.put(`http://127.0.0.1:8000/api/gameplay-settings/SPOTIFY_PLAYLIST/upsert?value=${encodeURIComponent(playlistId)}`);
      setSavedPlaylistId(playlistId);
      setMessage('Playlist ID saved successfully!');
    } catch (error) {
      console.error('Error saving playlist:', error);
      setMessage('Failed to save playlist ID');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Settings</h1>
      <p className="subtitle">Configure your game settings</p>

      {message && (
        <div style={{
          padding: '16px',
          marginBottom: '20px',
          borderRadius: '8px',
          backgroundColor: message.includes('success') || message.includes('Successfully') ? '#d1fae5' : '#fee2e2',
          color: message.includes('success') || message.includes('Successfully') ? '#065f46' : '#991b1b',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {message.includes('success') || message.includes('Successfully') ? 
            <CheckCircle size={20} /> : 
            <AlertCircle size={20} />
          }
          {message}
        </div>
      )}

      {/* Spotify Authentication Section */}
      <div style={{
        backgroundColor: 'white',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px'
      }}>
        <h2 style={{ fontSize: '1.5em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Music size={24} style={{ color: '#1DB954' }} />
          Spotify Connection
        </h2>

        {isAuthenticated ? (
          <div>
            <div style={{
              padding: '16px',
              backgroundColor: '#d1fae5',
              border: '2px solid #10b981',
              borderRadius: '8px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <CheckCircle size={20} style={{ color: '#065f46' }} />
              <span style={{ color: '#065f46', fontWeight: 600 }}>Connected to Spotify</span>
            </div>
            <p style={{ marginBottom: '16px', color: '#6b7280' }}>
              You're authorized to control Spotify playback and access playlists.
            </p>
            <button onClick={handleLogout} className="btn-secondary">
              Disconnect Spotify
            </button>
          </div>
        ) : (
          <div>
            <div style={{
              padding: '16px',
              backgroundColor: '#fee2e2',
              border: '2px solid #ef4444',
              borderRadius: '8px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertCircle size={20} style={{ color: '#991b1b' }} />
              <span style={{ color: '#991b1b', fontWeight: 600 }}>Not connected to Spotify</span>
            </div>
            <p style={{ marginBottom: '16px', color: '#6b7280' }}>
              Connect your Spotify account to enable music playback during games.
              <br />
              <strong>Note:</strong> Requires Spotify Premium for playback control.
            </p>
            <button onClick={handleLogin} className="btn-primary">
              <Music size={20} />
              Connect Spotify Account
            </button>
          </div>
        )}
      </div>

      {/* Playlist Configuration Section */}
      <div style={{
        backgroundColor: 'white',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px'
      }}>
        <h2 style={{ fontSize: '1.5em', marginBottom: '16px' }}>
          Playlist Configuration
        </h2>
        <p style={{ marginBottom: '16px', color: '#6b7280' }}>
          Set the Spotify playlist ID to use for all games.
        </p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
            Spotify Playlist ID
          </label>
          <input
            type="text"
            value={playlistId}
            onChange={(e) => setPlaylistId(e.target.value)}
            placeholder="e.g., 37i9dQZF1DXcBWIGoYBM5M"
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
            To find your playlist ID: Open Spotify → Go to playlist → Click "..." → Share → Copy link to playlist
            <br />
            The ID is the part after "/playlist/" in the URL
          </p>
        </div>

        {savedPlaylistId && savedPlaylistId !== playlistId && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px',
            color: '#92400e'
          }}>
            Current saved ID: <strong>{savedPlaylistId}</strong>
          </div>
        )}

        <button 
          onClick={handleSavePlaylist} 
          className="btn-primary"
          disabled={saving || playlistId === savedPlaylistId}
        >
          {saving ? (
            <>
              <RefreshCw size={20} className="spinning" />
              Saving...
            </>
          ) : (
            'Save Playlist ID'
          )}
        </button>
      </div>
    </div>
  );
};

export default Settings;