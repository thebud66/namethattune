import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Music, Play, SkipForward, CheckCircle, Award, Trophy, Volume2, Edit2 } from 'lucide-react';
import SongScoring from '../SongScoring';
import { useSpotifyPlayback, SpotifyDeviceManager } from './SpotifyPlaybackManager';

const RoundGameplay = ({ gameId, roundId, onRoundComplete }) => {
  const [game, setGame] = useState(null);
  const [round, setRound] = useState(null);
  const [songs, setSongs] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showScoring, setShowScoring] = useState(false);
  const [roles, setRoles] = useState({ dj: null, players: [], stealer: null });
  const [spotifyPlaylistId, setSpotifyPlaylistId] = useState(null);
  const [spotifyError, setSpotifyError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [showDevicePicker, setShowDevicePicker] = useState(false);
  const [playlistTrackCount, setPlaylistTrackCount] = useState(null);
  const [editingSongIndex, setEditingSongIndex] = useState(null);

  // Initialize Web Playback SDK
  const { player, deviceId: webPlayerDeviceId, isReady: webPlayerReady, error: playerError } = useSpotifyPlayback(isAuthenticated);

  const SONGS_PER_ROUND = 10;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const initializeRound = async () => {
        await fetchGameDetails();
        await fetchSpotifyPlaylistSetting();
        const songsCount = await fetchRoundDetails();
        setCurrentSongIndex(songsCount);

        // Don't pause on initialization - let playback happen when needed
        console.log('Round initialized');
      };

      initializeRound();
    }
  }, [roundId, gameId, isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/spotify/auth/status');
      setIsAuthenticated(response.data.authenticated);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    }
  };

  const fetchGameDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/games/${gameId}`);
      setGame(response.data);
    } catch (error) {
      console.error('Error fetching game:', error);
      setError('Failed to load game details');
    }
  };

  const fetchSpotifyPlaylistSetting = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/gameplay-settings/SPOTIFY_PLAYLIST');
      setSpotifyPlaylistId(response.data.value);
      console.log('Spotify playlist ID:', response.data.value);
    } catch (error) {
      console.error('Error fetching Spotify playlist setting:', error);
      setError('Spotify playlist not configured. Please contact administrator.');
    }
  };

  const fetchRoundDetails = async () => {
    try {
      console.log('Fetching round details for round:', roundId);
      const response = await axios.get(`http://localhost:8000/api/rounds/${roundId}/details`);
      const roundData = response.data;

      console.log('Round data received:', roundData);
      console.log('Round teams:', roundData.round_teams);

      // Set round data FIRST with all its properties
      setRound(roundData);

      // Extract teams from the response and properly map to participants
      const playerTeam = roundData.round_teams?.find(t => t.role === 'player');
      const djTeam = roundData.round_teams?.find(t => t.role === 'dj');
      const stealerTeam = roundData.round_teams?.find(t => t.role === 'stealer');

      setRoles({
        dj: djTeam?.round_team_players?.[0]?.participant || null,
        players: playerTeam?.round_team_players?.map(rtp => rtp.participant) || [],
        stealer: stealerTeam?.round_team_players?.[0]?.participant || null
      });

      const songsData = roundData.round_songlists || [];
      setSongs(songsData);
      setLoading(false);

      console.log('Round details loaded successfully. Songs count:', songsData.length);
      return songsData.length;
    } catch (error) {
      console.error('Error fetching round:', error);
      setError('Failed to load round details');
      setLoading(false);
      return 0;
    }
  };

  const calculateRoundScores = () => {
    const scores = {};
    const allParticipants = [
      ...(roles.dj ? [{ participant: roles.dj, role: 'dj' }] : []),
      ...(roles.players.map(p => ({ participant: p, role: 'player' }))),
      ...(roles.stealer ? [{ participant: roles.stealer, role: 'stealer' }] : [])
    ];

    allParticipants.forEach(({ participant, role }) => {
      scores[participant.participant_id] = {
        player: participant.player,
        score: 0,
        role: role,
        seatNumber: participant.seat_number
      };
    });

    round?.round_teams?.forEach(team => {
      let teamScore = 0;

      songs.forEach(song => {
        if (song.round_team_id === team.round_team_id) {
          if (song.correct_artist_guess) teamScore += 1;
          if (song.correct_song_title_guess) teamScore += 1;
          if (song.bonus_correct_movie_guess) teamScore += 1;
        }
      });

      team.round_team_players?.forEach(teamPlayer => {
        if (scores[teamPlayer.participant_id]) {
          scores[teamPlayer.participant_id].score = teamScore;
        }
      });
    });

    return Object.values(scores).sort((a, b) => a.seatNumber - b.seatNumber);
  };

  const pausePlayback = async () => {
    try {
      await axios.put('http://localhost:8000/api/spotify/me/player/pause');
      console.log('Playback paused');
    } catch (error) {
      if (error.response?.status === 404) {
        console.warn('No active Spotify device found');
        return;
      }
      console.error('Error pausing playback:', error);
    }
  };

  const playNextSongFromPlaylist = async () => {
    setSpotifyError(false);
    setError('');

    try {
      if (!spotifyPlaylistId) {
        setError('Spotify playlist not configured');
        return;
      }

      if (!round) {
        setError('Round data not loaded yet. Please wait...');
        console.error('Round is not loaded!');
        return;
      }

      console.log('Starting playback process...');
      console.log('Round loaded:', round);

      // Step 1: Ensure we have an active device
      let targetDeviceId = await SpotifyDeviceManager.ensureActiveDevice(webPlayerDeviceId);

      if (!targetDeviceId) {
        // No devices available - show device picker
        const devices = await SpotifyDeviceManager.getAvailableDevices();
        if (devices.length === 0) {
          setError('No Spotify devices found. Please open Spotify on your phone, computer, or use the web player.');
          setSpotifyError(true);
          return;
        }

        setAvailableDevices(devices);
        setShowDevicePicker(true);
        return;
      }

      console.log('Using device:', targetDeviceId);

      // Step 2: Check if something is currently playing and pause it
      try {
        const stateResponse = await axios.get('http://localhost:8000/api/spotify/me/player');
        if (stateResponse?.data && stateResponse.data.is_playing) {
          await pausePlayback();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (stateError) {
        console.warn('Error checking playback state:', stateError);
      }

      // Step 2.5: Get playlist info to determine total track count (cached)
      let totalTracks = playlistTrackCount || 100; // Use cached value or default

      if (!playlistTrackCount) {
        console.log('Fetching playlist info to get track count...');
        console.log('Playlist ID:', spotifyPlaylistId);
        try {
          const playlistResponse = await axios.get(`http://localhost:8000/api/spotify/playlists/${spotifyPlaylistId}`);
          console.log('Playlist response:', playlistResponse.data);

          if (playlistResponse.data && playlistResponse.data.tracks_total) {
            totalTracks = playlistResponse.data.tracks_total;
            setPlaylistTrackCount(totalTracks); // Cache it
            console.log(`✅ Playlist has ${totalTracks} total tracks (cached for future use)`);
          } else {
            console.warn('Playlist response missing tracks_total:', playlistResponse.data);
          }
        } catch (playlistError) {
          console.error('❌ Could not fetch playlist info:', playlistError);
          console.error('Error response:', playlistError.response?.data);
          console.error('Error status:', playlistError.response?.status);
          console.warn('Using default track count of 100');
        }
      } else {
        console.log(`Using cached track count: ${totalTracks}`);
      }

      // Step 3: Start playing from playlist at random position
      console.log('Playing from playlist at random position...');

      // Generate a random position based on actual playlist size
      const randomPosition = Math.floor(Math.random() * totalTracks);
      console.log(`Random position: ${randomPosition} out of ${totalTracks}`);

      // Start playback at random position
      await axios.put(`http://localhost:8000/api/spotify/me/player/play?device_id=${targetDeviceId}`, {
        context_uri: `spotify:playlist:${spotifyPlaylistId}`,
        offset: { position: randomPosition }
      });
      console.log('Play command sent with random offset');

      // Wait for playback to start and stabilize
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Step 4: Get current track info
      console.log('Getting currently playing track...');

      const nowPlayingResponse = await axios.get('http://localhost:8000/api/spotify/me/player/currently-playing');
      console.log('Now playing response:', nowPlayingResponse.data);

      const track = nowPlayingResponse.data.item || nowPlayingResponse.data;
      console.log('Track extracted:', track);

      setCurrentTrack(track);

      if (track) {
        console.log('Track exists, calling saveTrackToRound with round data');
        await saveTrackToRound(track, round);
      } else {
        console.error('No track found in response');
        setError('Failed to get track information from Spotify');
      }
    } catch (err) {
      console.error('Error playing track:', err);
      console.log('Setting spotifyError to true');
      setSpotifyError(true);
      setError('Failed to play track from Spotify. Make sure Spotify is active.');
    }
  };

  const handleEditSong = (index) => {
    setEditingSongIndex(index);
    setShowScoring(true);
    // DON'T set currentSongIndex here - keep it separate from editing
  };

  const handleEditScoreSubmit = async (scoringData) => {
    try {
      const songToEdit = songs[editingSongIndex];

      // Determine which team gets the points
      const targetTeamId = scoringData.wasStolen ?
        round.round_teams.find(t => t.role === 'stealer')?.round_team_id :
        round.round_teams.find(t => t.role === 'player')?.round_team_id;

      // Update the round songlist with scoring
      await axios.put(`http://localhost:8000/api/round-songlists/${songToEdit.round_songlist_id}`, {
        round_team_id: targetTeamId,
        correct_artist_guess: scoringData.correctArtist,
        correct_song_title_guess: scoringData.correctSong,
        bonus_correct_movie_guess: scoringData.correctMovie,
        score_type: scoringData.wasStolen ? 'steal' : 'standard'
      });

      setShowScoring(false);
      setEditingSongIndex(null);

      // Refresh songs list to get updated data
      await fetchRoundDetails();
      // Don't increment currentSongIndex - we're just editing, not moving forward

    } catch (error) {
      console.error('Error saving edited score:', error);
      setError('Failed to save edited score. Please try again.');
    }
  };

  const handleDeviceSelection = async (deviceId) => {
    setShowDevicePicker(false);
    const transferred = await SpotifyDeviceManager.transferPlayback(deviceId, false);
    if (transferred) {
      await playNextSongFromPlaylist();
    } else {
      setError('Failed to transfer playback to selected device');
    }
  };

  const saveTrackToRound = async (track, currentRound = null) => {
    try {
      console.log('=== SAVING TRACK ===');
      console.log('Full track object:', JSON.stringify(track, null, 2));
      console.log('Track ID:', track?.id);
      console.log('Track name:', track?.name);
      console.log('Track artists:', track?.artists);

      // Use the passed round or the state round
      const roundToUse = currentRound || round;
      console.log('Round object:', roundToUse);
      console.log('Round.round_teams:', roundToUse?.round_teams);
      console.log('Round keys:', Object.keys(roundToUse || {}));

      if (!roundToUse) {
        console.error('Round is undefined!');
        throw new Error('Round data not loaded');
      }

      if (!roundToUse.round_teams) {
        console.error('Round exists but has no round_teams property!');
        console.error('Available round properties:', Object.keys(roundToUse));
        throw new Error('Round teams not loaded - please refresh the page');
      }

      if (!track) {
        throw new Error('No track provided');
      }

      if (!track.artists || track.artists.length === 0) {
        console.error('Track has no artists. Full track:', track);
        throw new Error('Track has no artists');
      }

      if (!track.id) {
        console.error('Track has no ID. Full track:', track);
        throw new Error('Track has no ID');
      }

      if (!track.name) {
        console.error('Track has no name. Full track:', track);
        throw new Error('Track has no name');
      }

      console.log('Creating artist...');
      const artistResponse = await axios.post('http://localhost:8000/api/artists/', {
        spotify_id: track.artists[0].id,
        name: track.artists[0].name
      });
      console.log('Artist created:', artistResponse.data);
      const artistId = artistResponse.data.artist_id;

      console.log('Creating song...');
      const songResponse = await axios.post('http://localhost:8000/api/songs/', {
        spotify_id: track.id,
        title: track.name
      });
      console.log('Song created:', songResponse.data);
      const songId = songResponse.data.song_id;

      console.log('Creating track info...');
      const trackInfoResponse = await axios.post('http://localhost:8000/api/track-infos/', {
        song_id: songId,
        artist_id: artistId
      });
      console.log('Track info created:', trackInfoResponse.data);
      const trackInfoId = trackInfoResponse.data.track_info_id;

      const playerTeam = roundToUse.round_teams.find(t => t.role === 'player');
      if (!playerTeam) {
        throw new Error('No player team found in round');
      }

      console.log('Creating round songlist entry...');
      await axios.post('http://localhost:8000/api/round-songlists/', {
        round_id: roundId,
        song_id: songId,
        round_team_id: playerTeam.round_team_id,
        track_info_id: trackInfoId,
        correct_artist_guess: false,
        correct_song_title_guess: false,
        bonus_correct_movie_guess: false,
        score_type: 'standard'
      });
      console.log('Round songlist created successfully');

      console.log('Fetching updated round details...');
      const newSongsLength = await fetchRoundDetails();
      setCurrentSongIndex(newSongsLength - 1);

      console.log('Showing scoring modal');
      setShowScoring(true);
      console.log('=== TRACK SAVED SUCCESSFULLY ===');
    } catch (error) {
      console.error('=== ERROR SAVING TRACK ===');
      console.error('Error details:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setError(`Failed to save track: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleScoringComplete = async (scoringData) => {
    try {
      const songIndex = editingSongIndex !== null ? editingSongIndex : currentSongIndex;
      const currentSong = songs[songIndex];
      console.log('Scoring song:', currentSong, 'at index:', songIndex);

      const targetTeamId = scoringData.wasStolen ?
        round.round_teams.find(t => t.role === 'stealer')?.round_team_id :
        round.round_teams.find(t => t.role === 'player')?.round_team_id;

      await axios.put(`http://localhost:8000/api/round-songlists/${currentSong.round_songlist_id}`, {
        round_team_id: targetTeamId,
        correct_artist_guess: scoringData.correctArtist,
        correct_song_title_guess: scoringData.correctSong,
        bonus_correct_movie_guess: scoringData.correctMovie,
        score_type: scoringData.wasStolen ? 'steal' : 'standard'
      });

      setShowScoring(false);
      setEditingSongIndex(null); // Reset edit mode

      const newSongsLength = await fetchRoundDetails();

      // Only advance to next song if not editing
      if (editingSongIndex === null) {
        setCurrentSongIndex(newSongsLength);
      }

      console.log('Score saved successfully');
    } catch (error) {
      console.error('Error saving score:', error);
      setError('Failed to save score. Please try again.');
    }
  };

  const handleEndRound = async () => {
    if (!window.confirm('Are you sure you want to end this round?')) {
      return;
    }

    try {
      await pausePlayback();
      await axios.put(`http://localhost:8000/api/rounds/${roundId}`, {
        is_complete: true
      });
      console.log('Round marked as complete');
      onRoundComplete();
    } catch (error) {
      console.error('Error ending round:', error);
      setError('Failed to end round');
    }
  };

  const getRoleColor = (role) => {
    const colorMap = {
      dj: '#f59e0b',
      player: '#667eea',
      stealer: '#10b981'
    };
    return colorMap[role] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading round...</div>
      </div>
    );
  }

  const isRoundComplete = songs.length >= SONGS_PER_ROUND;

  const canPlayNext = currentSongIndex === songs.length &&
    !isRoundComplete &&
    !showScoring &&
    editingSongIndex === null;

  const roundScores = calculateRoundScores();

  return (
    <div className="container">
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1>Round {round?.round_number}</h1>
        <p className="subtitle">Song {songs.length} of {SONGS_PER_ROUND}</p>
        {webPlayerReady && (
          <p style={{ color: '#10b981', fontSize: '14px', marginTop: '8px' }}>
            <Volume2 size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            Web Player Active
          </p>
        )}
        {playerError && (
          <p style={{ color: '#f59e0b', fontSize: '14px', marginTop: '8px' }}>
            Web Player: {playerError}
          </p>
        )}
      </div>

      {/* Roles Display with Scores */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '30px'
      }}>
        {/* DJ */}
        {roles.dj && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fffbeb',
            border: `2px solid ${getRoleColor('dj')}`,
            borderRadius: '12px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: getRoleColor('dj'),
                textTransform: 'uppercase'
              }}>
                DJ
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                color: getRoleColor('dj')
              }}>
                {roundScores.find(s => s.player.player_id === roles.dj.player.player_id)?.score || 0}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src={roles.dj.player.image_url ?
                  `http://localhost:8000${roles.dj.player.image_url}`
                  : '/images/usr_placeholder.png'
                }
                alt={roles.dj.player.name}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
              <div style={{ fontWeight: 600 }}>{roles.dj.player.name}</div>
            </div>
          </div>
        )}

        {/* Players */}
        {roles.players.length > 0 && (
          <div style={{
            padding: '16px',
            backgroundColor: '#f0f4ff',
            border: `2px solid ${getRoleColor('player')}`,
            borderRadius: '12px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: getRoleColor('player'),
                textTransform: 'uppercase'
              }}>
                Players
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                color: getRoleColor('player')
              }}>
                {roundScores.find(s => roles.players.some(p => p?.player?.player_id === s?.player?.player_id))?.score || 0}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {roles.players.map(player => {
                if (!player || !player.player) return null;
                return (
                  <div key={player.participant_id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={player.player.image_url ?
                        `http://localhost:8000${player.player.image_url}`
                        : '/images/usr_placeholder.png'
                      }
                      alt={player.player.name}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{ fontWeight: 600 }}>{player.player.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stealer */}
        {roles.stealer && (
          <div style={{
            padding: '16px',
            backgroundColor: '#f0fdf4',
            border: `2px solid ${getRoleColor('stealer')}`,
            borderRadius: '12px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: getRoleColor('stealer'),
                textTransform: 'uppercase'
              }}>
                Stealer
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                color: getRoleColor('stealer')
              }}>
                {roundScores.find(s => s.player.player_id === roles.stealer.player.player_id)?.score || 0}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src={roles.stealer.player.image_url ?
                  `http://localhost:8000${roles.stealer.player.image_url}`
                  : '/images/usr_placeholder.png'
                }
                alt={roles.stealer.player.name}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
              <div style={{ fontWeight: 600 }}>{roles.stealer.player.name}</div>
            </div>
          </div>
        )}
      </div>

      {/* Song List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Array.from({ length: SONGS_PER_ROUND }).map((_, index) => {
          const song = songs[index]; // Will be undefined for placeholder rows
          const isPlayed = song && (
            song.correct_artist_guess !== null ||
            song.correct_song_title_guess !== null ||
            song.bonus_correct_movie_guess !== null
          );
          const isCurrentSong = index === currentSongIndex;

          return (
            <div
              key={song?.round_songlist_id || `placeholder-${index}`}
              style={{
                padding: '12px 16px',
                backgroundColor: isCurrentSong ? '#dbeafe' : isPlayed ? '#f9fafb' : '#ffffff',
                border: isCurrentSong ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Song Number Badge */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: isPlayed ? '#667eea' : '#e5e7eb',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '14px'
              }}>
                {index + 1}
              </div>

              {isPlayed ? (
                <>
                  {/* Played Song Content */}
                  <Music size={20} style={{ color: '#667eea' }} />
                  <div style={{ flex: 1 }}>
                    {/* Track Title - CORRECT PATH */}
                    <div style={{ fontWeight: 600, color: '#1f2937' }}>
                      {song.song?.title || 'Unknown Track'}
                    </div>
                    {/* Artist Name - CORRECT PATH */}
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {song.track_info?.artist?.name || 'Unknown Artist'}
                    </div>
                  </div>

                  {/* Score Display with Icons - FIXED */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    {song.correct_artist_guess && (
                      <CheckCircle size={18} style={{ color: '#10b981' }} title="Artist Correct" />
                    )}
                    {song.correct_song_title_guess && (
                      <CheckCircle size={18} style={{ color: '#10b981' }} title="Song Correct" />
                    )}
                    {song.bonus_correct_movie_guess && (
                      <Award size={18} style={{ color: '#f59e0b' }} title="Movie Bonus" />
                    )}
                    {song.score_type === 'steal' && (
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#10b981'
                      }}>
                        STOLEN
                      </span>
                    )}
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => handleEditSong(index)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '13px',
                      color: '#374151',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                      e.currentTarget.style.borderColor = '#9ca3af';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                    title="Edit score"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                </>
              ) : (
                <>
                  {/* Placeholder for Unplayed Song */}
                  <Music size={20} style={{ color: '#d1d5db' }} />
                  <div style={{ flex: 1, color: '#9ca3af', fontStyle: 'italic' }}>
                    Not played yet
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Error Display */}
      {error && !showDevicePicker && (
        <div style={{
          padding: '20px',
          backgroundColor: '#fef2f2',
          border: '2px solid #ef4444',
          borderRadius: '12px',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '0 auto 20px auto'
        }}>
          <p style={{ color: '#b91c1c', fontWeight: '600', marginBottom: '16px', fontSize: '15px' }}>
            {error}
          </p>
          <button
            type="button"
            onClick={() => {
              setError('');
              setSpotifyError(false);
              playNextSongFromPlaylist();
            }}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      )}

      {/* Device Picker Modal */}
      {showDevicePicker && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '16px' }}>Select a Device</h3>
            <p style={{ marginBottom: '20px', color: '#6b7280' }}>
              Choose which device to play music on:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {availableDevices.map(device => (
                <button
                  key={device.id}
                  onClick={() => handleDeviceSelection(device.id)}
                  style={{
                    padding: '16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: device.is_active ? '#f0f4ff' : 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.borderColor = '#667eea'}
                  onMouseOut={(e) => e.target.style.borderColor = '#e5e7eb'}
                >
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{device.name}</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {device.type} {device.is_active && '(Currently Active)'}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowDevicePicker(false)}
              className="btn-secondary"
              style={{ marginTop: '16px', width: '100%' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        {canPlayNext && spotifyPlaylistId && !spotifyError && (
          <button
            className="btn-primary"
            onClick={playNextSongFromPlaylist}
          >
            {songs.length === 0 ? <Play size={20} /> : <SkipForward size={20} />}
            {songs.length === 0 ? 'Play First Song' : 'Next Song'}
          </button>
        )}

        {canPlayNext && !spotifyPlaylistId && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fef3c7',
            border: '2px solid #f59e0b',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#92400e', fontWeight: 600 }}>
              Spotify playlist not configured. Please contact administrator.
            </p>
          </div>
        )}

        {isRoundComplete && (
          <button
            className="btn-primary"
            onClick={handleEndRound}
          >
            <Trophy size={20} />
            End Round
          </button>
        )}
      </div>

      {/* Modals */}
      {showScoring && (editingSongIndex !== null ? songs[editingSongIndex] : songs[currentSongIndex]) && (
        <SongScoring
          song={editingSongIndex !== null ? songs[editingSongIndex] : songs[currentSongIndex]}
          currentTrack={currentTrack}
          hasPlayers={roles.players.length > 0}
          hasStealer={roles.stealer !== null}
          onClose={() => {
            setShowScoring(false);
            setEditingSongIndex(null);
            // Don't change currentSongIndex here
          }}
          onScoreSubmit={editingSongIndex !== null ? handleEditScoreSubmit : handleScoringComplete}
          initialValues={editingSongIndex !== null ? {
            correctArtist: songs[editingSongIndex].correct_artist_guess,
            correctSong: songs[editingSongIndex].correct_song_title_guess,
            correctMovie: songs[editingSongIndex].bonus_correct_movie_guess,
            wasStolen: songs[editingSongIndex].score_type === 'steal'
          } : null}
        />
      )}
    </div>
  );
};

export default RoundGameplay;