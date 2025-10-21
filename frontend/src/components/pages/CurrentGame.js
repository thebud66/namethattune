import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, PlayCircle, Trophy, Music } from 'lucide-react';
import RoundSetupModal from '../RoundSetupModal';

const CurrentGame = ({ gameId, onGameEnded, onRoundStarted }) => {
  const [game, setGame] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [activeRound, setActiveRound] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRoundSetup, setShowRoundSetup] = useState(false);

  useEffect(() => {
    if (gameId) {
      fetchGameDetails();
      fetchAllRounds();
      checkForActiveRound();
    }
  }, [gameId]);

  const fetchGameDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/games/${gameId}/with-participants`);
      setGame(response.data);
    } catch (error) {
      console.error('Error fetching game:', error);
      setError('Failed to load game details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRounds = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/rounds/game/${gameId}`);
      const roundsData = response.data;
      
      // Fetch detailed info for each round
      const roundsWithDetails = await Promise.all(
        roundsData.map(async (round) => {
          const detailsResponse = await axios.get(`http://localhost:8000/api/rounds/${round.round_id}/details`);
          return detailsResponse.data;
        })
      );
      
      setRounds(roundsWithDetails);
    } catch (error) {
      console.error('Error fetching rounds:', error);
    }
  };

  const checkForActiveRound = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/rounds/game/${gameId}/active`);
      setActiveRound(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setActiveRound(null);
      } else {
        console.error('Error checking for active round:', error);
      }
    }
  };

  const calculateTotalScores = () => {
    const scores = {};
    
    // Initialize scores for all participants
    game?.participants.forEach(participant => {
      scores[participant.participant_id] = {
        player: participant.player,
        totalScore: 0,
        seatNumber: participant.seat_number
      };
    });

    // Sum up scores from all rounds
    rounds.forEach(round => {
      round.round_teams?.forEach(team => {
        team.round_team_players?.forEach(teamPlayer => {
          const participantId = teamPlayer.participant_id;
          const roundScore = calculateTeamScore(round, team.round_team_id);
          
          if (scores[participantId]) {
            scores[participantId].totalScore += roundScore;
          }
        });
      });
    });

    // Convert to array and sort by score (descending)
    return Object.values(scores).sort((a, b) => b.totalScore - a.totalScore);
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

  const getRoundScores = (round) => {
    const scores = {};
    
    round.round_teams?.forEach(team => {
      const teamScore = calculateTeamScore(round, team.round_team_id);
      
      team.round_team_players?.forEach(teamPlayer => {
        const participant = game.participants.find(p => p.participant_id === teamPlayer.participant_id);
        if (participant) {
          scores[teamPlayer.participant_id] = {
            player: participant.player,
            score: teamScore,
            role: team.role,
            seatNumber: participant.seat_number
          };
        }
      });
    });
    
    return Object.values(scores);
  };

  const getRoleColor = (role) => {
    const colorMap = {
      dj: '#f59e0b',
      player: '#667eea',
      stealer: '#10b981'
    };
    return colorMap[role] || '#6b7280';
  };

  const getRoleLabel = (role) => {
    const labelMap = {
      dj: 'DJ',
      player: 'Player',
      stealer: 'Stealer'
    };
    return labelMap[role] || role;
  };

  const handleEndGame = async () => {
    if (!window.confirm('Are you sure you want to end this game?')) {
      return;
    }

    try {
      await axios.put(`http://localhost:8000/api/games/${gameId}`, {
        ended_at: new Date().toISOString()
      });
      
      onGameEnded(gameId);
    } catch (error) {
      console.error('Error ending game:', error);
      setError('Failed to end game. Please try again.');
    }
  };

  const handleRoundCreated = (roundId) => {
    setShowRoundSetup(false);
    onRoundStarted(roundId);
  };

  const handleContinueRound = () => {
    if (activeRound) {
      onRoundStarted(activeRound.round_id);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading game...</div>
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

  if (!game) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="empty-state-icon"><PlayCircle size={48} /></div>
          <div className="empty-state-text">No game selected</div>
        </div>
      </div>
    );
  }

  const totalScores = calculateTotalScores();

  return (
    <div className="container">
      <div style={{ marginBottom: '30px' }}>
        <h1>Current Game</h1>
        <p className="subtitle">Game #{game.game_id}</p>
      </div>

      {/* Total Scores Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '30px',
        borderRadius: '15px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          marginBottom: '20px'
        }}>
          <Trophy size={28} />
          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Total Scores</h2>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {totalScores.map((playerScore, index) => (
            <div
              key={playerScore.player.player_id}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: index === 0 ? '3px solid #fbbf24' : '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                position: 'relative'
              }}
            >
              {index === 0 && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  background: '#fbbf24',
                  color: '#92400e',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 700
                }}>
                  👑
                </div>
              )}
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: 'rgba(255, 255, 255, 0.3)',
                color: 'white',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 600
              }}>
                {playerScore.seatNumber}
              </div>
              <img
                src={
                  playerScore.player.image_url
                    ? `http://localhost:8000${playerScore.player.image_url}`
                    : '/images/usr_placeholder.png'
                }
                alt={playerScore.player.name}
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  margin: '0 auto 12px',
                  border: '3px solid white'
                }}
              />
              <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                {playerScore.player.name}
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: 700,
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                {playerScore.totalScore}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>points</div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Round Notice */}
      {activeRound && (
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '5px' }}>
              Round {activeRound.round_number} In Progress
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              {activeRound.round_songlists?.length || 0} of 10 songs played
            </div>
          </div>
          <button 
            onClick={handleContinueRound}
            style={{
              padding: '12px 24px',
              background: 'white',
              color: '#10b981',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            Continue Round
          </button>
        </div>
      )}

      {/* Rounds History */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '20px', color: '#1f2937' }}>
          <Music size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          Rounds
        </h2>
        
        {rounds.length === 0 ? (
          <div style={{
            background: '#f9fafb',
            border: '2px dashed #d1d5db',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            No rounds played yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {rounds.map((round) => {
              const roundScores = getRoundScores(round);
              const songsPlayed = round.round_songlists?.length || 0;
              
              return (
                <div
                  key={round.round_id}
                  style={{
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '24px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div>
                      <h3 style={{ 
                        fontSize: '18px', 
                        fontWeight: 700, 
                        color: '#1f2937',
                        marginBottom: '4px'
                      }}>
                        Round {round.round_number}
                      </h3>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {songsPlayed} song{songsPlayed !== 1 ? 's' : ''} played
                        {!round.is_complete && ' • In Progress'}
                        {round.is_complete && ' • Complete'}
                      </div>
                    </div>
                  </div>

                  {/* Round Participants and Scores */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    {roundScores
                      .sort((a, b) => a.seatNumber - b.seatNumber)
                      .map((playerData) => (
                      <div
                        key={playerData.player.player_id}
                        style={{
                          background: '#f9fafb',
                          border: `2px solid ${getRoleColor(playerData.role)}`,
                          borderRadius: '8px',
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          minWidth: '140px'
                        }}
                      >
                        <img
                          src={
                            playerData.player.image_url
                              ? `http://localhost:8000${playerData.player.image_url}`
                              : '/images/usr_placeholder.png'
                          }
                          alt={playerData.player.name}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: `2px solid ${getRoleColor(playerData.role)}`
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#1f2937',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {playerData.player.name}
                          </div>
                          <div style={{
                            fontSize: '10px',
                            color: getRoleColor(playerData.role),
                            fontWeight: 600,
                            textTransform: 'uppercase'
                          }}>
                            {getRoleLabel(playerData.role)}
                          </div>
                        </div>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: 700,
                          color: getRoleColor(playerData.role),
                          minWidth: '24px',
                          textAlign: 'right'
                        }}>
                          {playerData.score}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Game Actions */}
      <div style={{ 
        marginTop: '40px', 
        display: 'flex', 
        gap: '12px', 
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {!activeRound && (
          <button 
            className="btn-primary"
            onClick={() => setShowRoundSetup(true)}
          >
            Start New Round
          </button>
        )}
        <button 
          className="btn-secondary"
          onClick={handleEndGame}
        >
          End Game
        </button>
      </div>

      {/* Round Setup Modal */}
      {showRoundSetup && (
        <RoundSetupModal
          gameId={gameId}
          participants={game.participants}
          onClose={() => setShowRoundSetup(false)}
          onRoundCreated={handleRoundCreated}
        />
      )}
    </div>
  );
};

export default CurrentGame;