import { useState, useEffect } from 'react';

function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Roho Safi System</h1>
      <h2>Backend Connection Test</h2>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {health ? (
        <div>
          <p>Status: {health.status}</p>
          <p>Database time: {health.dbTime}</p>
        </div>
      ) : (
        !error && <p>Loading...</p>
      )}
    </div>
  );
}

export default App;