import React, { useEffect, useState } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLogin, setIsLogin] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: ''
  });
  const [profileData, setProfileData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (token) {
      fetchUserInfo();
    }
  }, [token]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.user-menu')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/api/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        localStorage.removeItem('token');
        setToken(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const endpoint = isLogin ? '/api/login' : '/api/register';
    const body = isLogin 
      ? { username: formData.username, password: formData.password }
      : formData;

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          localStorage.setItem('token', data.access_token);
          setToken(data.access_token);
        } else {
          setIsLogin(true);
          setSuccess('Registration successful! Please login.');
        }
      } else {
        setError(data.detail || 'An error occurred');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const openProfile = () => {
    setProfileData({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      password: ''
    });
    setShowProfile(true);
    setDropdownOpen(false);
    setError('');
    setSuccess('');
  };

  const closeProfile = () => {
    setShowProfile(false);
    setError('');
    setSuccess('');
  };

  const openSettings = () => {
    setShowSettings(true);
    setShowProfile(false);
    setDropdownOpen(false);
    setError('');
    setSuccess('');
  };

  const closeSettings = () => {
    setShowSettings(false);
  };

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const updateData = {};
    if (profileData.email !== user.email) updateData.email = profileData.email;
    if (profileData.first_name !== user.first_name) updateData.first_name = profileData.first_name;
    if (profileData.last_name !== user.last_name) updateData.last_name = profileData.last_name;
    if (profileData.password) updateData.password = profileData.password;

    if (Object.keys(updateData).length === 0) {
      setError('No changes to save');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data);
        setSuccess('Profile updated successfully!');
        setTimeout(() => {
          closeProfile();
        }, 1500);
      } else {
        setError(data.detail || 'An error occurred');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  if (user) {
    return (
      <div className="App">
        <nav className="navbar">
          <div className="logo">
            <span className="logo-text">Hospital Management System</span>
          </div>
          <div className="user-menu">
            <button className="user-button" onClick={toggleDropdown} title={`${user.first_name} ${user.last_name}`}>
              <div className="user-avatar">
                {getInitials(user.first_name, user.last_name)}
              </div>
            </button>
            {dropdownOpen && (
              <div className="dropdown">
                <button className="dropdown-item" onClick={openProfile}>
                  Profile
                </button>
                <button className="dropdown-item" onClick={openSettings}>
                  Settings
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>
        <div className="content">
          {showProfile ? (
            <div className="profile-section">
              <h1>Edit Profile</h1>
              <form onSubmit={handleProfileSubmit} className="profile-form">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={profileData.first_name}
                    onChange={handleProfileChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={profileData.last_name}
                    onChange={handleProfileChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter new password"
                    value={profileData.password}
                    onChange={handleProfileChange}
                  />
                </div>
                {error && <p className="error">{error}</p>}
                {success && <p className="success">{success}</p>}
                <div className="button-group">
                  <button type="submit">Save Changes</button>
                  <button type="button" onClick={closeProfile} className="secondary-button">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : showSettings ? (
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
                <button onClick={closeSettings} className="secondary-button" style={{ marginTop: '2rem' }}>
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1>Welcome, {user.first_name} {user.last_name}!</h1>
              <p>Username: {user.username}</p>
              <p>Email: {user.email}</p>
              <p>Member since: {new Date(user.created_at).toLocaleDateString()}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>{isLogin ? 'Login' : 'Register'}</h1>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <input
                type="text"
                name="first_name"
                placeholder="First Name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="last_name"
                placeholder="Last Name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </>
          )}
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
        </form>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <p className="toggle">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Register' : 'Login'}
          </span>
        </p>
      </header>
    </div>
  );
}

export default App;
