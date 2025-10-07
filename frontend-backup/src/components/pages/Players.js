import React from 'react';
import PlayerGrid from '../PlayerGrid';

const Players = () => {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Registered Players</h1>
      <div className="prose prose-lg">
        <PlayerGrid />
      <p className="text-gray-700 mb-4">
          provid ability to add new and edit players
        </p>
        <div className="bg-gray-50 p-6 rounded-lg mt-8">
          <h3 className="text-xl font-semibold mb-3">Our Mission</h3>
          <p className="text-gray-700">
            we may not need this.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Players;