import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('Loading...');
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => setMessage('Error connecting to backend'));

    fetch('http://localhost:8000/api/health')
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>React + FastAPI + PostgreSQL</h1>
        <p>{message}</p>
        {health && (
          <div>
            <p>Status: {health.status}</p>
            <p>Database: {health.database}</p>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
