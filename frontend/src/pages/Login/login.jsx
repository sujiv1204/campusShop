// import React, { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import './Login.css';

// const Login = ({ setIsAuthenticated }) => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setIsLoading(true);

//     if (!email || !password) {
//       setError('Please enter both email and password.');
//       setIsLoading(false);
//       return;
//     }

//     try {
//       // This line sends the request. The Vite proxy you configured
//       // will correctly forward it to http://localhost/api/auth/login
//       const response = await axios.post('/api/auth/login', {
//         email,
//         password,
//       });

//       // --- Important Security Note ---
//       // In a real-world application, you would securely store the JWT (JSON Web Token)
//       // from the response and use it for future authenticated requests.
//       console.log('Login successful, token:', response.data.token);

//       // Update the app's overall authentication state
//       setIsAuthenticated(true);
      
//       // Redirect the user to the home page after successful login
//       navigate('/');

//     } catch (err) {
//       // Display the specific error message from the backend if it exists,
//       // otherwise show a generic error.
//       setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
//     } finally {
//       // Ensure loading state is turned off whether the request succeeded or failed
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="form-container">
//       <form onSubmit={handleSubmit} className="auth-form">
//         <h2 className="form-title">Login</h2>
//         {error && <p className="error-message">{error}</p>}
//         <div className="input-group">
//           <label htmlFor="email">Email</label>
//           <input
//             type="email"
//             id="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             disabled={isLoading}
//             required
//           />
//         </div>
//         <div className="input-group">
//           <label htmlFor="password">Password</label>
//           <input
//             type="password"
//             id="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             disabled={isLoading}
//             required
//           />
//         </div>
//         <button type="submit" className="submit-button" disabled={isLoading}>
//           {isLoading ? 'Logging In...' : 'Login'}
//         </button>
//         <p className="redirect-link">
//           Don't have an account? <Link to="/register">Register here</Link>
//         </p>
//       </form>
//     </div>
//   );
// };

// export default Login;

// import React, { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import './Login.css';

// const Login = ({ setIsAuthenticated }) => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setIsLoading(true);

//     if (!email || !password) {
//       setError('Please enter both email and password.');
//       setIsLoading(false);
//       return;
//     }

//     try {
//       const response = await axios.post('/api/auth/login', {
//         email,
//         password,
//       });

//       console.log('Login successful, token:', response.data.token);
      
//       // Store the token in localStorage
//       localStorage.setItem('token', response.data.token);
      
//       // Update the app's overall authentication state
//       setIsAuthenticated(true);
      
//       // Redirect to Dashboard instead of home page
//       navigate('/dashboard');

//     } catch (err) {
//       setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="form-container">
//       <form onSubmit={handleSubmit} className="auth-form">
//         <h2 className="form-title">Login</h2>
//         {error && <p className="error-message">{error}</p>}
//         <div className="input-group">
//           <label htmlFor="email">Email</label>
//           <input
//             type="email"
//             id="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             disabled={isLoading}
//             required
//           />
//         </div>
//         <div className="input-group">
//           <label htmlFor="password">Password</label>
//           <input
//             type="password"
//             id="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             disabled={isLoading}
//             required
//           />
//         </div>
//         <button type="submit" className="submit-button" disabled={isLoading}>
//           {isLoading ? 'Logging In...' : 'Login'}
//         </button>
//         <p className="redirect-link">
//           Don't have an account? <Link to="/register">Register here</Link>
//         </p>
//       </form>
//     </div>
//   );
// };

// export default Login;



import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
// import './login.css'; // Styles are now in-lined below.

// We will define the styles directly in this file instead.
const LoginStyles = () => (
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
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* Softer shadow */
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
    
    /* Style for stacking the buttons */
    .submit-button + .submit-button {
      margin-top: 0.75rem; /* 12px */
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


const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotLoading, setIsForgotLoading] = useState(false); 
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setMessage(''); 

    if (!email || !password) {
      setError('Please enter both email and password.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });

      console.log('Login successful, token:', response.data.token);
      
      localStorage.setItem('token', response.data.token);
      setIsAuthenticated(true);
      navigate('/dashboard');

    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setMessage('');
    setIsForgotLoading(true);

    if (!email) {
      setError('Please enter your email address to reset your password.');
      setIsForgotLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/auth/forgot-password', {
        email,
      });
      console.log(response?.data?.token);
      
      // setMessage(response.data.message); // No longer need this
      
      // --- THIS IS THE NEW PART ---
      // On success, navigate to the reset page.
      navigate('/reset-password');
      // --- END NEW PART ---

    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.response?.data?.message || 'Could not send reset link. Please try again.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <>
      <LoginStyles /> {/* This injects the new CSS styles */}
      <div className="form-container">
        <form onSubmit={handleSubmit} className="auth-form">
          <h2 className="form-title">Login</h2>
          {error && <p className="error-message">{error}</p>}
          {/* We no longer show the success message here, we navigate instead */}
          {/* {message && <p className="success-message">{message}</p>} */}
          
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)} // Fixed typo: e.targe.value -> e.target.value
              disabled={isLoading || isForgotLoading} 
              required
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || isForgotLoading}
              required
            />
          </div>

          <button type="submit" className="submit-button" disabled={isLoading || isForgotLoading}>
            {isLoading ? 'Logging In...' : 'Login'}
          </button>
          
          {/* This button now uses 'submit-button' class to match the theme */}
          <button 
            type="button" 
            className="submit-button" 
            disabled={isLoading || isForgotLoading}
            onClick={handleForgotPassword}
          >
            {isForgotLoading ? 'Sending Link...' : 'Forgot Password'}
          </button>
          
          <p className="redirect-link">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </form>
      </div>
    </>
  );
};

export default Login;