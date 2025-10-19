// Save as: frontend/src/components/SongSelector.js
import React, { useState } from 'react';
import { X, Search, Music } from 'lucide-react';

const SongSelector = ({ onClose, onSongSelected }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search term');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `http://localhost:8000/api/spotify/search/tracks?q=${encodeURIComponent(searchQuery)}&limit=20`
      );

      if (!response.ok) {
        throw new Error('Failed to search tracks');
      }

      const tracks = await response.json();
      setSearchResults(tracks);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectSong = (track) => {
    // Pass full Spotify track object with all needed data
    const spotifyTrack = {
      id: track.id,
      name: track.name,
      artists: track.artists.map(artist => ({
        id: artist,  // This will be the artist name from the simplified Track model
        name: artist
      })),
      album: track.album,
      duration_ms: track.duration_ms,
      popularity: track.popularity
    };
    
    onSongSelected(spotifyTrack);
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '700px', maxHeight: '85vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className="modal-title" style={{ margin: 0 }}>
            <Music size={24} style={{ display: 'inline', marginRight: '10px', verticalAlign: 'middle' }} />
            Select a Song
          </h2>
          <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '24px' }}>
          <div className="input-group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search for a song or artist..."
              autoFocus
            />
            <button onClick={handleSearch} className="btn-primary">
              <Search size={18} />
              Search
            </button>
          </div>
        </div>

        {error && (
          <div className="error" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {loading && (
          <div className="loading">Searching...</div>
        )}

        {/* Search Results */}
        {!loading && searchResults.length > 0 && (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {searchResults.map((track) => (
                <div
                  key={track.id}
                  onClick={() => handleSelectSong(track)}
                  style={{
                    padding: '12px',
                    backgroundColor: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <Music size={20} style={{ color: '#667eea', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#1f2937', marginBottom: '2px' }}>
                      {track.name}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {track.artists.join(', ')}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                      {track.album}
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#9ca3af', flexShrink: 0 }}>
                    {formatDuration(track.duration_ms)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && searchResults.length === 0 && searchQuery && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
            No songs found. Try a different search.
          </div>
        )}

        {!loading && searchResults.length === 0 && !searchQuery && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
            Search for a song to get started
          </div>
        )}
      </div>
    </div>
  );
};

export default SongSelector;