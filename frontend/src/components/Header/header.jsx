import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

const Header = ({ isAuthenticated, setIsAuthenticated }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // In a real app, you'd also clear tokens, etc.
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          CampusShop
        </Link>
        <nav>
          <ul className="nav-links">
            {isAuthenticated ? (
              <li>
                <button onClick={handleLogout} className="nav-button logout-button">
                  Logout
                </button>
              </li>
            ) : (
              <>
                <li>
                  <Link to="/login" className="nav-button">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="nav-button register-button">
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
