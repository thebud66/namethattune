import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Users, GripVertical, AlertCircle } from 'lucide-react';

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
      const response = await axios.get('http://127.0.0.1:8000/api/players/');
      setPlayers(response.data);
    } catch (err) {
      console.error('Error fetching players:', err);
      setError('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const togglePlayer = (player) => {
    const isSelected = selectedPlayers.find(p => p.player_id === player.player_id);
    if (isSelected) {
      setSelectedPlayers(selectedPlayers.filter(p => p.player_id !== player.player_id));
      if (allTimeDjPlayerId === player.player_id) {
        setAllTimeDjPlayerId(null);
      }
    } else {
      setSelectedPlayers([...selectedPlayers, player]);
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
      setError('Please select at least 2 players');
      return;
    }

    try {
      const gameData = {
        player_ids: selectedPlayers.map(p => p.player_id),
        all_time_dj_player_id: allTimeDjPlayerId
      };

      const response = await axios.post('http://127.0.0.1:8000/api/games/', gameData);
      onGameCreated(response.data.game_id);
    } catch (err) {
      console.error('Error creating game:', err);
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
      <div className="modal" style={{ 
        maxWidth: '700px', 
        maxHeight: '90vh', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        {/* Fixed Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px',
          flexShrink: 0
        }}>
          <h2 className="modal-title" style={{ margin: 0 }}>
            <Users size={24} style={{ display: 'inline', marginRight: '10px', verticalAlign: 'middle' }} />
            Create New Game
          </h2>
          <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          overflowX: 'hidden',
          marginBottom: '24px',
          paddingRight: '8px',
          minHeight: 0  // Important for Firefox
        }}>
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
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                      <div style={{ fontWeight: 600, color: '#1f2937' }}>{player.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#1f2937' }}>
                  Select ALL-TIME DJ (Optional)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedPlayers.map(player => (
                    <div
                      key={player.player_id}
                      onClick={() => setAllTimeDjPlayerId(
                        allTimeDjPlayerId === player.player_id ? null : player.player_id
                      )}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
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
        </div>

        {/* Fixed Footer with Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'flex-end',
          flexShrink: 0,
          borderTop: '1px solid #e5e7eb',
          paddingTop: '20px'
        }}>
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