// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import './landingPage.css';

// const LandingPage = () => {
//   const [items, setItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchItems = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const response = await axios.get('/api/items/');
//       setItems(response.data);
//     } catch (err) {
//       console.error('Full error object:', err);
//       setError(`Failed to fetch items: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchItems();
//   }, []);

//   if (loading) return <div className="loading">Loading items...</div>;
//   if (error) return <div className="error">Error: {error}</div>;

//   return (
//     <div className="landing-page">
//       <h1>Available Items</h1>
      
//       {items.length === 0 ? (
//         <p>No items found.</p>
//       ) : (
//         <div className="items-list">
//           {items.map(item => (
//             <div key={item.id} className="item-row">
//               <div className="item-image">
//                 <img src={item.imageUrl} alt={item.title} />
//               </div>
//               <div className="item-content">
//                 {/* <h3>{item.title}</h3> */}
//                 <p className="description">{item.description}</p>
//                 <p className="price">${item.price}</p>
//                 <p className="date">Posted: {new Date(item.createdAt).toLocaleDateString()}</p>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default LandingPage;



import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI } from '../../services/api';
import './landingPage.css';

const LandingPage = ({ isAuthenticated }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const navigate = useNavigate();

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await itemsAPI.getAll();
      const itemsData = response.data;
      setItems(itemsData);
      setFilteredItems(itemsData);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('Failed to load items. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort items
  useEffect(() => {
    let result = items.filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort items
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return parseFloat(a.price) - parseFloat(b.price);
        case 'price-high':
          return parseFloat(b.price) - parseFloat(a.price);
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        default:
          return 0;
      }
    });

    setFilteredItems(result);
  }, [items, searchTerm, sortBy]);

  const handleBuyItem = async (itemId, itemTitle) => {
    if (!isAuthenticated) {
      alert('Please login to buy items');
      navigate('/login');
      return;
    }

    if (window.confirm(`Are you sure you want to buy "${itemTitle}"?`)) {
      try {
        const token = localStorage.getItem('token');
        console.log(token);
        await itemsAPI.markAsSold(itemId);
        
        // Remove the item from the list
        setItems(prevItems => prevItems.filter(item => item.id !== itemId));
        
        alert(`Congratulations! You have successfully purchased "${itemTitle}"`);
      } catch (err) {
        console.error('Error buying item:', err);
        alert('Failed to purchase item. Please try again.');
      }
    }
  };

  const handlePlaceBid = (item) => {
    if (!isAuthenticated) {
      alert('Please login to place bids');
      navigate('/login');
      return;
    }
    navigate(`/place-bid/${item.id}`, { state: { item } });
  };

  useEffect(() => {
    fetchItems();
  }, []);

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading amazing deals...</p>
    </div>
  );

  if (error) return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <h3>Oops! Something went wrong</h3>
      <p>{error}</p>
      <button onClick={fetchItems} className="retry-btn">Try Again</button>
    </div>
  );

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Campus Marketplace</h1>
          <p className="hero-subtitle">Discover amazing deals from your fellow students</p>
          <div className="hero-actions">
            {isAuthenticated ? (
              <>
                <button 
                  onClick={() => navigate('/create-item')} 
                  className="cta-button primary"
                >
                  🎯 Sell Your Item
                </button>
                <button 
                  onClick={() => navigate('/buy-items')} 
                  className="cta-button secondary"
                >
                  💰 Place a Bid
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => navigate('/register')} 
                  className="cta-button primary"
                >
                  🚀 Get Started
                </button>
                <button 
                  onClick={() => navigate('/login')} 
                  className="cta-button secondary"
                >
                  🔐 Sign In
                </button>
              </>
            )}
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat">
            <span className="stat-number">{items.length}</span>
            <span className="stat-label">Items Available</span>
          </div>
          <div className="stat">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Active Marketplace</span>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="filters-section">
        <div className="search-box">
          <div className="search-icon">🔍</div>
          <input
            type="text"
            placeholder="Search for items, categories, descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
          
          <div className="results-count">
            Showing {filteredItems.length} of {items.length} items
          </div>
        </div>
      </section>

      {/* Items Grid */}
      <section className="items-section">
        {filteredItems.length === 0 ? (
          <div className="no-items">
            <div className="no-items-icon">📦</div>
            <h3>No items found</h3>
            <p>Try adjusting your search or check back later for new listings</p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="clear-search-btn"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            <h2 className="section-title">Featured Items</h2>
            <div className="items-grid">
              {filteredItems.map(item => (
                <div key={item.id} className="item-card">
                  <div className="item-image-container">
                    <img 
                      src={item.imageUrl || '/api/placeholder/300/200'} 
                      alt={item.title}
                      className="item-image"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjBGMEYwIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4=';
                      }}
                    />
                    <div className="item-badge">₹{parseFloat(item.price).toFixed(2)}</div>
                  </div>
                  
                  <div className="item-content">
                    <h3 className="item-title">{item.title}</h3>
                    <p className="item-description">{item.description}</p>
                    
                    <div className="item-meta">
                      <span className="item-date">
                        📅 {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="item-actions">
                      {isAuthenticated ? (
                        <>
                          
                          <button 
                            onClick={() => handlePlaceBid(item)}
                            className="action-btn bid-btn"
                          >
                            💰 Bid
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => navigate('/login')}
                          className="action-btn login-btn"
                        >
                          🔐 Login to Buy
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Footer Section */}
      <footer className="landing-footer">
        <p>© 2024 Campus Marketplace. Connecting students through commerce.</p>
      </footer>
    </div>
  );
};

export default LandingPage;