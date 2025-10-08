import React, { useEffect, useState, useRef } from 'react';

const SpotifyPlayer = () => {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPaused, setIsPaused] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const playerInitialized = useRef(false);

  useEffect(() => {
    checkAuthStatus();
    
    // Check for auth success in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      setIsAuthenticated(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !playerInitialized.current) {
      initializePlayer();
    }
  }, [isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/spotify/auth/status');
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/spotify/auth/login');
      const data = await response.json();
      
      // Redirect to Spotify login
      window.location.href = data.auth_url;
    } catch (error) {
      console.error('Error initiating login:', error);
      alert('Failed to initiate login. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('http://127.0.0.1:8000/api/spotify/auth/logout', {
        method: 'POST'
      });
      
      if (player) {
        player.disconnect();
      }
      
      setIsAuthenticated(false);
      setPlayer(null);
      setDeviceId(null);
      setIsActive(false);
      setCurrentTrack(null);
      playerInitialized.current = false;
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const initializePlayer = async () => {
    if (playerInitialized.current) return;
    playerInitialized.current = true;

    // Load Spotify Web Playback SDK
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      setupPlayer();
    };
  };

  const setupPlayer = async () => {
    try {
      const token = await getSpotifyToken();

      const spotifyPlayer = new window.Spotify.Player({
        name: 'Name That Tune Web Player',
        getOAuthToken: async cb => { 
          const freshToken = await getSpotifyToken();
          cb(freshToken); 
        },
        volume: 0.5
      });

      // Error handling
      spotifyPlayer.addListener('initialization_error', ({ message }) => {
        console.error('Initialization Error:', message);
      });

      spotifyPlayer.addListener('authentication_error', async ({ message }) => {
        console.error('Authentication Error:', message);
        // Try to refresh token
        try {
          await refreshToken();
          spotifyPlayer.connect();
        } catch (error) {
          console.error('Token refresh failed:', error);
        }
      });

      spotifyPlayer.addListener('account_error', ({ message }) => {
        console.error('Account Error:', message);
        alert('Spotify Premium is required to use the Web Player');
      });

      spotifyPlayer.addListener('playback_error', ({ message }) => {
        console.error('Playback Error:', message);
      });

      // Playback status updates
      spotifyPlayer.addListener('player_state_changed', state => {
        if (!state) return;

        setCurrentTrack(state.track_window.current_track);
        setIsPaused(state.paused);
        setIsActive(true);

        spotifyPlayer.getCurrentState().then(state => {
          setIsPlaying(!state ? false : !state.paused);
        });
      });

      // Ready
      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
      });

      // Not Ready
      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
      });

      // Connect to the player
      spotifyPlayer.connect();
      setPlayer(spotifyPlayer);
    } catch (error) {
      console.error('Error setting up player:', error);
    }
  };

  const getSpotifyToken = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/spotify/auth/token');
      if (!response.ok) {
        throw new Error('Failed to get token');
      }
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting token:', error);
      throw error;
    }
  };

  const refreshToken = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/spotify/auth/refresh', {
        method: 'POST'
      });
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  };

  const togglePlay = () => {
    if (player) {
      player.togglePlay();
    }
  };

  const skipToNext = () => {
    if (player) {
      player.nextTrack();
    }
  };

  const skipToPrevious = () => {
    if (player) {
      player.previousTrack();
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (player) {
      player.setVolume(newVolume / 100);
    }
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading">Loading authentication status</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container">
        <h1>🎵 Spotify Web Player</h1>
        <p className="subtitle">Stream music directly in your browser</p>

        <div className="player-setup">
          <div className="setup-card">
            <div className="setup-icon">🔐</div>
            <h3>Login Required</h3>
            <p style={{ marginBottom: '24px', color: '#6b7280' }}>
              You need to log in with your Spotify Premium account to use the web player.
            </p>
            <button onClick={handleLogin} className="btn-primary btn-large">
              Login with Spotify
            </button>
            
            <div className="player-notice" style={{ marginTop: '30px', textAlign: 'left' }}>
              <h4>Requirements:</h4>
              <ul>
                <li>Spotify Premium account</li>
                <li>Active internet connection</li>
                <li>Modern web browser</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>🎵 Spotify Web Player</h1>
          <p className="subtitle">Stream music directly in your browser</p>
        </div>
        <button onClick={handleLogout} className="btn-secondary">
          Logout
        </button>
      </div>

      {!isActive ? (
        <div className="player-setup">
          <div className="setup-card">
            <div className="setup-icon">🎧</div>
            <h3>Setup Instructions</h3>
            <ol className="setup-steps">
              <li>Open Spotify on your phone or desktop</li>
              <li>Play any song</li>
              <li>Click on "Connect to a device" (🔊 icon)</li>
              <li>Select "Name That Tune Web Player"</li>
            </ol>
            {deviceId && (
              <div className="device-info">
                <strong>Device ID:</strong> {deviceId}
                <p className="success-text">✓ Player is ready and waiting for connection!</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="player-container">
          {/* Now Playing Display */}
          {currentTrack && (
            <div className="now-playing">
              <img 
                src={currentTrack.album.images[0]?.url} 
                alt={currentTrack.album.name}
                className="album-art"
              />
              <div className="track-info-player">
                <h2 className="track-name">{currentTrack.name}</h2>
                <p className="track-artists">
                  {currentTrack.artists.map(artist => artist.name).join(', ')}
                </p>
                <p className="track-album">{currentTrack.album.name}</p>
              </div>
            </div>
          )}

          {/* Playback Controls */}
          <div className="playback-controls">
            <button onClick={skipToPrevious} className="control-btn" title="Previous">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>
            
            <button onClick={togglePlay} className="control-btn play-btn" title={isPaused ? 'Play' : 'Pause'}>
              {isPaused ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="32" height="32">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="32" height="32">
                  <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
                </svg>
              )}
            </button>
            
            <button onClick={skipToNext} className="control-btn" title="Next">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
                <path d="M16 18h2V6h-2zm-11-7l8.5-6v12z"/>
              </svg>
            </button>
          </div>

          {/* Volume Control */}
          <div className="volume-control">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider"
            />
            <span className="volume-value">{volume}%</span>
          </div>

          {/* Device Info */}
          <div className="device-status">
            <span className="status-indicator active"></span>
            Playing on Name That Tune Web Player
          </div>
        </div>
      )}
    </div>
  );
};

export default SpotifyPlayer;