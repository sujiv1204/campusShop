import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = ({ isAuthenticated }) => {
  return (
    <div className="home-container">
      {isAuthenticated ? (
        <>
          <h1 className="home-title">Welcome Back to CampusShop!</h1>
          <p className="home-subtitle">You are logged in and ready to shop.</p>
        </>
      ) : (
        <>
          <h1 className="home-title">Welcome to CampusShop</h1>
          <p className="home-subtitle">Your one-stop shop for campus needs.</p>
          <div className="home-actions">
            <Link to="/login" className="home-button">Login</Link>
            <Link to="/register" className="home-button register-link">Create an Account</Link>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
