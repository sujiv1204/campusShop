import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI } from '../../services/api';
import './buyItems.css';

const BuyItems = ({ isAuthenticated }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await itemsAPI.getAll();
      // Filter out sold items if they have a status field
      const availableItems = response.data.filter(item => item.status !== 'sold');
      setItems(availableItems);
      console.log(availableItems)
    } catch (err) {
      setError('Failed to load items');
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBid = (item) => {
    if (!isAuthenticated) {
      alert('Please login to place a bid');
      navigate('/login');
      return;
    }
    navigate(`/place-bid/${item.id}`, { state: { item } });
  };

  const handleBuyNow = async (itemId, itemTitle) => {
    if (!isAuthenticated) {
      alert('Please login to buy items');
      navigate('/login');
      return;
    }

    if (window.confirm(`Are you sure you want to buy "${itemTitle}" at the asking price?`)) {
      try {
        await itemsAPI.markAsSold(itemId);
        setItems(items.filter(item => item.id !== itemId));
        alert(`Congratulations! You have purchased "${itemTitle}"`);
      } catch (err) {
        console.error('Error buying item:', err);
        alert('Failed to purchase item. Please try again.');
      }
    }
  };

  if (loading) return <div className="loading">Loading available items...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="buy-items-page">
      <div className="buy-items-header">
        <h1>🛍️ Available Items for Bidding</h1>
        <p>Place your bids on items from other students</p>
      </div>

      <div className="items-stats">
        <p>Found {items.length} item(s) available for bidding</p>
      </div>

      {items.length === 0 ? (
        <div className="no-items">
          <h3>No items available for bidding</h3>
          <p>Check back later for new listings!</p>
        </div>
      ) : (
        <div className="items-grid">
          {items.map((item) => (
            <div key={item.id} className="item-card">
              {item.imageUrl && (
                <div className="item-image">
                  {/* <img src={item.imageUrl} alt={item.title} /> */}
                </div>
              )}
              
              <div className="item-content">
                <h3 className="item-title">{item.title}</h3>
                <p className="item-description">{item.description}</p>
                
                <div className="item-details">
                  <div className="item-price">Starting Price: ${parseFloat(item.price).toFixed(2)}</div>
                  <div className="item-seller">Seller ID: {item.sellerId?.substring(0, 8)}...</div>
                  <div className="item-date">
                    Listed: {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="item-actions">
                  <button 
                    onClick={() => handlePlaceBid(item)}
                    className="bid-btn"
                    title="Place a bid on this item"
                  >
                    💰 Place Bid
                  </button>
                  <button 
                    onClick={() => handleBuyNow(item.id, item.title)}
                    className="buy-now-btn"
                    title="Buy immediately at asking price"
                  >
                    🛒 Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BuyItems;