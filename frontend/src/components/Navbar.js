import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

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

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const handleNavigation = (path) => {
    navigate(path);
    setDropdownOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <span className="logo-text">Hospital Management System</span>
      </div>
      <div className="user-menu">
        <button className="user-button" onClick={() => setDropdownOpen(!dropdownOpen)} title={`${user.first_name} ${user.last_name}`}>
          <div className="user-avatar">
            {getInitials(user.first_name, user.last_name)}
          </div>
        </button>
        {dropdownOpen && (
          <div className="dropdown">
            <button className="dropdown-item" onClick={() => handleNavigation('/profile')}>
              Profile
            </button>
            <button className="dropdown-item" onClick={() => handleNavigation('/settings')}>
              Settings
            </button>
            <div className="dropdown-divider"></div>
            <button className="dropdown-item" onClick={onLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
