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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4 bg-gray-100">
  {filteredItems.map(item => (
    <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col transition-transform hover:scale-105">
      
      {/* Image and Price Badge */}
      <div className="relative">
        <img 
          src={item.imageUrl || '/api/placeholder/300/200'} 
          alt={item.title}
          className="w-full h-48 object-cover"
          // This onError handler is preserved from your original code
          onError={(e) => {
            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjBGMEYwIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4=';
          }}
        />
        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-sm font-semibold px-2.5 py-1 rounded-full">
          ₹{parseFloat(item.price).toFixed(2)}
        </div>
      </div>
      
      {/* Card Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-2">
          {item.title}
        </h3>
        <p className="text-sm text-gray-600 mb-4 flex-grow line-clamp-3">
          {item.description}
        </p>
        
        {/* Date */}
        <div className="flex items-center text-xs text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Action Buttons */}
        <div className="mt-4">
          {isAuthenticated ? (
            <button 
              onClick={() => handlePlaceBid(item)}
              className="w-full inline-flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v2a1 1 0 01-1 1h-3a1 1 0 00-1-1V3.5z" />
                <path d="M15.5 10a1.5 1.5 0 00-3 0V11a1 1 0 01-1 1H5a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 011-1v-1.5a1.5 1.5 0 00-3 0V15a1 1 0 001 1h3a1 1 0 001-1v-2a1 1 0 00-1-1h-3a1 1 0 01-1-1v-1.5z" />
              </svg>
              Place Bid
            </button>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              className="w-full inline-flex items-center justify-center text-gray-900 bg-gray-200 hover:bg-gray-300 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Login to Buy
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
        <p>© 2025 Campus shop. Connecting IITJ students through E-commerce.</p>
      </footer>
    </div>
  );
};

export default LandingPage;