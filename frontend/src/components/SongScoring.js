import React, { useState } from 'react';
import { Award, Users, Target } from 'lucide-react';

const SongScoring = ({ 
  song, 
  currentTrack, 
  hasPlayers, 
  hasStealer, 
  onClose, 
  onScoreSubmit,
  initialValues = null  // NEW: Accept initial values for editing
}) => {
  // Initialize with existing values if editing, otherwise default to false
  const [correctArtist, setCorrectArtist] = useState(initialValues?.correctArtist ?? false);
  const [correctSong, setCorrectSong] = useState(initialValues?.correctSong ?? false);
  const [correctMovie, setCorrectMovie] = useState(initialValues?.correctMovie ?? false);
  const [wasStolen, setWasStolen] = useState(initialValues?.wasStolen ?? false);

  const canHaveBonus = correctArtist || correctSong;
  const totalPoints = (correctArtist ? 1 : 0) + (correctSong ? 1 : 0) + (canHaveBonus && correctMovie ? 1 : 0);

  const handleSubmit = () => {
    onScoreSubmit({
      correctArtist,
      correctSong,
      correctMovie: canHaveBonus && correctMovie,
      wasStolen
    });
  };

  // Determine if we're editing
  const isEditing = initialValues !== null;

  // When editing, prioritize song data; when scoring new, prioritize currentTrack
  const displayTitle = isEditing 
    ? (song.song?.title || currentTrack?.name || 'Song Title')
    : (currentTrack?.name || song.song?.title || 'Song Title');
    
  const displayArtist = isEditing
    ? (song.track_info?.artist?.name || currentTrack?.artists?.map(a => a.name).join(', ') || 'Artist')
    : (currentTrack?.artists?.map(a => a.name).join(', ') || song.track_info?.artist?.name || 'Artist');
    
  const displayAlbumArt = !isEditing && currentTrack?.album?.images?.[0]?.url;
  const displayAlbumName = !isEditing && currentTrack?.album?.name;

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '600px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 className="modal-title" style={{ margin: 0 }}>
            <Target size={24} style={{ display: 'inline', marginRight: '10px', verticalAlign: 'middle' }} />
            {isEditing ? 'Edit Song Score' : 'Score This Song'}
          </h2>
        </div>

        {/* Song Info with Album Art */}
        <div style={{
          padding: '20px',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          marginBottom: '24px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center'
        }}>
          {/* Album Art - only show when scoring new songs */}
          {displayAlbumArt && (
            <img
              src={displayAlbumArt}
              alt={currentTrack.album.name}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '8px',
                objectFit: 'cover',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                flexShrink: 0
              }}
            />
          )}

          {/* Track Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '20px', color: '#1f2937', marginBottom: '6px' }}>
              {displayTitle}
            </div>
            <div style={{ fontSize: '16px', color: '#6b7280', marginBottom: '4px' }}>
              {displayArtist}
            </div>
            {displayAlbumName && (
              <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                {displayAlbumName}
              </div>
            )}
          </div>
        </div>

        {/* Scoring Options */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1em', fontWeight: 600, color: '#374151', marginBottom: '16px' }}>
            What did {wasStolen ? 'the stealer' : 'the player(s)'} get correct?
          </h3>

          {/* Rest of the scoring options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Artist */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px',
                backgroundColor: correctArtist ? '#f0f4ff' : 'white',
                border: `2px solid ${correctArtist ? '#667eea' : '#e5e7eb'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                type="checkbox"
                checked={correctArtist}
                onChange={(e) => setCorrectArtist(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#667eea' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#1f2937' }}>Correct Artist</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>+1 point</div>
              </div>
            </label>

            {/* Song Title */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px',
                backgroundColor: correctSong ? '#f0f4ff' : 'white',
                border: `2px solid ${correctSong ? '#667eea' : '#e5e7eb'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                type="checkbox"
                checked={correctSong}
                onChange={(e) => setCorrectSong(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#667eea' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#1f2937' }}>Correct Song Title</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>+1 point</div>
              </div>
            </label>

            {/* Movie Bonus */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px',
                backgroundColor: correctMovie && canHaveBonus ? '#fffbeb' : 'white',
                border: `2px solid ${correctMovie && canHaveBonus ? '#f59e0b' : '#e5e7eb'}`,
                borderRadius: '10px',
                cursor: canHaveBonus ? 'pointer' : 'not-allowed',
                opacity: canHaveBonus ? 1 : 0.5,
                transition: 'all 0.2s ease'
              }}
            >
              <input
                type="checkbox"
                checked={correctMovie && canHaveBonus}
                onChange={(e) => canHaveBonus && setCorrectMovie(e.target.checked)}
                disabled={!canHaveBonus}
                style={{ width: '20px', height: '20px', cursor: canHaveBonus ? 'pointer' : 'not-allowed', accentColor: '#f59e0b' }}
              />
              <Award size={20} style={{ color: canHaveBonus ? '#f59e0b' : '#d1d5db' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#1f2937' }}>Movie Bonus</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  +1 point (requires artist OR song)
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Stealer Option */}
        {hasStealer && (correctArtist || correctSong || (canHaveBonus && correctMovie)) && (
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px',
                backgroundColor: wasStolen ? '#f0fdf4' : 'white',
                border: `2px solid ${wasStolen ? '#10b981' : '#e5e7eb'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                type="checkbox"
                checked={wasStolen}
                onChange={(e) => setWasStolen(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#10b981' }}
              />
              <Users size={20} style={{ color: wasStolen ? '#10b981' : '#6b7280' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#1f2937' }}>Stolen by Stealer</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  Points go to stealer instead of players
                </div>
              </div>
            </label>
          </div>
        )}

        {/* Score Summary */}
        <div style={{
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
            Total Points {wasStolen ? '(Stealer)' : '(Players)'}
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#667eea' }}>
            {totalPoints}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="modal-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          {isEditing && (
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          )}
          <button onClick={handleSubmit} className="btn-primary">
            {isEditing ? 'Update Score' : 'Save Score'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SongScoring;