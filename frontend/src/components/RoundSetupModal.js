// frontend/src/components/RoundSetupModal.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { X, Music, AlertCircle, Star } from 'lucide-react';
import { assignRolesForRound, getRoleColor } from '../utils/roundHelpers';

const RoundSetupModal = ({ gameId, participants, onClose, onRoundCreated }) => {
  const [nextRoundNumber, setNextRoundNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [game, setGame] = useState(null);

  const fetchGameAndRoundInfo = useCallback(async () => {
    try {
      // Fetch game details to get all_time_dj_participant_id
      const gameResponse = await axios.get(`http://localhost:8000/api/games/${gameId}`);
      setGame(gameResponse.data);
      
      // Fetch rounds to determine next round number
      const roundsResponse = await axios.get(`http://localhost:8000/api/rounds/game/${gameId}`);
      const rounds = roundsResponse.data;
      setNextRoundNumber(rounds.length + 1);
    } catch (error) {
      console.error('Error fetching game info:', error);
      setNextRoundNumber(1);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchGameAndRoundInfo();
  }, [fetchGameAndRoundInfo]);

  const handleStartRound = async () => {
    try {
      console.log('Starting round...', { gameId, nextRoundNumber });
      
      // Create the round
      const roundResponse = await axios.post('http://localhost:8000/api/rounds/', {
        game_id: gameId,
        round_number: nextRoundNumber
      });

      console.log('Round created:', roundResponse.data);
      const roundId = roundResponse.data.round_id;
      
      const sortedParticipants = [...participants].sort((a, b) => a.seat_number - b.seat_number);
      console.log('Sorted participants:', sortedParticipants.map(p => ({
        name: p.player.name,
        seat_number: p.seat_number
      })));
      
      // Assign roles based on round number with sorted participants and all-time DJ
      const roles = assignRolesForRound(
        sortedParticipants, 
        nextRoundNumber,
        game?.all_time_dj_participant_id || null
      );
      console.log('Roles assigned:', roles);
      
      // Create round teams and assign participants
      // DJ team
      console.log('Creating DJ team...');
      const djTeamResponse = await axios.post('http://localhost:8000/api/round-teams/', {
        round_id: roundId,
        role: 'dj'
      });
      console.log('DJ team created:', djTeamResponse.data);
      
      await axios.post('http://localhost:8000/api/round-team-players/', {
        round_team_id: djTeamResponse.data.round_team_id,
        participant_id: roles.dj.participant_id
      });
      console.log('DJ assigned to team');

      // Player team
      if (roles.players.length > 0) {
        console.log('Creating player team...');
        const playerTeamResponse = await axios.post('http://localhost:8000/api/round-teams/', {
          round_id: roundId,
          role: 'player'
        });
        console.log('Player team created:', playerTeamResponse.data);
        
        for (const player of roles.players) {
          await axios.post('http://localhost:8000/api/round-team-players/', {
            round_team_id: playerTeamResponse.data.round_team_id,
            participant_id: player.participant_id
          });
          console.log('Player assigned:', player.player.name);
        }
      }

      // Stealer team
      if (roles.stealer) {
        console.log('Creating stealer team...');
        const stealerTeamResponse = await axios.post('http://localhost:8000/api/round-teams/', {
          round_id: roundId,
          role: 'stealer'
        });
        console.log('Stealer team created:', stealerTeamResponse.data);
        
        await axios.post('http://localhost:8000/api/round-team-players/', {
          round_team_id: stealerTeamResponse.data.round_team_id,
          participant_id: roles.stealer.participant_id
        });
        console.log('Stealer assigned:', roles.stealer.player.name);
      }

      console.log('All teams created successfully. Calling onRoundCreated...');
      onRoundCreated(roundId);
    } catch (error) {
      console.error('Error creating round:', error);
      console.error('Error details:', error.response?.data);
      setError(`Failed to create round: ${error.response?.data?.detail || error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="loading">Loading round information...</div>
        </div>
      </div>
    );
  }

  const roles = assignRolesForRound(
    participants, 
    nextRoundNumber,
    game?.all_time_dj_participant_id || null
  );
  
  const allTimeDj = game?.all_time_dj_participant_id 
    ? participants.find(p => p.participant_id === game.all_time_dj_participant_id)
    : null;

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className="modal-title" style={{ margin: 0 }}>
            <Music size={24} style={{ display: 'inline', marginRight: '10px', verticalAlign: 'middle' }} />
            Start Round {nextRoundNumber}
          </h2>
          <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="error" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {allTimeDj && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '12px',
            backgroundColor: '#fffbeb',
            border: '2px solid #f59e0b',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Star size={18} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#92400e' }}>
                All-Time DJ Mode
              </div>
              <div style={{ fontSize: '12px', color: '#78350f' }}>
                {allTimeDj.player.name} is the DJ for every round
              </div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>
            The following roles will be assigned for Round {nextRoundNumber}:
          </p>

          {/* DJ */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              color: getRoleColor('dj'),
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              DJ
              {allTimeDj && roles.dj.participant_id === allTimeDj.participant_id && (
                <Star size={14} style={{ fill: getRoleColor('dj') }} />
              )}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              backgroundColor: '#fffbeb',
              border: `2px solid ${getRoleColor('dj')}`,
              borderRadius: '10px'
            }}>
              <img
                src={roles.dj.player.image_url 
                  ? `http://localhost:8000${roles.dj.player.image_url}` 
                  : '/images/usr_placeholder.png'}
                alt={roles.dj.player.name}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
              <div>
                <div style={{ fontWeight: 600, color: '#1f2937' }}>{roles.dj.player.name}</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>Seat {roles.dj.seat_number}</div>
              </div>
            </div>
          </div>

          {/* Players */}
          {roles.players.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                color: getRoleColor('player'),
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {roles.players.length > 1 ? 'PLAYERS (Team)' : 'PLAYER'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {roles.players.map(player => (
                  <div
                    key={player.participant_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      backgroundColor: '#f0f4ff',
                      border: `2px solid ${getRoleColor('player')}`,
                      borderRadius: '10px'
                    }}
                  >
                    <img
                      src={player.player.image_url 
                        ? `http://localhost:8000${player.player.image_url}` 
                        : '/images/usr_placeholder.png'}
                      alt={player.player.name}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: '#1f2937' }}>{player.player.name}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>Seat {player.seat_number}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stealer */}
          {roles.stealer && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                color: getRoleColor('stealer'),
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                STEALER
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                backgroundColor: '#f0fdf4',
                border: `2px solid ${getRoleColor('stealer')}`,
                borderRadius: '10px'
              }}>
                <img
                  src={roles.stealer.player.image_url 
                    ? `http://localhost:8000${roles.stealer.player.image_url}` 
                    : '/images/usr_placeholder.png'}
                  alt={roles.stealer.player.name}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
                <div>
                  <div style={{ fontWeight: 600, color: '#1f2937' }}>{roles.stealer.player.name}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>Seat {roles.stealer.seat_number}</div>
                </div>
              </div>
            </div>
          )}

          {/* Inactive */}
          {roles.inactive.length > 0 && (
            <div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                color: getRoleColor('inactive'),
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                INACTIVE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {roles.inactive.map(player => (
                  <div
                    key={player.participant_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                      border: `2px solid ${getRoleColor('inactive')}`,
                      borderRadius: '10px'
                    }}
                  >
                    <img
                      src={player.player.image_url 
                        ? `http://localhost:8000${player.player.image_url}` 
                        : '/images/usr_placeholder.png'}
                      alt={player.player.name}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: '#1f2937' }}>{player.player.name}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>Seat {player.seat_number}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleStartRound} className="btn-primary">
            Start Round
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoundSetupModal;