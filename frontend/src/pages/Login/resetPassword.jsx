import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// We will use the *same* styles from the Login page
const ResetPasswordStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    .form-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f3f4f6; /* Light gray background */
      font-family: 'Inter', sans-serif;
      padding: 2rem;
    }

    .auth-form {
      background-color: #ffffff;
      padding: 2.5rem;
      border-radius: 12px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      width: 100%;
      max-width: 400px;
      box-sizing: border-box;
    }

    .form-title {
      font-size: 2.25rem; /* 36px */
      font-weight: 700;
      color: #1e293b; /* Dark slate-900 */
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .error-message {
      background-color: #fee2e2; /* Red-100 */
      color: #b91c1c; /* Red-700 */
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem; /* 14px */
      font-weight: 500;
      margin-bottom: 1.5rem;
      text-align: center;
    }

    .success-message {
      background-color: #dcfce7; /* Green-100 */
      color: #166534; /* Green-700 */
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem; /* 14px */
      font-weight: 500;
      margin-bottom: 1.5rem;
      text-align: center;
    }

    .input-group {
      margin-bottom: 1.5rem;
    }

    .input-group label {
      display: block;
      font-size: 0.875rem; /* 14px */
      font-weight: 500;
      color: #475569; /* Slate-600 */
      margin-bottom: 0.5rem;
      text-align: center; /* Centered label */
    }

    .input-group input {
      width: 100%;
      box-sizing: border-box;
      padding: 0.75rem 1rem;
      font-size: 1rem; /* 16px */
      color: #1e293b; /* Slate-900 */
      border: 1px solid #cbd5e1; /* Slate-300 */
      border-radius: 8px;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .input-group input:focus {
      outline: none;
      border-color: #334155; /* Slate-700 */
      box-shadow: 0 0 0 3px rgba(51, 65, 85, 0.1); /* Focus ring */
    }

    .input-group input:disabled {
      background-color: #f1f5f9; /* Slate-100 */
      opacity: 0.7;
      cursor: not-allowed;
    }

    .submit-button {
      width: 100%;
      padding: 0.75rem 1rem;
      font-size: 1rem; /* 16px */
      font-weight: 600;
      color: #ffffff;
      background-color: #334155; /* Dark Slate-700 */
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.2s;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    }

    .submit-button:hover {
      background-color: #1e293b; /* Darker Slate-800 */
    }

    .submit-button:disabled {
      background-color: #94a3b8; /* Lighter Slate-400 */
      cursor: not-allowed;
    }

    .redirect-link {
      font-size: 0.875rem; /* 14px */
      color: #475569; /* Slate-600 */
      text-align: center;
      margin-top: 1.5rem;
    }

    .redirect-link a {
      color: #1e293b; /* Dark Slate-800 */
      font-weight: 600;
      text-decoration: none;
      transition: color 0.2s;
    }

    .redirect-link a:hover {
      text-decoration: underline;
    }
  `}</style>
);

const ResetPassword = () => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    // 1. Client-side validation
    if (!token || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      // 2. Call the reset-password API (Step 2)
      const response = await axios.post('/api/auth/reset-password', {
        token,
        newPassword,
        confirmPassword,
      });

      // 3. Handle Success
      setMessage(response.data.message);
      setError('');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 2000); // 2 seconds

    } catch (err) {
      // 4. Handle errors (e.g., "Invalid or expired token")
      console.error('Reset password error:', err);
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
      setMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ResetPasswordStyles />
      <div className="form-container">
        <form onSubmit={handleSubmit} className="auth-form">
          <h2 className="form-title">Reset Password</h2>
          
          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>} 
          
          <p style={{textAlign: 'center', color: '#475569', marginTop: '-1rem', marginBottom: '1.5rem', fontSize: '0.875rem'}}>
            Check your email for the reset token and paste it below.
          </p>

          <div className="input-group">
            <label htmlFor="token">Token</label>
            <input
              type="text"
              id="token"
              placeholder="Paste your token here"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Updating Password...' : 'Update Password'}
          </button>
          
          <p className="redirect-link">
            Remembered your password? <Link to="/login">Back to Login</Link>
          </p>
        </form>
      </div>
    </>
  );
};

export default ResetPassword;