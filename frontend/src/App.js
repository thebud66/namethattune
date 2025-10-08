import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/pages/Home';
import Players from './components/pages/Players';
import Contact from './components/pages/Contact';
import Settings from './components/pages/Settings';
import SpotifySearch from './components/pages/SpotifySearch';
import SpotifyPlayer from './components/pages/SpotifyPlayer'; // ADD THIS
import './styles/namethattune.css';

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');

  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return <Home />;
      case 'players':
        return <Players />;
      case 'contact':
        return <Contact />;
      case 'settings':
        return <Settings />;
      case 'spotify-search':
        return <SpotifySearch />;
      case 'spotify-player':  // ADD THIS CASE
        return <SpotifyPlayer />;
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