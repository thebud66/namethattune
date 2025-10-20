// frontend/src/components/pages/Home.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CreateGameModal from '../CreateGameModal';
import { PlayCircle, Plus, Trophy, AlertCircle, Settings as SettingsIcon } from 'lucide-react';

const Home = ({ setCurrentPage, setCurrentGameId }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeGame, setActiveGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSpotifyAuthenticated, setIsSpotifyAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkForActiveGame();
    checkSpotifyAuth();
  }, []);

  const checkSpotifyAuth = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/spotify/auth/status');
      setIsSpotifyAuthenticated(response.data.authenticated);
    } catch (error) {
      console.error('Error checking Spotify auth:', error);
      setIsSpotifyAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  const checkForActiveGame = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/games/');
      const games = response.data;
      
      if (games.length === 0) {
        setActiveGame(null);
        setLoading(false);
        return;
      }

      // Get the most recent game
      const mostRecent = games.sort((a, b) => {
        const dateA = new Date(a.started_at || a.created_at);
        const dateB = new Date(b.started_at || b.created_at);
        return dateB - dateA;
      })[0];
      
      setActiveGame(mostRecent);
    } catch (error) {
      console.error('Error checking for active game:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGameCreated = (gameId) => {
    setShowCreateModal(false);
    setCurrentGameId(gameId);
    setCurrentPage('current-game');
  };

  const handleContinueGame = () => {
    if (activeGame) {
      setCurrentGameId(activeGame.game_id);
      
      if (activeGame.ended_at) {
        setCurrentPage('game-summary');
      } else {
        setCurrentPage('current-game');
      }
    }
  };

  const isGameActive = activeGame && !activeGame.ended_at;
  const isGameCompleted = activeGame && activeGame.ended_at;

  return (
    <div className="home-page">
      {/* Spotify Auth Warning */}
      {!checkingAuth && !isSpotifyAuthenticated && (
        <div style={{
          backgroundColor: '#fef3c7',
          border: '2px solid #f59e0b',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px',
          display: 'flex',
          alignItems: 'start',
          gap: '16px'
        }}>
          <AlertCircle size={24} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#92400e', marginBottom: '8px' }}>
              Spotify Not Connected
            </h3>
            <p style={{ color: '#92400e', marginBottom: '12px', lineHeight: '1.6' }}>
              You need to connect your Spotify account to play music during games. 
              Please authorize Spotify in the Settings page.
            </p>
            <button 
              onClick={() => setCurrentPage('settings')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <SettingsIcon size={18} />
              Go to Settings
            </button>
          </div>
        </div>
      )}

      <section className="hero">
        <h1>Welcome to Name That Tune</h1>
        <p className="hero-subtitle">
          Test your music knowledge with friends and family
        </p>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {!loading && !isGameActive && (
            <button 
              className="btn-primary btn-large"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={24} />
              Create New Game
            </button>
          )}
          
          {!loading && isGameActive && (
            <button 
              className="btn-primary btn-large"
              onClick={handleContinueGame}
            >
              <PlayCircle size={24} />
              Continue Game #{activeGame.game_id}
            </button>
          )}

          {!loading && isGameCompleted && (
            <button 
              className="btn-secondary btn-large"
              onClick={handleContinueGame}
            >
              <Trophy size={24} />
              View Game #{activeGame.game_id} Summary
            </button>
          )}
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">🎵</div>
          <h3>Music Trivia</h3>
          <p>Test your music knowledge with songs from your favorite playlists</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">👥</div>
          <h3>Multiplayer Fun</h3>
          <p>Play with friends and family in an exciting competitive format</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🏆</div>
          <h3>Score Points</h3>
          <p>Earn points for correctly guessing songs and artists</p>
        </div>
      </section>

      {showCreateModal && (
        <CreateGameModal
          onClose={() => setShowCreateModal(false)}
          onGameCreated={handleGameCreated}
        />
      )}
    </div>
  );
};

export default Home;