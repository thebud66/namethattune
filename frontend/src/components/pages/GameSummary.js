// Save as: frontend/src/components/pages/GameSummary.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Clock, Users, Home } from 'lucide-react';

const GameSummary = ({ gameId, setCurrentPage }) => {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (gameId) {
      fetchGameDetails();
    }
  }, [gameId]);

  const fetchGameDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/games/${gameId}/with-participants`);
      setGame(response.data);
    } catch (error) {
      console.error('Error fetching game:', error);
      setError('Failed to load game details');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = () => {
    if (!game?.started_at || !game?.ended_at) return 'N/A';
    const start = new Date(game.started_at);
    const end = new Date(game.ended_at);
    const diff = end - start;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading game summary...</div>
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

  if (!game) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="empty-state-icon"><Trophy size={48} /></div>
          <div className="empty-state-text">No game found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎉</div>
        <h1>Game Complete!</h1>
        <p className="subtitle">Game #{game.game_id} Summary</p>
      </div>

      {/* Game Stats Card */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '30px',
        borderRadius: '15px',
        marginBottom: '30px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
          <div>
            <div style={{ opacity: 0.9, fontSize: '14px', marginBottom: '5px' }}>Started</div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>
              {formatDateTime(game.started_at)}
            </div>
          </div>
          <div>
            <div style={{ opacity: 0.9, fontSize: '14px', marginBottom: '5px' }}>Ended</div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>
              {formatDateTime(game.ended_at)}
            </div>
          </div>
          <div>
            <div style={{ opacity: 0.9, fontSize: '14px', marginBottom: '5px' }}>Duration</div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>
              <Clock size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              {calculateDuration()}
            </div>
          </div>
          <div>
            <div style={{ opacity: 0.9, fontSize: '14px', marginBottom: '5px' }}>Players</div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>
              <Users size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              {game.participants.length}
            </div>
          </div>
        </div>
      </div>

      {/* Participants Section */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.5em', marginBottom: '20px', color: '#1f2937' }}>Participants</h2>
        
        {game.participants.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={48} /></div>
            <div className="empty-state-text">No participants in this game</div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '16px'
          }}>
            {game.participants
              .sort((a, b) => a.seat_number - b.seat_number)
              .map((participant, index) => (
                <div
                  key={participant.participant_id}
                  style={{
                    backgroundColor: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 600
                  }}>
                    {participant.seat_number}
                  </div>
                  <img
                    src={
                      participant.player.image_url
                        ? `http://localhost:8000${participant.player.image_url}`
                        : '/images/usr_placeholder.png'
                    }
                    alt={participant.player.name}
                    style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      margin: '0 auto 12px',
                      border: '3px solid #667eea'
                    }}
                  />
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>
                    {participant.player.name}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button 
          className="btn-primary"
          onClick={() => setCurrentPage('home')}
        >
          <Home size={20} />
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default GameSummary;