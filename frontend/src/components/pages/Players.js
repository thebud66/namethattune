import React from 'react';
import PlayerGrid from '../PlayerGrid';

const Players = () => {
  return (
    <div className="container">
      <h1>Registered Players</h1>
        <p className="subtitle">Manage players for game participation</p>
        <PlayerGrid />
    </div>
  );
};

export default Players;