import React, { useState } from 'react';
import { Menu, X, Mail, Settings, Music, Users, Play } from 'lucide-react';

const Header = ({ currentPage, setCurrentPage }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navItems = [
    { id: 'home', label: 'Home', icon: Music },
    { id: 'players', label: 'Players', icon: Users },
    { id: 'spotify-search', label: 'Search', icon: Music },
    { id: 'spotify-player', label: 'Player', icon: Play },
    { id: 'contact', label: 'Contact', icon: Mail },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          <div className="brand">
            <h1 className="brand-title">🎵 Name That Tune</h1>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="nav-desktop">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                >
                  <IconComponent size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="menu-toggle"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="nav-mobile">
          <div className="nav-mobile-content">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id);
                    setIsMenuOpen(false);
                  }}
                  className={`nav-item-mobile ${currentPage === item.id ? 'active' : ''}`}
                >
                  <IconComponent size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;