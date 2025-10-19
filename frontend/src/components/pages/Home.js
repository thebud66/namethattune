// Update: frontend/src/components/pages/Home.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CreateGameModal from '../CreateGameModal';
import { PlayCircle, Plus, Trophy } from 'lucide-react';

const Home = ({ setCurrentPage, setCurrentGameId }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeGame, setActiveGame] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkForActiveGame();
  }, []);

  const checkForActiveGame = async () => {
    try {
      // Get the most recent game
      const response = await axios.get('http://localhost:8000/api/games/');
      const games = response.data;
      
      if (games.length === 0) {
        setActiveGame(null);
        setLoading(false);
        return;
      }

      // Get the most recent game (by started_at or created_at)
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
      
      // If game is completed, go to summary, otherwise go to current game
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