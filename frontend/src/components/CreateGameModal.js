import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, GripVertical, Users, AlertCircle, Music } from 'lucide-react';

const CreateGameModal = ({ onClose, onGameCreated }) => {
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [allTimeDjPlayerId, setAllTimeDjPlayerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/players');
      setPlayers(response.data);
    } catch (error) {
      console.error('Error fetching players:', error);
      setError('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const togglePlayer = (player) => {
    setSelectedPlayers(prev => {
      const exists = prev.find(p => p.player_id === player.player_id);
      if (exists) {
        // If removing a player who is the all-time DJ, clear that selection
        if (allTimeDjPlayerId === player.player_id) {
          setAllTimeDjPlayerId(null);
        }
        return prev.filter(p => p.player_id !== player.player_id);
      } else {
        return [...prev, player];
      }
    });
    setError('');
  };

  const handleAllTimeDjToggle = (playerId) => {
    if (allTimeDjPlayerId === playerId) {
      setAllTimeDjPlayerId(null);
    } else {
      setAllTimeDjPlayerId(playerId);
    }
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newPlayers = [...selectedPlayers];
    const draggedPlayer = newPlayers[draggedIndex];
    newPlayers.splice(draggedIndex, 1);
    newPlayers.splice(index, 0, draggedPlayer);
    
    setSelectedPlayers(newPlayers);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleStartGame = async () => {
    if (selectedPlayers.length < 2) {
      setError('Please select at least 2 players to start a game');
      return;
    }

    try {
      // Create the game
      const gameResponse = await axios.post('http://localhost:8000/api/games/', {
        started_at: new Date().toISOString()
      });
      
      const gameId = gameResponse.data.game_id;

      // Add participants with seat numbers
      const participantPromises = selectedPlayers.map((player, index) => 
        axios.post('http://localhost:8000/api/participants/', {
          game_id: gameId,
          player_id: player.player_id,
          seat_number: index + 1
        })
      );

      const participantResponses = await Promise.all(participantPromises);

      // If an all-time DJ was selected, update the game with the participant ID
      if (allTimeDjPlayerId) {
        const allTimeDjParticipant = participantResponses.find(
          resp => selectedPlayers.find(p => p.player_id === allTimeDjPlayerId)?.player_id === 
                  selectedPlayers[participantResponses.indexOf(resp)]?.player_id
        );
        
        // Find the correct participant ID
        let allTimeDjParticipantId = null;
        for (let i = 0; i < selectedPlayers.length; i++) {
          if (selectedPlayers[i].player_id === allTimeDjPlayerId) {
            allTimeDjParticipantId = participantResponses[i].data.participant_id;
            break;
          }
        }

        if (allTimeDjParticipantId) {
          await axios.put(`http://localhost:8000/api/games/${gameId}`, {
            all_time_dj_participant_id: allTimeDjParticipantId
          });
        }
      }

      // Call the callback with the game ID
      onGameCreated(gameId);
    } catch (error) {
      console.error('Error creating game:', error);
      setError('Failed to create game. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="loading">Loading players...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '700px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className="modal-title" style={{ margin: 0 }}>
            <Users size={24} style={{ display: 'inline', marginRight: '10px', verticalAlign: 'middle' }} />
            Create New Game
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

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#1f2937' }}>
            Select Players
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px',
            maxHeight: '250px',
            overflowY: 'auto',
            padding: '4px'
          }}>
            {players.map(player => {
              const isSelected = selectedPlayers.find(p => p.player_id === player.player_id);
              return (
                <div
                  key={player.player_id}
                  onClick={() => togglePlayer(player)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    border: `2px solid ${isSelected ? '#667eea' : '#e5e7eb'}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#f0f4ff' : '#ffffff',
                    transition: 'all 0.2s'
                  }}
                >
                  <img
                    src={player.image_url ? `http://localhost:8000${player.image_url}` : '/images/usr_placeholder.png'}
                    alt={player.name}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontWeight: 600, 
                      color: '#1f2937',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {player.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedPlayers.length > 0 && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#1f2937' }}>
                Seat Order (Drag to Reorder)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedPlayers.map((player, index) => (
                  <div
                    key={player.player_id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      cursor: 'move'
                    }}
                  >
                    <GripVertical size={20} style={{ color: '#9ca3af' }} />
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#667eea',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '14px'
                    }}>
                      {index + 1}
                    </div>
                    <img
                      src={player.image_url ? `http://localhost:8000${player.image_url}` : '/images/usr_placeholder.png'}
                      alt={player.name}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#1f2937' }}>{player.name}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>Seat {index + 1}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#1f2937' }}>
                <Music size={18} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                All-Time DJ (Optional)
              </h3>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                Select one player to be the DJ for every round. Other players will rotate through remaining roles.
                Leave unselected for normal role rotation.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedPlayers.map((player) => (
                  <div
                    key={player.player_id}
                    onClick={() => handleAllTimeDjToggle(player.player_id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      backgroundColor: allTimeDjPlayerId === player.player_id ? '#fffbeb' : '#f9fafb',
                      border: `2px solid ${allTimeDjPlayerId === player.player_id ? '#f59e0b' : '#e5e7eb'}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${allTimeDjPlayerId === player.player_id ? '#f59e0b' : '#9ca3af'}`,
                      backgroundColor: allTimeDjPlayerId === player.player_id ? '#f59e0b' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {allTimeDjPlayerId === player.player_id && (
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: 'white'
                        }} />
                      )}
                    </div>
                    <img
                      src={player.image_url ? `http://localhost:8000${player.image_url}` : '/images/usr_placeholder.png'}
                      alt={player.name}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: '#1f2937' }}>{player.name}</div>
                      {allTimeDjPlayerId === player.player_id && (
                        <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 600 }}>
                          ALL-TIME DJ
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button 
            onClick={handleStartGame} 
            className="btn-primary"
            disabled={selectedPlayers.length < 2}
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGameModal;