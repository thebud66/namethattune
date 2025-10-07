import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/pages/Home';
import Players from './components/pages/Players';
import Contact from './components/pages/Contact';
import Settings from './components/pages/Settings';
import SpotifySearch from './components/pages/SpotifySearch';

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
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    
    <div className="min-h-screen bg-gray-50">
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </main>

      <Footer />
    </div>
  );
};

export default App;