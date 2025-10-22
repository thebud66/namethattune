import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Music, Play, SkipForward, CheckCircle, Award, Trophy } from 'lucide-react';
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
  const [spotifyError, setSpotifyError] = useState(false);

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
      const response = await axios.get(`http://localhost:8000/api/games/${gameId}/with-participants`);
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

  const calculateRoundScores = () => {
    const scores = {};
    
    // Initialize scores for all participants with roles
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

    // Calculate scores from songs
    round?.round_teams?.forEach(team => {
      let teamScore = 0;
      
      // Sum up team's score from all songs
      songs.forEach(song => {
        if (song.round_team_id === team.round_team_id) {
          if (song.correct_artist_guess) teamScore += 1;
          if (song.correct_song_title_guess) teamScore += 1;
          if (song.bonus_correct_movie_guess) teamScore += 1;
        }
      });

      // Assign team score to all team members
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
    setSpotifyError(false); // Clear any previous error
    setError(''); // Clear error message
    
    try {
      if (!spotifyPlaylistId) {
        setError('Spotify playlist not configured');
        return;
      }

      console.log('Checking current playback state...');
      
      let stateResponse;
      try {
        stateResponse = await axios.get('http://localhost:8000/api/spotify/me/player');
      } catch (stateError) {
        console.warn('Error checking playback state:', stateError);
        // Continue anyway, don't fail here
      }
      
      if (stateResponse?.data && stateResponse.data.is_playing) {
        await pausePlayback();
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      let hasActiveDevice = false;
      try {
        const deviceResponse = await axios.get('http://localhost:8000/api/spotify/me/player');
        hasActiveDevice = !!deviceResponse.data?.device?.id;
      } catch (err) {
        console.warn('Could not check device state:', err);
      }

      console.log('Playing random track from playlist...');
      const playResponse = await axios.put('http://localhost:8000/api/spotify/me/player/play', {
        context_uri: `spotify:playlist:${spotifyPlaylistId}`,
        offset: { position: Math.floor(Math.random() * 100) }
      });
      console.log('Play response received');

      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Waited 1 second, now getting currently playing track...');

      const nowPlayingResponse = await axios.get('http://localhost:8000/api/spotify/me/player/currently-playing');
      console.log('Now playing response:', nowPlayingResponse.data);
      
      // The track data is directly in the response, not in an 'item' property
      const track = nowPlayingResponse.data.item || nowPlayingResponse.data;
      console.log('Track extracted:', track);
      
      setCurrentTrack(track);

      if (track) {
        console.log('Track exists, calling saveTrackToRound');
        await saveTrackToRound(track);
      } else {
        console.error('No track found in response');
        setError('Failed to get track information from Spotify');
      }
    } catch (err) {
      console.error('Error playing track:', err);
      console.log('Setting spotifyError to true');
      console.log('Setting error message');
      setSpotifyError(true);
      setError('Failed to play track from Spotify. Make sure Spotify is active.');
      console.log('State should be updated now');
    }
  };

  const saveTrackToRound = async (track) => {
    try {
      console.log('Saving track:', track);
      console.log('Track artists:', track.artists);

      if (!track.artists || track.artists.length === 0) {
        throw new Error('Track has no artists');
      }

      const artistResponse = await axios.post('http://localhost:8000/api/artists/', {
        spotify_id: track.artists[0].id,
        name: track.artists[0].name
      });
      const artistId = artistResponse.data.artist_id;

      const songResponse = await axios.post('http://localhost:8000/api/songs/', {
        spotify_id: track.id,
        title: track.name
      });
      const songId = songResponse.data.song_id;

      const trackInfoResponse = await axios.post('http://localhost:8000/api/track-infos/', {
        song_id: songId,
        artist_id: artistId
      });
      const trackInfoId = trackInfoResponse.data.track_info_id;

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

      const newSongsLength = await fetchRoundDetails();
      setCurrentSongIndex(newSongsLength - 1);
      
      console.log('About to show scoring modal');
      console.log('Current song index:', newSongsLength - 1);
      console.log('Songs array:', songs);
      console.log('Setting showScoring to true');
      
      setShowScoring(true);
      
      console.log('showScoring should now be true');
    } catch (error) {
      console.error('Error saving track:', error);
      setError('Failed to save track. Please try again.');
    }
  };

  const handleScoringComplete = async (scoringData) => {
    try {
      const currentSong = songs[currentSongIndex];
      console.log('Scoring song:', currentSong, 'at index:', currentSongIndex);

      // Removed await pausePlayback(); - Keep music playing during scoring

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

      const newSongsLength = await fetchRoundDetails();
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

  if (error && !loading && !showScoring) {
    return (
      <div className="container">
        <div style={{
          padding: '20px',
          backgroundColor: '#fef2f2',
          border: '2px solid #ef4444',
          borderRadius: '12px',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '0 auto'
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
      </div>
    );
  }

  const isRoundComplete = songs.length >= SONGS_PER_ROUND;
  const canPlayNext = currentSongIndex === songs.length && !isRoundComplete;
  const roundScores = calculateRoundScores();
  const hasSpotifyError = error && error.includes('Spotify');

  console.log('Error state:', error);
  console.log('SpotifyError state:', spotifyError);
  console.log('hasSpotifyError computed:', hasSpotifyError);

  return (
    <div className="container">
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1>Round {round?.round_number}</h1>
        <p className="subtitle">Song {songs.length} of {SONGS_PER_ROUND}</p>
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
                {roles.players.length > 1 ? 'Players' : 'Player'}
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                color: getRoleColor('player')
              }}>
                {roundScores.find(s => s.role === 'player')?.score || 0}
              </div>
            </div>
            {roles.players.map((player) => (
              <div key={player.participant_id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <img
                  src={player.player.image_url ?
                    `http://localhost:8000${player.player.image_url}` :
                    '/images/usr_placeholder.png'}
                  alt={player.player.name}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div style={{ fontWeight: 600, color: '#1f2937' }}>{player.player.name}</div>
              </div>
            ))}
          </div>
        )}

        {/* Stealer */}
        {roles.stealer && (
          <div style={{
            padding: '16px',
            backgroundColor: '#ecfdf5',
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

      {/* Error Display */}
      {error && (
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
          <p>STEP 1</p>
        </div>
      )}
      
      {error && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p>STEP 2 - separate div</p>
          <button
            type="button"
            onClick={playNextSongFromPlaylist}
            className="btn-primary"
          >
            Retry
          </button>
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
            End Round
          </button>
        )}
      </div>
      
      {/* Modals */}
      {console.log('Render check - showScoring:', showScoring)}
      {console.log('Render check - songs.length:', songs.length)}
      {console.log('Render check - currentSongIndex:', currentSongIndex)}
      {console.log('Render check - should show modal:', showScoring && songs.length > currentSongIndex && songs[currentSongIndex])}
      
      {showScoring && songs.length > currentSongIndex && songs[currentSongIndex] && (
        <SongScoring
          song={songs[currentSongIndex]}
          currentTrack={currentTrack}
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