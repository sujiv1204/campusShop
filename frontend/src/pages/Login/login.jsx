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
import './login.css';

const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

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
      
      // Store the token in localStorage
      localStorage.setItem('token', response.data.token);
      
      // Update the app's overall authentication state
      setIsAuthenticated(true);
      
      // Redirect to Dashboard
      navigate('/dashboard');

    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      
      // Clear any invalid token
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2 className="form-title">Login</h2>
        {error && <p className="error-message">{error}</p>}
        <div className="input-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
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
            disabled={isLoading}
            required
          />
        </div>
        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? 'Logging In...' : 'Login'}
        </button>
        <p className="redirect-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;