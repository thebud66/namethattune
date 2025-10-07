import React from 'react';

const Home = () => {
  return (
    <div className="home-page">
      <section className="hero">
        <h1>Welcome to Name That Tune</h1>
        <p className="hero-subtitle">
          Test your music knowledge with friends and family
        </p>
        <button className="btn-primary btn-large">
          Get Started
        </button>
      </section>

      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">🎵</div>
          <h3>Search Songs</h3>
          <p>
            Access millions of tracks from Spotify to create the perfect music quiz.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">👥</div>
          <h3>Manage Players</h3>
          <p>
            Keep track of all participants and their scores in one convenient place.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🏆</div>
          <h3>Compete & Win</h3>
          <p>
            Challenge friends and see who can name the most tunes correctly.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;