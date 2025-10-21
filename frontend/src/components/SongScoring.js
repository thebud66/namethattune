import React, { useState } from 'react';
import { X, Award, Users, Target } from 'lucide-react';

const SongScoring = ({ song, currentTrack, hasPlayers, hasStealer, onClose, onScoreSubmit }) => {
  const [correctArtist, setCorrectArtist] = useState(false);
  const [correctSong, setCorrectSong] = useState(false);
  const [correctMovie, setCorrectMovie] = useState(false);
  const [wasStolen, setWasStolen] = useState(false);

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

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className="modal-title" style={{ margin: 0 }}>
            <Target size={24} style={{ display: 'inline', marginRight: '10px', verticalAlign: 'middle' }} />
            Score This Song
          </h2>
          <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={20} />
          </button>
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
          {/* Album Art */}
          {currentTrack?.album?.images?.[0]?.url && (
            <img 
              src={currentTrack.album.images[0].url}
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
              {currentTrack?.name || song.song?.title || 'Song Title'}
            </div>
            <div style={{ fontSize: '16px', color: '#6b7280', marginBottom: '4px' }}>
              {currentTrack?.artists?.map(a => a.name).join(', ') || song.track_info?.artist?.name || 'Artist'}
            </div>
            {currentTrack?.album?.name && (
              <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                {currentTrack.album.name}
              </div>
            )}
          </div>
        </div>

        {/* Scoring Options */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1em', fontWeight: 600, color: '#374151', marginBottom: '16px' }}>
            What did {wasStolen ? 'the stealer' : 'the player(s)'} get correct?
          </h3>

          {/* Rest of the scoring options remain the same */}
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
        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSubmit} className="btn-primary">
            Save Score
          </button>
        </div>
      </div>
    </div>
  );
};

export default SongScoring;