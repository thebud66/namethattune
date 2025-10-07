import React, { useState } from 'react';

const SpotifySearch = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedTrack, setSelectedTrack] = useState(null);

    const API_BASE_URL = 'http://localhost:8000/api/spotify';

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            searchTracks();
        }
    };

    const getTrackById = async (trackId) => {
        setLoading(true);
        setError('');
        setSearchResults([]);

        try {
            const response = await fetch(`${API_BASE_URL}/tracks/${trackId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const track = await response.json();
            setSelectedTrack(track);
        } catch (err) {
            setError(`Failed to fetch track: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const searchTracks = async (query) => {
        const q = query || searchQuery.trim();

        if (!q) {
            setError('Please enter a search query');
            return;
        }

        setLoading(true);
        setError('');
        setSelectedTrack(null);

        try {
            const response = await fetch(
                `${API_BASE_URL}/search/tracks?q=${encodeURIComponent(q)}&limit=10`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const tracks = await response.json();
            setSearchResults(tracks);
        } catch (err) {
            setError(`Failed to search tracks: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (ms) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="container">
            <h1>🎵 Spotify Track Finder</h1>
            <p className="subtitle">Search for tracks or try our quick examples</p>

            <div className="search-section">
                <div className="input-group">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for a song or artist..."
                        onKeyPress={handleKeyPress}
                    />
                    <button onClick={() => searchTracks()}>Search</button>
                </div>

                <div className="quick-buttons">
                    <button 
                        className="quick-btn" 
                        onClick={() => getTrackById('11dFghVXANMlKmJXsNCbNl')}
                    >
                        Get "Cut To The Feeling"
                    </button>
                    <button 
                        className="quick-btn" 
                        onClick={() => getTrackById('3n3Ppam7vgaVa1iaRUc9Lp')}
                    >
                        Get "Mr. Brightside"
                    </button>
                    <button 
                        className="quick-btn" 
                        onClick={() => getTrackById('0VjIjW4GlUZAMYd2vXMi3b')}
                    >
                        Get "Blinding Lights"
                    </button>
                    <button 
                        className="quick-btn" 
                        onClick={() => searchTracks('Beatles')}
                    >
                        Search "Beatles"
                    </button>
                </div>
            </div>

            {loading && (
                <div className="loading">
                    Loading...
                </div>
            )}

            {error && (
                <div className="error">
                    {error}
                </div>
            )}

            {searchResults.length > 0 && (
                <div className="search-results">
                    {searchResults.map((track) => (
                        <div 
                            key={track.id}
                            className="result-item" 
                            onClick={() => setSelectedTrack(track)}
                        >
                            <div className="result-info">
                                <div className="result-title">{track.name}</div>
                                <div className="result-artist">
                                    {track.artists.join(', ')}
                                </div>
                            </div>
                            <div className="result-duration">
                                {formatDuration(track.duration_ms)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedTrack && (
                <div className="track-card">
                    <div className="track-header">
                        <div className="track-icon">🎵</div>
                        <div className="track-info">
                            <h2>{selectedTrack.name}</h2>
                            <div className="track-artist">
                                {selectedTrack.artists.join(', ')}
                            </div>
                        </div>
                    </div>
                    
                    <div className="track-details">
                        <div className="detail-item">
                            <div className="detail-label">Album</div>
                            <div className="detail-value">{selectedTrack.album}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">Duration</div>
                            <div className="detail-value">
                                {formatDuration(selectedTrack.duration_ms)}
                            </div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">Popularity</div>
                            <div className="detail-value">
                                {selectedTrack.popularity || 0}/100
                            </div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">Track ID</div>
                            <div 
                                className="detail-value" 
                                style={{ fontSize: '0.8em', wordBreak: 'break-all' }}
                            >
                                {selectedTrack.id}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpotifySearch;