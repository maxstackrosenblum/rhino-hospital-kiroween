import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Settings() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="content">
      <div className="profile-section">
        <h1>Settings</h1>
        <div className="settings-panel">
          <div className="setting-item">
            <div className="setting-info">
              <h3>Theme</h3>
              <p>Switch between light and dark mode</p>
            </div>
            <label className="theme-switch">
              <input
                type="checkbox"
                checked={theme === 'light'}
                onChange={toggleTheme}
              />
              <span className="slider"></span>
            </label>
          </div>
          <button onClick={() => navigate('/')} className="secondary-button" style={{ marginTop: '2rem' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
