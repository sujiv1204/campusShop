import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { bidsAPI, itemsAPI } from '../../services/api';
import './placeBid.css';

const PlaceBid = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [item, setItem] = useState(location.state?.item || null);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!item) {
      fetchItem();
    } else {
      setLoading(false);
      setBidAmount((parseFloat(item.price) + 1).toFixed(2)); // Default bid: price + 1
    }
  }, [itemId, item]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const response = await itemsAPI.getById(itemId);
      setItem(response.data);
      setBidAmount((parseFloat(response.data.price) + 1).toFixed(2));
    } catch (err) {
      setError('Failed to load item details');
      console.error('Error fetching item:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      setError('Please enter a valid bid amount');
      return;
    }

    if (parseFloat(bidAmount) < parseFloat(item.price)) {
      setError(`Bid must be at least the starting price of ₹ ${item.price}`);
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const bidData = {
        itemId: item.id,
        amount: parseFloat(bidAmount).toFixed(2)
      };

      console.log('Placing bid:', bidData);
      const response = await bidsAPI.placeBid(bidData);
      console.log(response);
      
      setSuccess('Bid placed successfully!');
      setTimeout(() => {
        navigate('/buy-items');
      }, 2000);

    } catch (err) {
      console.error('Error placing bid:', err);
      
      if (err.response?.status === 403) {
        setError(err.response.data.message || 'You cannot bid on your own item.');
      } else if (err.response?.status === 400) {
        setError(err.response.data.message || 'Invalid bid amount.');
      } else if (err.response?.status === 404) {
        setError('Item not found or no longer available.');
      } else {
        setError(err.response?.data?.message || 'Failed to place bid. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/buy-items');
  };

  if (loading) return <div className="loading">Loading item details...</div>;
  if (!item) return <div className="error">Item not found</div>;

  return (
    <div className="place-bid-page">
      <div className="place-bid-container">
        <h2> Place a Bid</h2>
        
        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}
        
        {success && (
          <div className="success-message">
            ✅ {success}
          </div>
        )}

        <div className="item-details">
          {item.imageUrl && (
            <div className="item-image">
              <img src={item.imageUrl} alt={item.title} />
            </div>
          )}
          <div className="item-info">
            <h3>{item.title}</h3>
            <p className="description">{item.description}</p>
            <p className="starting-price">Starting Price: <strong>₹{parseFloat(item.price).toFixed(2)}</strong></p>
          </div>
        </div>

        <form onSubmit={handlePlaceBid} className="bid-form">
          <div className="form-group">
            <label htmlFor="bidAmount">Your Bid Amount (₹)</label>
            <input
              type="number"
              id="bidAmount"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              min={parseFloat(item.price) + 0.01}
              step="0.01"
              required
              disabled={submitting}
            />
            <small>Minimum bid: ₹{(parseFloat(item.price) + 0.01).toFixed(2)}</small>
          </div>

          <div className="bid-summary">
            <h4>Bid Summary</h4>
            <p>Item: {item.title}</p>
            <p>Your Bid: <strong>₹{parseFloat(bidAmount || 0).toFixed(2)}</strong></p>
            <p>Starting Price: ₹{parseFloat(item.price).toFixed(2)}</p>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={handleCancel}
              className="cancel-btn"
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="submit-btn"
            >
              {submitting ? 'Placing Bid...' : 'Place Bid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlaceBid;