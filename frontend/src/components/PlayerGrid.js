import React, { useEffect, useState } from 'react';
import axios from 'axios';
import EditPlayerModal from './EditPlayerModal';
import '../styles/namethattune.css';

export default function PlayerGrid() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/players");
      setPlayers(response.data);
    } catch (error) {
      console.error("Error fetching players:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlayer = (updatedPlayer) => {
    setPlayers((prevPlayers) => {
      const exists = prevPlayers.some((p) => p.player_id === updatedPlayer.player_id);
      if (exists) {
        return prevPlayers.map((p) =>
          p.player_id === updatedPlayer.player_id ? updatedPlayer : p
        );
      } else {
        return [...prevPlayers, updatedPlayer];
      }
    });
  };

  const handleDeletePlayer = async (playerId) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      try {
        await axios.delete(`http://localhost:8000/api/players/${playerId}`);
        setPlayers((prevPlayers) => 
          prevPlayers.filter((p) => p.player_id !== playerId)
        );
      } catch (error) {
        console.error("Error deleting player:", error);
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading players</div>;
  }

  return (
    <div>
      {/* Add Player Button */}
      <div className="mb-4">
        <button
          onClick={() => setSelectedPlayer({ name: '', image_url: '' })}
          className="btn-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Player
        </button>
      </div>

      {/* Players Table */}
      {players.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-text">No players yet. Add your first player to get started!</div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.player_id}>
                  <td>
                    <img
                      src={
                        player.image_url 
                          ? `http://localhost:8000${player.image_url}` 
                          : '/images/usr_placeholder.png'
                      }
                      alt={player.name}
                      className="player-avatar"
                    />
                  </td>
                  <td>
                    <span className="player-name">{player.name}</span>
                  </td>
                  <td>
                    <span className="player-date">
                      {new Date(player.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group">
                      <button
                        onClick={() => setSelectedPlayer(player)}
                        className="btn-icon edit"
                        title="Edit player"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeletePlayer(player.player_id)}
                        className="btn-icon delete"
                        title="Delete player"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {selectedPlayer && (
        <EditPlayerModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          onUpdate={handleUpdatePlayer}
        />
      )}
    </div>
  );
}