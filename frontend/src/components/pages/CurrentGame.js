// Save as: frontend/src/components/pages/CurrentGame.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Clock, PlayCircle } from 'lucide-react';
import RoundSetupModal from '../RoundSetupModal';

const CurrentGame = ({ gameId, onGameEnded, onRoundStarted }) => {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRoundSetup, setShowRoundSetup] = useState(false);

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
    if (!dateString) return 'Not started';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEndGame = async () => {
    if (!window.confirm('Are you sure you want to end this game?')) {
      return;
    }

    try {
      await axios.put(`http://localhost:8000/api/games/${gameId}`, {
        ended_at: new Date().toISOString()
      });
      
      // Navigate to game summary
      onGameEnded(gameId);
    } catch (error) {
      console.error('Error ending game:', error);
      setError('Failed to end game. Please try again.');
    }
  };

  const handleRoundCreated = (roundId) => {
    setShowRoundSetup(false);
    onRoundStarted(roundId);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading game...</div>
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
          <div className="empty-state-icon"><PlayCircle size={48} /></div>
          <div className="empty-state-text">No game selected</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '30px' }}>
        <h1>Current Game</h1>
        <p className="subtitle">Game #{game.game_id}</p>
      </div>

      {/* Game Info Card */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '30px',
        borderRadius: '15px',
        marginBottom: '30px'
      }}>
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ opacity: 0.9, fontSize: '14px', marginBottom: '5px' }}>Started</div>
            <div style={{ fontSize: '18px', fontWeight: 600 }}>
              <Clock size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
              {formatDateTime(game.started_at)}
            </div>
          </div>
          {game.ended_at && (
            <div>
              <div style={{ opacity: 0.9, fontSize: '14px', marginBottom: '5px' }}>Ended</div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>
                <Clock size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                {formatDateTime(game.ended_at)}
              </div>
            </div>
          )}
          <div>
            <div style={{ opacity: 0.9, fontSize: '14px', marginBottom: '5px' }}>Players</div>
            <div style={{ fontSize: '18px', fontWeight: 600 }}>
              <Users size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
              {game.participants.length}
            </div>
          </div>
        </div>
      </div>

      {/* Participants Section */}
      <div>
        <h2 style={{ fontSize: '1.5em', marginBottom: '20px', color: '#1f2937' }}>Participants</h2>
        
        {game.participants.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={48} /></div>
            <div className="empty-state-text">No participants in this game</div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            {game.participants
              .sort((a, b) => a.seat_number - b.seat_number)
              .map((participant) => (
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
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
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
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      margin: '0 auto 15px',
                      border: '3px solid #667eea'
                    }}
                  />
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
                    {participant.player.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
                    Seat {participant.seat_number}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Game Actions */}
      <div style={{ marginTop: '40px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button 
          className="btn-primary"
          onClick={() => setShowRoundSetup(true)}
        >
          Start Round
        </button>
        <button 
          className="btn-secondary"
          onClick={handleEndGame}
        >
          End Game
        </button>
      </div>

      {/* Round Setup Modal */}
      {showRoundSetup && (
        <RoundSetupModal
          gameId={gameId}
          participants={game.participants}
          onClose={() => setShowRoundSetup(false)}
          onRoundCreated={handleRoundCreated}
        />
      )}
    </div>
  );
};

export default CurrentGame;