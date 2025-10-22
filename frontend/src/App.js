import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/pages/Home';
import Leaderboard from './components/pages/Leaderboard';
import Players from './components/pages/Players';
import Contact from './components/pages/Contact';
import Settings from './components/pages/Settings';
import SpotifySearch from './components/pages/SpotifySearch';
import SpotifyPlayer from './components/pages/SpotifyPlayer';
import CurrentGame from './components/pages/CurrentGame';
import GameSummary from './components/pages/GameSummary';
import RoundGameplay from './components/pages/RoundGameplay';
import './styles/namethattune.css';

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [currentGameId, setCurrentGameId] = useState(null);
  const [currentRoundId, setCurrentRoundId] = useState(null);

  const handleGameEnded = (gameId) => {
    setCurrentGameId(gameId);
    setCurrentPage('game-summary');
  };

  const handleRoundStarted = (roundId) => {
    setCurrentRoundId(roundId);
    setCurrentPage('round-gameplay');
  };

  const handleRoundComplete = () => {
    setCurrentRoundId(null);
    setCurrentPage('current-game');
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return <Home setCurrentPage={setCurrentPage} setCurrentGameId={setCurrentGameId} />;
      case 'leaderboard':
        return <Leaderboard setCurrentPage={setCurrentPage} setCurrentGameId={setCurrentGameId} />;
      case 'players':
        return <Players />;
      case 'contact':
        return <Contact />;
      case 'settings':
        return <Settings />;
      case 'spotify-search':
        return <SpotifySearch />;
      case 'spotify-player':
        return <SpotifyPlayer />;
      case 'current-game':
        return <CurrentGame gameId={currentGameId} onGameEnded={handleGameEnded} onRoundStarted={handleRoundStarted} />;
      case 'game-summary':
        return <GameSummary gameId={currentGameId} setCurrentPage={setCurrentPage} />;
      case 'round-gameplay':
        return <RoundGameplay gameId={currentGameId} roundId={currentRoundId} onRoundComplete={handleRoundComplete} />;
      default:
        return <div className="error">Page not found</div>;
    }
  };

  return (
    <div className="app-container">
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
      
      <main className="main-content">
        {renderContent()}
      </main>

      <Footer />
    </div>
  );
};

export default App;