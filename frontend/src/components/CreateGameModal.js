import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, GripVertical, Users, AlertCircle } from 'lucide-react';

const CreateGameModal = ({ onClose, onGameCreated }) => {
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
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
        return prev.filter(p => p.player_id !== player.player_id);
      } else {
        return [...prev, player];
      }
    });
    setError('');
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

      await Promise.all(participantPromises);

      // Call the callback with the game ID
      onGameCreated(gameId);
    } catch (error) {
      console.error('Error creating game:', error);
      setError('Failed to create game. Please try again.');
    }
  };

  const isSelected = (playerId) => {
    return selectedPlayers.some(p => p.player_id === playerId);
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '900px', maxHeight: '85vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className="modal-title" style={{ margin: 0 }}>Create New Game</h2>
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

        {players.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={48} /></div>
            <div className="empty-state-text">No players available. Please add players first.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '20px', minHeight: '400px' }}>
            {/* Available Players Section */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1em', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
                Available Players ({players.length})
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', 
                gap: '8px',
                flex: 1,
                alignContent: 'start'
              }}>
                {players.map(player => (
                  <div
                    key={player.player_id}
                    onClick={() => togglePlayer(player)}
                    style={{
                      padding: '10px',
                      border: isSelected(player.player_id) ? '2px solid #667eea' : '2px solid #e5e7eb',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: isSelected(player.player_id) ? '#f0f4ff' : 'white',
                      textAlign: 'center',
                      height: 'fit-content'
                    }}
                  >
                    <img
                      src={player.image_url ? `http://localhost:8000${player.image_url}` : '/images/usr_placeholder.png'}
                      alt={player.name}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        margin: '0 auto 6px'
                      }}
                    />
                    <div style={{ fontSize: '12px', fontWeight: 500, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {player.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: '1px', backgroundColor: '#e5e7eb' }}></div>

            {/* Selected Players Section */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1em', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
                Selected Players ({selectedPlayers.length})
                {selectedPlayers.length > 0 && (
                  <span style={{ fontSize: '0.8em', fontWeight: 400, color: '#6b7280', marginLeft: '8px' }}>
                    (Drag to reorder)
                  </span>
                )}
              </h3>
              {selectedPlayers.length === 0 ? (
                <div style={{ 
                  flex: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#9ca3af',
                  fontSize: '14px',
                  fontStyle: 'italic',
                  border: '2px dashed #e5e7eb',
                  borderRadius: '10px',
                  padding: '20px'
                }}>
                  Click players to select them
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, alignContent: 'start' }}>
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
                        gap: '10px',
                        padding: '8px 12px',
                        backgroundColor: 'white',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'grab',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <GripVertical size={16} style={{ color: '#9ca3af', flexShrink: 0 }} />
                      <div style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        backgroundColor: '#667eea',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '12px',
                        flexShrink: 0
                      }}>
                        {index + 1}
                      </div>
                      <img
                        src={player.image_url ? `http://localhost:8000${player.image_url}` : '/images/usr_placeholder.png'}
                        alt={player.name}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0
                        }}
                      />
                      <div style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {player.name}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlayer(player);
                        }}
                        className="btn-icon delete"
                        style={{ width: '28px', height: '28px', flexShrink: 0 }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="modal-actions" style={{ marginTop: '24px' }}>
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button 
            onClick={handleStartGame} 
            className="btn-primary"
            disabled={selectedPlayers.length < 2}
            style={{
              opacity: selectedPlayers.length < 2 ? 0.5 : 1,
              cursor: selectedPlayers.length < 2 ? 'not-allowed' : 'pointer'
            }}
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGameModal;