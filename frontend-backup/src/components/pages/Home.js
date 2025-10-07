import React from 'react';

const Home = () => {
  return (
    <div className="space-y-8">
      <section className="text-center py-20 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to Your Site
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          A beautiful, modern website built with React
        </p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
          Get Started
        </button>
      </section>

      <section className="grid md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3">Feature One</h3>
          <p className="text-gray-600">
            Describe your first key feature or service here. Make it compelling and clear.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3">Feature Two</h3>
          <p className="text-gray-600">
            Highlight another important aspect of what you offer to your visitors.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3">Feature Three</h3>
          <p className="text-gray-600">
            Share a third compelling reason why users should engage with your site.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;