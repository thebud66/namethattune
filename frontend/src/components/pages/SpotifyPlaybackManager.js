import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

/**
 * Custom hook to manage Spotify Web Playback SDK
 * Handles initialization, device management, and playback control
 */
export const useSpotifyPlayback = (isAuthenticated) => {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const playerInitialized = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || playerInitialized.current) return;

    const initializePlayer = async () => {
      try {
        // Load Spotify Web Playback SDK
        if (!window.Spotify) {
          const script = document.createElement('script');
          script.src = 'https://sdk.scdn.co/spotify-player.js';
          script.async = true;
          document.body.appendChild(script);
        }

        window.onSpotifyWebPlaybackSDKReady = () => {
          setupPlayer();
        };

        // If SDK already loaded
        if (window.Spotify) {
          setupPlayer();
        }
      } catch (err) {
        console.error('Error initializing player:', err);
        setError('Failed to initialize Spotify player');
      }
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
          setError('Failed to initialize player');
        });

        spotifyPlayer.addListener('authentication_error', ({ message }) => {
          console.error('Authentication Error:', message);
          setError('Authentication failed');
        });

        spotifyPlayer.addListener('account_error', ({ message }) => {
          console.error('Account Error:', message);
          setError('Spotify Premium required');
        });

        spotifyPlayer.addListener('playback_error', ({ message }) => {
          console.error('Playback Error:', message);
        });

        // Ready
        spotifyPlayer.addListener('ready', ({ device_id }) => {
          console.log('Web Playback SDK Ready with Device ID:', device_id);
          setDeviceId(device_id);
          setIsReady(true);
          setError(null);
        });

        // Not Ready
        spotifyPlayer.addListener('not_ready', ({ device_id }) => {
          console.log('Device ID has gone offline:', device_id);
          setIsReady(false);
        });

        // Connect to the player
        const connected = await spotifyPlayer.connect();
        if (connected) {
          setPlayer(spotifyPlayer);
          playerInitialized.current = true;
          console.log('Successfully connected to Web Playback SDK');
        }
      } catch (err) {
        console.error('Error setting up player:', err);
        setError('Failed to setup player');
      }
    };

    const getSpotifyToken = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/spotify/auth/token');
        return response.data.access_token;
      } catch (error) {
        console.error('Error getting token:', error);
        throw error;
      }
    };

    initializePlayer();

    // Cleanup
    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [isAuthenticated]);

  return { player, deviceId, isReady, error };
};

/**
 * Device Manager - Handles device detection and playback transfer
 */
export const SpotifyDeviceManager = {
  /**
   * Get all available Spotify devices
   */
  async getAvailableDevices() {
    try {
      const response = await axios.get('http://localhost:8000/api/spotify/me/player/devices');
      return response.data.devices || [];
    } catch (error) {
      console.error('Error getting devices:', error);
      return [];
    }
  },

  /**
   * Transfer playback to a specific device
   */
  async transferPlayback(deviceId, play = false) {
    try {
      await axios.put('http://localhost:8000/api/spotify/me/player/transfer', {
        device_id: deviceId,
        play: play
      });
      // Wait for transfer to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } catch (error) {
      console.error('Error transferring playback:', error);
      return false;
    }
  },

  /**
   * Find the best device to use for playback
   * Priority: 1) Web Playback SDK device, 2) Active device, 3) Any available device
   */
  async findBestDevice(webPlayerDeviceId = null) {
    const devices = await this.getAvailableDevices();

    if (devices.length === 0) {
      return { device: null, needsTransfer: false };
    }

    // Priority 1: Web Player device if available
    if (webPlayerDeviceId) {
      const webDevice = devices.find(d => d.id === webPlayerDeviceId);
      if (webDevice) {
        return {
          device: webDevice,
          needsTransfer: !webDevice.is_active
        };
      }
    }

    // Priority 2: Currently active device
    const activeDevice = devices.find(d => d.is_active);
    if (activeDevice) {
      return { device: activeDevice, needsTransfer: false };
    }

    // Priority 3: Any available device
    return { device: devices[0], needsTransfer: true };
  },

  /**
   * Ensure there's an active device ready for playback
   * Returns the device ID to use, or null if none available
   */
  async ensureActiveDevice(webPlayerDeviceId = null) {
    const { device, needsTransfer } = await this.findBestDevice(webPlayerDeviceId);

    if (!device) {
      return null;
    }

    if (needsTransfer) {
      const transferred = await this.transferPlayback(device.id, false);
      if (!transferred) {
        return null;
      }
    }

    return device.id;
  }
};

export default useSpotifyPlayback;