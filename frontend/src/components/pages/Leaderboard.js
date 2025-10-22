import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, TrendingUp, Calendar, Users, Eye } from 'lucide-react';

const Leaderboard = ({ setCurrentPage, setCurrentGameId }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [gameHistory, setGameHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboardData();
    fetchGameHistory();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      // Fetch all games
      const gamesResponse = await axios.get('http://localhost:8000/api/games/');
      const games = gamesResponse.data;

      // Fetch detailed data for each game
      const gamesWithDetails = await Promise.all(
        games.map(async (game) => {
          const detailsResponse = await axios.get(`http://localhost:8000/api/games/${game.game_id}/with-participants`);
          const roundsResponse = await axios.get(`http://localhost:8000/api/rounds/game/${game.game_id}`);
          
          const roundsWithDetails = await Promise.all(
            roundsResponse.data.map(async (round) => {
              const roundDetails = await axios.get(`http://localhost:8000/api/rounds/${round.round_id}/details`);
              return roundDetails.data;
            })
          );

          return {
            game: detailsResponse.data,
            rounds: roundsWithDetails
          };
        })
      );

      // Calculate total scores for all players
      const playerScores = {};

      gamesWithDetails.forEach(({ game, rounds }) => {
        rounds.forEach(round => {
          round.round_teams?.forEach(team => {
            const teamScore = calculateTeamScore(round, team.round_team_id);
            
            team.round_team_players?.forEach(teamPlayer => {
              const participant = game.participants?.find(p => p.participant_id === teamPlayer.participant_id);
              if (participant) {
                const playerId = participant.player.player_id;
                
                if (!playerScores[playerId]) {
                  playerScores[playerId] = {
                    player: participant.player,
                    totalScore: 0,
                    gamesPlayed: new Set()
                  };
                }
                
                playerScores[playerId].totalScore += teamScore;
                playerScores[playerId].gamesPlayed.add(game.game_id);
              }
            });
          });
        });
      });

      // Convert to array, filter players with score > 0, sort by score, and take top 10
      const sortedLeaderboard = Object.values(playerScores)
        .filter(p => p.totalScore > 0)
        .map(p => ({
          ...p,
          gamesPlayed: p.gamesPlayed.size
        }))
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 10);

      setLeaderboard(sortedLeaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchGameHistory = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/games/');
      
      // Fetch full details for each game to determine winner
      const gamesWithWinners = await Promise.all(
        response.data.map(async (game) => {
          const detailsResponse = await axios.get(`http://localhost:8000/api/games/${game.game_id}/with-participants`);
          const roundsResponse = await axios.get(`http://localhost:8000/api/rounds/game/${game.game_id}`);
          
          const roundsWithDetails = await Promise.all(
            roundsResponse.data.map(async (round) => {
              const roundDetails = await axios.get(`http://localhost:8000/api/rounds/${round.round_id}/details`);
              return roundDetails.data;
            })
          );

          // Calculate winner
          const winner = calculateGameWinner(detailsResponse.data, roundsWithDetails);

          return {
            ...game,
            participants: detailsResponse.data.participants,
            winner: winner
          };
        })
      );

      // Sort by most recent first
      const sortedGames = gamesWithWinners.sort((a, b) => {
        const dateA = new Date(a.started_at || a.created_at);
        const dateB = new Date(b.started_at || b.created_at);
        return dateB - dateA;
      });

      setGameHistory(sortedGames);
    } catch (error) {
      console.error('Error fetching game history:', error);
    }
  };

  const calculateTeamScore = (round, teamId) => {
    let score = 0;
    
    round.round_songlists?.forEach(songlist => {
      if (songlist.round_team_id === teamId) {
        if (songlist.correct_artist_guess) score += 1;
        if (songlist.correct_song_title_guess) score += 1;
        if (songlist.bonus_correct_movie_guess) score += 1;
      }
    });
    
    return score;
  };

  const calculateGameWinner = (game, rounds) => {
    const scores = {};
    
    // Initialize scores for all participants
    game.participants?.forEach(participant => {
      scores[participant.participant_id] = {
        player: participant.player,
        totalScore: 0
      };
    });

    // Sum up scores from all rounds
    rounds.forEach(round => {
      round.round_teams?.forEach(team => {
        const teamScore = calculateTeamScore(round, team.round_team_id);
        
        team.round_team_players?.forEach(teamPlayer => {
          if (scores[teamPlayer.participant_id]) {
            scores[teamPlayer.participant_id].totalScore += teamScore;
          }
        });
      });
    });

    // Find the winner
    const sortedScores = Object.values(scores).sort((a, b) => b.totalScore - a.totalScore);
    return sortedScores[0]?.player || null;
  };

  const handleViewGame = (gameId) => {
    setCurrentGameId(gameId);
    setCurrentPage('game-summary');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '12px',
          marginBottom: '12px'
        }}>
          <Trophy size={36} style={{ color: '#f59e0b' }} />
          <h1 style={{ margin: 0 }}>Leaderboard</h1>
        </div>
        <p className="subtitle">Top players across all games</p>
      </div>

      {/* Leaderboard */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '40px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          marginBottom: '24px'
        }}>
          <TrendingUp size={24} style={{ color: '#667eea' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Top 10 Players</h2>
        </div>

        {leaderboard.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Trophy size={48} /></div>
            <div className="empty-state-text">No scores yet. Play some games to see the leaderboard!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {leaderboard.map((entry, index) => (
              <div
                key={entry.player.player_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  background: index < 3 ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' : '#f9fafb',
                  borderRadius: '12px',
                  border: index < 3 ? '2px solid #667eea' : '1px solid #e5e7eb',
                  transition: 'transform 0.2s ease',
                  cursor: 'default'
                }}
              >
                {/* Rank */}
                <div style={{
                  minWidth: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: index === 0 ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
                             index === 1 ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' :
                             index === 2 ? 'linear-gradient(135deg, #cd7f32 0%, #8b4513 100%)' :
                             '#e5e7eb',
                  color: index < 3 ? 'white' : '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 700,
                  boxShadow: index < 3 ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
                }}>
                  {index + 1}
                </div>

                {/* Player Image */}
                <img
                  src={
                    entry.player.image_url
                      ? `http://localhost:8000${entry.player.image_url}`
                      : '/images/usr_placeholder.png'
                  }
                  alt={entry.player.name}
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid white',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                />

                {/* Player Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: 700, 
                    color: '#1f2937',
                    marginBottom: '4px'
                  }}>
                    {entry.player.name}
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Users size={14} />
                    {entry.gamesPlayed} game{entry.gamesPlayed !== 1 ? 's' : ''} played
                  </div>
                </div>

                {/* Total Score */}
                <div style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '24px',
                  minWidth: '80px',
                  textAlign: 'center',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                  {entry.totalScore}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Game History */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          marginBottom: '24px'
        }}>
          <Calendar size={24} style={{ color: '#667eea' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Game History</h2>
        </div>

        {gameHistory.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Calendar size={48} /></div>
            <div className="empty-state-text">No games played yet</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {gameHistory.map((game) => (
              <div
                key={game.game_id}
                onClick={() => handleViewGame(game.game_id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Game Number */}
                <div style={{
                  minWidth: '60px',
                  padding: '8px 12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: 700,
                  textAlign: 'center'
                }}>
                  Game #{game.game_id}
                </div>

                {/* Date */}
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Calendar size={14} />
                    {formatDate(game.started_at || game.created_at)}
                  </div>
                  {game.winner && (
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: 600, 
                      color: '#1f2937',
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <Trophy size={16} style={{ color: '#f59e0b' }} />
                      Winner: {game.winner.name}
                    </div>
                  )}
                </div>

                {/* View Button */}
                <button
                  className="btn-secondary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewGame(game.game_id);
                  }}
                >
                  <Eye size={16} />
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;