import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Music, Play, SkipForward, CheckCircle, Award } from 'lucide-react';
import SongSelector from '../SongSelector';
import SongScoring from '../SongScoring';

const RoundGameplay = ({ gameId, roundId, onRoundComplete }) => {
  const [round, setRound] = useState(null);
  const [songs, setSongs] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSongSelector, setShowSongSelector] = useState(false);
  const [showScoring, setShowScoring] = useState(false);
  const [roles, setRoles] = useState({ dj: null, players: [], stealer: null });

  const SONGS_PER_ROUND = 10;

  useEffect(() => {
    const initializeRound = async () => {
      const songsCount = await fetchRoundDetails();
      // Set currentSongIndex to songs.length (ready for next song or first song if 0)
      setCurrentSongIndex(songsCount);
      console.log('Initialized round with', songsCount, 'songs, currentSongIndex set to', songsCount);
    };
    
    initializeRound();
  }, [roundId]);

  // Remove the problematic useEffect that was managing currentSongIndex

  const fetchRoundDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/rounds/${roundId}/details`);
      setRound(response.data);
      
      // Extract roles from round teams
      const djTeam = response.data.round_teams.find(t => t.role === 'dj');
      const playerTeam = response.data.round_teams.find(t => t.role === 'player');
      const stealerTeam = response.data.round_teams.find(t => t.role === 'stealer');

      setRoles({
        dj: djTeam?.round_team_players[0]?.participant || null,
        players: playerTeam?.round_team_players.map(rtp => rtp.participant) || [],
        stealer: stealerTeam?.round_team_players[0]?.participant || null
      });

      // Fetch existing songs for this round
      if (response.data.round_songlists) {
        setSongs(response.data.round_songlists);
        console.log('Songs loaded:', response.data.round_songlists.length);
        
        // Return the new songs array length so callers can use it
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

  const handleSongSelected = async (spotifyTrack) => {
    try {
      console.log('Song selected:', spotifyTrack);
      
      // First, ensure artist exists with name
      const artistResponse = await axios.post('http://localhost:8000/api/artists/', {
        spotify_id: spotifyTrack.artists[0].id,
        name: spotifyTrack.artists[0].name
      });
      const artistId = artistResponse.data.artist_id;

      // Ensure song exists with title
      const songResponse = await axios.post('http://localhost:8000/api/songs/', {
        spotify_id: spotifyTrack.id,
        title: spotifyTrack.name
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

      setShowSongSelector(false);
      
      // Refresh to get full details and get the new songs count
      const newSongsLength = await fetchRoundDetails();
      
      // Set index to the last song (the one we just added) for scoring
      setCurrentSongIndex(newSongsLength - 1);
      
      // Show scoring modal
      setShowScoring(true);
      console.log('Opening scoring modal for song at index:', newSongsLength - 1);
    } catch (error) {
      console.error('Error saving song:', error);
      console.error('Error details:', error.response?.data);
      setError('Failed to save song. Please try again.');
    }
  };

  const handleScoringComplete = async (scoringData) => {
    try {
      const currentSong = songs[currentSongIndex];
      console.log('Scoring song:', currentSong, 'at index:', currentSongIndex);
      
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
      
      // Refresh songs list to get updated data and get the new length
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

  console.log('Render state:', {
    songsLength: songs.length,
    currentSongIndex,
    isRoundComplete,
    canPlayNext
  });

  return (
    <div className="container">
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1>Round {round?.round_number}</h1>
        <p className="subtitle">Song {songs.length} of {SONGS_PER_ROUND}</p>
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
                src={roles.dj.player.image_url ? `http://localhost:8000${roles.dj.player.image_url}` : '/images/usr_placeholder.png'}
                alt={roles.dj.player.name}
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ fontWeight: 600, color: '#1f2937' }}>{roles.dj.player.name}</div>
            </div>
          </div>
        )}

        {/* Players */}
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
            {roles.players.length > 1 ? 'PLAYERS' : 'PLAYER'}
          </div>
          {roles.players.map(player => (
            <div key={player.participant_id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <img
                src={player.player.image_url ? `http://localhost:8000${player.player.image_url}` : '/images/usr_placeholder.png'}
                alt={player.player.name}
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ fontWeight: 600, color: '#1f2937' }}>{player.player.name}</div>
            </div>
          ))}
        </div>

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
                src={roles.stealer.player.image_url ? `http://localhost:8000${roles.stealer.player.image_url}` : '/images/usr_placeholder.png'}
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
        {canPlayNext && (
          <button 
            className="btn-primary"
            onClick={() => setShowSongSelector(true)}
          >
            {songs.length === 0 ? <Play size={20} /> : <SkipForward size={20} />}
            {songs.length === 0 ? 'Play First Song' : 'Next Song'}
          </button>
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
      {showSongSelector && (
        <SongSelector
          onClose={() => setShowSongSelector(false)}
          onSongSelected={handleSongSelected}
        />
      )}

      {showScoring && songs.length > currentSongIndex && songs[currentSongIndex] && (
        <SongScoring
          song={songs[currentSongIndex]}
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