// import React from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import './Header.css';

// const Header = ({ isAuthenticated, setIsAuthenticated }) => {
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     // In a real app, you'd also clear tokens, etc.
//     setIsAuthenticated(false);
//     navigate('/login');
//   };

//   return (
//     <header className="header">
//       <div className="header-container">
//         <Link to="/" className="logo">
//           Welcome to CampusShop
//         </Link>
//         <nav>
//           <ul className="nav-links">
//             {isAuthenticated ? (
//               <li>
//                 <button onClick={handleLogout} className="nav-button logout-button">
//                   Logout
//                 </button>
//               </li>
//             ) : (
//               <>
//                 <li>
//                   <Link to="/login" className="nav-button">
//                     Login
//                   </Link>
//                 </li>
//                 <li>
//                   <Link to="/register" className="nav-button register-button">
//                     Register
//                   </Link>
//                 </li>
//               </>
//             )}
//           </ul>
//         </nav>
//       </div>
//     </header>
//   );
// };

// export default Header;


// import React from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import './Header.css';

// const Header = ({ isAuthenticated, onLogout }) => {
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     onLogout();
//     navigate('/login');
//   };

//   return (
//     <header className="header">
//       <div className="header-container">
//         <Link to="/" className="logo">
//           CampusShop
//         </Link>
//         <nav>
//           <ul className="nav-links">
//             {isAuthenticated ? (
//               <>
//                 <li>
//                   <Link to="/dashboard" className="nav-button">
//                     Dashboard
//                   </Link>
//                 </li>
//                 <li>
//                   <Link to="/create-item" className="nav-button">
//                     Sell Item
//                   </Link>
//                 </li>
//                 <li>
//                   <button onClick={handleLogout} className="nav-button logout-button">
//                     Logout
//                   </button>
//                 </li>
//               </>
//             ) : (
//               <>
//                 <li>
//                   <Link to="/login" className="nav-button">
//                     Login
//                   </Link>
//                 </li>
//                 <li>
//                   <Link to="/register" className="nav-button register-button">
//                     Register
//                   </Link>
//                 </li>
//               </>
//             )}
//           </ul>
//         </nav>
//       </div>
//     </header>
//   );
// };

// export default Header;



import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './header.css';

const Header = ({ isAuthenticated, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          Welcome to CampusShop
        </Link>
        <nav>
          <ul className="nav-links">
            {isAuthenticated ? (
              <>
                {/* Add these navigation links */}
                {/* <li>
                  <Link to="/dashboard" className="nav-button">
                    Dashboard
                  </Link>
                </li> */}
                <li>
                  <Link to="/create-item" className="nav-button">
                    Sell Item
                  </Link>
                
                  <Link to="/buy-items" className="nav-button">
                    🛍️ Buy Items
                  </Link>

                  <Link to="/user-profile" className="nav-button">
                    Profile
                  </Link>
                
                </li>
                <li>
                  <button onClick={handleLogout} className="nav-button logout-button">
                    Logout
                  </button>
                </li>
              </>
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