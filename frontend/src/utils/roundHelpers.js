/**
 * Assigns roles to participants for a given round number
 * @param {Array} participants - Array of participant objects sorted by seat_number
 * @param {number} roundNumber - The current round number (1-based)
 * @param {number|null} allTimeDjParticipantId - Optional participant ID of the all-time DJ
 * @returns {Object} - Object with DJ, players, stealer, and inactive arrays
 */
export const assignRolesForRound = (participants, roundNumber, allTimeDjParticipantId = null) => {
  const totalPlayers = participants.length;
  
  const roles = {
    dj: null,
    players: [],
    stealer: null,
    inactive: []
  };

  // If there's an all-time DJ, handle rotation differently
  if (allTimeDjParticipantId) {
    // Find the all-time DJ
    const allTimeDj = participants.find(p => p.participant_id === allTimeDjParticipantId);
    if (!allTimeDj) {
      console.error('All-time DJ participant not found!');
      // Fall back to regular rotation
      return assignRolesWithoutAllTimeDj(participants, roundNumber);
    }
    
    roles.dj = allTimeDj;
    
    // Get remaining players (everyone except the all-time DJ)
    const remainingPlayers = participants.filter(p => p.participant_id !== allTimeDjParticipantId);
    const remainingCount = remainingPlayers.length;
    
    // Rotate remaining players through non-DJ roles
    const offset = (roundNumber - 1) % remainingCount;
    const rotated = [...remainingPlayers];
    for (let i = 0; i < offset; i++) {
      rotated.push(rotated.shift());
    }
    
    // Assign roles based on remaining player count
    if (remainingCount === 1) {
      // DJ + 1 other: that person is the player
      roles.players = [rotated[0]];
    } else if (remainingCount === 2) {
      // DJ + 2 others: P1=PLAYER, P2=STEALER
      roles.players = [rotated[0]];
      roles.stealer = rotated[1];
    } else if (remainingCount === 3) {
      // DJ + 3 others: P1&P2=PLAYERS (team), P3=STEALER
      roles.players = [rotated[0], rotated[1]];
      roles.stealer = rotated[2];
    } else {
      // DJ + 4+ others: P1&P2=PLAYERS (team), P3=STEALER, rest=INACTIVE
      roles.players = [rotated[0], rotated[1]];
      roles.stealer = rotated[2];
      roles.inactive = rotated.slice(3);
    }
  } else {
    // No all-time DJ - use regular rotation
    return assignRolesWithoutAllTimeDj(participants, roundNumber);
  }
  
  return roles;
};

/**
 * Helper function for regular role assignment (without all-time DJ)
 * @param {Array} participants - Array of participant objects sorted by seat_number
 * @param {number} roundNumber - The current round number (1-based)
 * @returns {Object} - Object with DJ, players, stealer, and inactive arrays
 */
const assignRolesWithoutAllTimeDj = (participants, roundNumber) => {
  const totalPlayers = participants.length;
  const offset = (roundNumber - 1) % totalPlayers;
  
  // Create a rotated array based on round number
  const rotated = [...participants];
  for (let i = 0; i < offset; i++) {
    rotated.push(rotated.shift());
  }
  
  const roles = {
    dj: null,
    players: [],
    stealer: null,
    inactive: []
  };
  
  // First player in rotated array is always DJ
  roles.dj = rotated[0];
  
  if (totalPlayers === 2) {
    // 2 players: P1=DJ, P2=PLAYER
    roles.players = [rotated[1]];
  } else if (totalPlayers === 3) {
    // 3 players: P1=DJ, P2=PLAYER, P3=STEALER
    roles.players = [rotated[1]];
    roles.stealer = rotated[2];
  } else if (totalPlayers === 4) {
    // 4 players: P1=DJ, P2&P3=PLAYERS (team), P4=STEALER
    roles.players = [rotated[1], rotated[2]];
    roles.stealer = rotated[3];
  } else {
    // 5+ players: P1=DJ, P2&P3=PLAYERS (team), P4=STEALER, rest=INACTIVE
    roles.players = [rotated[1], rotated[2]];
    roles.stealer = rotated[3];
    roles.inactive = rotated.slice(4);
  }
  
  return roles;
};

/**
 * Get role display name
 */
export const getRoleDisplay = (role) => {
  const roleMap = {
    dj: 'DJ',
    player: 'Player',
    stealer: 'Stealer',
    inactive: 'Inactive'
  };
  return roleMap[role] || role;
};

/**
 * Get role color
 */
export const getRoleColor = (role) => {
  const colorMap = {
    dj: '#f59e0b', // amber
    player: '#667eea', // purple
    stealer: '#10b981', // green
    inactive: '#9ca3af' // gray
  };
  return colorMap[role] || '#6b7280';
};