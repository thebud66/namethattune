import React, { useEffect, useState } from 'react';
import axios from 'axios';
import EditPlayerModal from './EditPlayerModal';

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
      // check if this player already exists (edit case)
      const exists = prevPlayers.some((p) => p.player_id === updatedPlayer.player_id);

      if (exists) {
        // replace only the matching one
        return prevPlayers.map((p) =>
          p.player_id === updatedPlayer.player_id ? updatedPlayer : p
        );
      } else {
        // append new player
        return [...prevPlayers, updatedPlayer];
      }
    });
  };


  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200 bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-sm font-semibold text-gray-600"
              >
                Image
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-sm font-semibold text-gray-600"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-sm font-semibold text-gray-600"
              >
                Created At
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {players.map((player) => (
              <tr key={player.player_id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <img
                    src={player.image_url || '/images/usr_placeholder.png'}
                    className="w-12 h-12 object-cover rounded-full mx-auto"
                  />
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {player.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(player.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      console.log("Editing player:", player);
                      setSelectedPlayer(player);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <button
          onClick={() => {
            console.log("Add Player clicked");
            setSelectedPlayer({ name: '', image_url: '' });
          }}
          className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add Player
        </button>
      </div>
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
