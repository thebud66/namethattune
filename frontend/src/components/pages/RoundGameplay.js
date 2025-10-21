import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Music, Play, SkipForward, CheckCircle, Award } from 'lucide-react';
import SongScoring from '../SongScoring';

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

  const SONGS_PER_ROUND = 10;

  useEffect(() => {
    const initializeRound = async () => {
      await fetchGameDetails();
      await fetchSpotifyPlaylistSetting();
      const songsCount = await fetchRoundDetails();
      setCurrentSongIndex(songsCount);

      // Pause playback when starting round
      await pausePlayback();
      console.log('Round initialized, playback paused');
    };

    initializeRound();
  }, [roundId, gameId]);

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

  const fetchGameDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/games/${gameId}`);
      setGame(response.data);
      console.log('Game details:', response.data);
    } catch (error) {
      console.error('Error fetching game details:', error);
      setError('Failed to load game details');
    }
  };

  const fetchRoundDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/rounds/${roundId}/details`);
      setRound(response.data);

      const djTeam = response.data.round_teams.find(t => t.role === 'dj');
      const playerTeam = response.data.round_teams.find(t => t.role === 'player');
      const stealerTeam = response.data.round_teams.find(t => t.role === 'stealer');

      setRoles({
        dj: djTeam?.round_team_players[0]?.participant || null,
        players: playerTeam?.round_team_players.map(rtp => rtp.participant) || [],
        stealer: stealerTeam?.round_team_players[0]?.participant || null
      });

      if (response.data.round_songlists) {
        setSongs(response.data.round_songlists);
        console.log('Songs loaded:', response.data.round_songlists.length);
        return response.data.round_songlists.length;
      }
      return 0;
    } catch (error) {
      console.error('Error fetching round details:', error);
      setError('Failed to load round details');
      return 0;
    } finally {
      setLoading(false);
    }
  };

  const pausePlayback = async () => {
    try {
      await axios.put('http://localhost:8000/api/spotify/me/player/pause');
      console.log('Playback paused');
    } catch (error) {
      if (error.response?.status === 404) {
        console.warn('No active Spotify device found');
        // Don't treat this as a critical error
        return;
      }
      console.error('Error pausing playback:', error);
    }
  };

  const playNextSongFromPlaylist = async () => {
    try {
      if (!spotifyPlaylistId) {
        setError('Spotify playlist not configured');
        return;
      }

      // Check if something is currently playing and pause it
      console.log('Checking current playback state...');
      const stateResponse = await axios.get('http://localhost:8000/api/spotify/me/player');
      if (stateResponse.data && stateResponse.data.is_playing) {
        await pausePlayback();
        // Wait a bit for pause to complete
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Check current playback state
      let hasActiveDevice = false;
      try {
        const stateResponse = await axios.get('http://localhost:8000/api/spotify/me/player');
        hasActiveDevice = !!stateResponse.data;
        if (stateResponse.data?.is_playing) {
          await pausePlayback();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        if (error.response?.status === 404 || error.response?.status === 500) {
          // No active device yet, that's okay - starting playback will activate one
          console.log('No active device found, will activate when playing');
        }
      }

      // Enable shuffle mode
      try {
        await axios.put('http://localhost:8000/api/spotify/me/player/shuffle?state=true');
        console.log('Shuffle enabled');
      } catch (error) {
        console.warn('Could not enable shuffle:', error);
      }

      // Start playback from playlist (shuffle will randomize the tracks)
      await axios.put('http://localhost:8000/api/spotify/me/player/play', {
        context_uri: `spotify:playlist:${spotifyPlaylistId}`
      });

      // Wait a moment for playback to start
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get currently playing track info
      const trackResponse = await axios.get('http://localhost:8000/api/spotify/me/player/currently-playing');

      if (trackResponse.data) {
        const track = trackResponse.data;
        setCurrentTrack(track);

        // Save track to database
        await saveTrackToRound(track);
      }
    } catch (error) {
      console.error('Error playing next song:', error);
      setError('Failed to play next song. Make sure Spotify is active.');
    }
  };

  const saveTrackToRound = async (track) => {
    try {
      console.log('Saving track:', track);
      console.log('Track artists:', track.artists);  // ADD THIS LINE

      if (!track.artists || track.artists.length === 0) {
        throw new Error('Track has no artists');
      }

      // Ensure artist exists
      const artistResponse = await axios.post('http://localhost:8000/api/artists/', {
        spotify_id: track.artists[0].id,
        name: track.artists[0].name
      });
      const artistId = artistResponse.data.artist_id;

      // Ensure song exists
      const songResponse = await axios.post('http://localhost:8000/api/songs/', {
        spotify_id: track.id,
        title: track.name
      });
      const songId = songResponse.data.song_id;

      // Ensure track_info exists
      const trackInfoResponse = await axios.post('http://localhost:8000/api/track-infos/', {
        song_id: songId,
        artist_id: artistId
      });
      const trackInfoId = trackInfoResponse.data.track_info_id;

      // Create round songlist entry
      const playerTeam = round.round_teams.find(t => t.role === 'player');
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

      // Refresh round details to get new song
      const newSongsLength = await fetchRoundDetails();

      // Set index to the last song (the one we just added) for scoring
      setCurrentSongIndex(newSongsLength - 1);

      // Show scoring modal
      setShowScoring(true);
      console.log('Opening scoring modal for song at index:', newSongsLength - 1);
    } catch (error) {
      console.error('Error saving track:', error);
      setError('Failed to save track. Please try again.');
    }
  };

  const handleScoringComplete = async (scoringData) => {
    try {
      const currentSong = songs[currentSongIndex];
      console.log('Scoring song:', currentSong, 'at index:', currentSongIndex);

      // Pause playback when scoring is complete
      await pausePlayback();

      // Determine which team gets the points
      const targetTeamId = scoringData.wasStolen ?
        round.round_teams.find(t => t.role === 'stealer')?.round_team_id :
        round.round_teams.find(t => t.role === 'player')?.round_team_id;

      // Update the round songlist with scoring
      await axios.put(`http://localhost:8000/api/round-songlists/${currentSong.round_songlist_id}`, {
        round_team_id: targetTeamId,
        correct_artist_guess: scoringData.correctArtist,
        correct_song_title_guess: scoringData.correctSong,
        bonus_correct_movie_guess: scoringData.correctMovie,
        score_type: scoringData.wasStolen ? 'steal' : 'standard'
      });

      setShowScoring(false);

      // Refresh songs list to get updated data
      const newSongsLength = await fetchRoundDetails();

      // Move index to "ready for next song" position
      setCurrentSongIndex(newSongsLength);
      console.log('Set currentSongIndex to:', newSongsLength, '(ready for next song)');
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
      // Pause playback when ending round
      await pausePlayback();

      // Mark the round as complete
      await axios.put(`http://localhost:8000/api/rounds/${roundId}`, {
        is_complete: true
      });
      console.log('Round marked as complete');

      // Navigate back to current game
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

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
      </div>
    );
  }

  const isRoundComplete = songs.length >= SONGS_PER_ROUND;
  const canPlayNext = currentSongIndex === songs.length && !isRoundComplete;

  return (
    <div className="container">
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1>Round {round?.round_number}</h1>
        <p className="subtitle">Song {songs.length} of {SONGS_PER_ROUND}</p>
        {spotifyPlaylistId && (
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
            🎵 Playing from playlist (ID: {spotifyPlaylistId})
          </p>
        )}
      </div>

      {/* Roles Display */}
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
              fontSize: '12px',
              fontWeight: 600,
              color: getRoleColor('dj'),
              textTransform: 'uppercase',
              marginBottom: '8px'
            }}>
              DJ
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src={roles.dj.player.image_url ?
                  `http://localhost:8000${roles.dj.player.image_url}` :
                  '/images/usr_placeholder.png'}
                alt={roles.dj.player.name}
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ fontWeight: 600, color: '#1f2937' }}>{roles.dj.player.name}</div>
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
              fontSize: '12px',
              fontWeight: 600,
              color: getRoleColor('player'),
              textTransform: 'uppercase',
              marginBottom: '8px'
            }}>
              PLAYERS ({roles.players.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {roles.players.map(participant => (
                <div key={participant.participant_id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src={participant.player.image_url ?
                      `http://localhost:8000${participant.player.image_url}` :
                      '/images/usr_placeholder.png'}
                    alt={participant.player.name}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
                    {participant.player.name}
                  </div>
                </div>
              ))}
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
              fontSize: '12px',
              fontWeight: 600,
              color: getRoleColor('stealer'),
              textTransform: 'uppercase',
              marginBottom: '8px'
            }}>
              STEALER
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src={roles.stealer.player.image_url ?
                  `http://localhost:8000${roles.stealer.player.image_url}` :
                  '/images/usr_placeholder.png'}
                alt={roles.stealer.player.name}
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ fontWeight: 600, color: '#1f2937' }}>{roles.stealer.player.name}</div>
            </div>
          </div>
        )}
      </div>

      {/* Songs List */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.5em', marginBottom: '20px', color: '#1f2937' }}>Songs</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Array.from({ length: SONGS_PER_ROUND }).map((_, index) => {
            const song = songs[index];
            const isPlayed = index < songs.length;
            const isCurrent = index === currentSongIndex;

            return (
              <div
                key={index}
                style={{
                  padding: '16px',
                  backgroundColor: isCurrent ? '#f0f4ff' : isPlayed ? 'white' : '#f9fafb',
                  border: `2px solid ${isCurrent ? '#667eea' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}
              >
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
                    <Music size={20} style={{ color: '#667eea' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#1f2937' }}>
                        {song.song?.title || 'Song Title'}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {song.track_info?.artist?.name || 'Artist'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {song.correct_artist_guess && <CheckCircle size={18} style={{ color: '#10b981' }} />}
                      {song.correct_song_title_guess && <CheckCircle size={18} style={{ color: '#10b981' }} />}
                      {song.bonus_correct_movie_guess && <Award size={18} style={{ color: '#f59e0b' }} />}
                      {song.score_type === 'steal' && (
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#10b981' }}>STOLEN</span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
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
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        {canPlayNext && spotifyPlaylistId && (
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
            End Round
          </button>
        )}
      </div>
      
      {/* Modals */}
      {showScoring && songs.length > currentSongIndex && songs[currentSongIndex] && (
        <SongScoring
          song={songs[currentSongIndex]}
          currentTrack={currentTrack}  // ADD THIS LINE
          hasPlayers={roles.players.length > 0}
          hasStealer={roles.stealer !== null}
          onClose={() => setShowScoring(false)}
          onScoreSubmit={handleScoringComplete}
        />
      )}
    </div>
  );
};

export default RoundGameplay;