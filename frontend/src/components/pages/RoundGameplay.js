// Save as: frontend/src/components/pages/RoundGameplay.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Music, Play, SkipForward, CheckCircle, Award } from 'lucide-react';
import { getRoleColor } from '../../utils/roundHelpers';
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
    fetchRoundDetails();
  }, [roundId]);

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
        setCurrentSongIndex(response.data.round_songlists.length);
      }
    } catch (error) {
      console.error('Error fetching round details:', error);
      setError('Failed to load round details');
    } finally {
      setLoading(false);
    }
  };

  const handleSongSelected = async (spotifyTrack) => {
    try {
      // First, ensure artist exists
      const artistResponse = await axios.post('http://localhost:8000/api/artists/', {
        spotify_id: spotifyTrack.artists[0].id
      });
      const artistId = artistResponse.data.artist_id;

      // Ensure song exists
      const songResponse = await axios.post('http://localhost:8000/api/songs/', {
        spotify_id: spotifyTrack.id
      });
      const songId = songResponse.data.song_id;

      // Ensure track_info exists
      await axios.post('http://localhost:8000/api/track-infos/', {
        song_id: songId,
        artist_id: artistId
      });

      // Create round songlist entry (with player team as default)
      const playerTeam = round.round_teams.find(t => t.role === 'player');
      const songlistResponse = await axios.post('http://localhost:8000/api/round-songlists/', {
        round_id: roundId,
        song_id: songId,
        round_team_id: playerTeam.round_team_id,
        correct_artist_guess: false,
        correct_song_title_guess: false,
        bonus_correct_movie_guess: false,
        score_type: 'standard'
      });

      // Add to local state with spotify data
      setSongs([...songs, { 
        ...songlistResponse.data, 
        spotify_data: spotifyTrack 
      }]);
      
      setShowSongSelector(false);
      setShowScoring(true);
    } catch (error) {
      console.error('Error saving song:', error);
      setError('Failed to save song. Please try again.');
    }
  };

  const handleScoringComplete = async (scoringData) => {
    try {
      const currentSong = songs[currentSongIndex];
      
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

      // Refresh songs list
      await fetchRoundDetails();
      
      setShowScoring(false);
      
      // Move to next song
      if (currentSongIndex < SONGS_PER_ROUND - 1) {
        setCurrentSongIndex(currentSongIndex + 1);
      }
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
      // Navigate back to current game
      onRoundComplete();
    } catch (error) {
      console.error('Error ending round:', error);
      setError('Failed to end round');
    }
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
                        {song.spotify_data?.name || 'Song Title'}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {song.spotify_data?.artists?.map(a => a.name).join(', ') || 'Artist'}
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

      {showScoring && songs[currentSongIndex] && (
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