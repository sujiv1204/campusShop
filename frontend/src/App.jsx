import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header/header';
import LandingPage from './pages/LandingPage/landingPage';
import Login from './pages/Login/login';
import Register from './pages/Register/register';
import CreateItem from './pages/CreateItem/createItem'; 
import Dashboard from './pages/Dashboard/dashboard'; 
import './App.css';

function App() {
  // Check localStorage for a token to determine initial auth state.
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    // Clear the token from storage and update the state
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="app-container">
        <Header isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        <main>
          <Routes>
            <Route 
              path="/" 
              element={<LandingPage isAuthenticated={isAuthenticated} />} 
            />
            <Route 
              path="/login" 
              element={!isAuthenticated ? <Login setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/register" 
              element={!isAuthenticated ? <Register /> : <Navigate to="/" />} 
            />
            
            {/* ADD THESE NEW ROUTES */}
            <Route 
              path="/create-item" 
              element={isAuthenticated ? <CreateItem /> : <Navigate to="/login" />} 
            />
            
            {/* If you have a Dashboard, add this too */}
            <Route 
              path="/dashboard" 
              element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
            />
            
            {/* Add a catch-all route for undefined paths */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;