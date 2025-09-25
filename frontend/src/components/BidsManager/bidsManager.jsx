import React, { useState, useEffect } from 'react';
import { bidsAPI, itemsAPI } from '../../services/api';
import './bidsManager.css';

const BidsManager = () => {
  const [myItems, setMyItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemBids, setItemBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyItems();
  }, []);

  const fetchMyItems = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await itemsAPI.getAll();
      // In a real app, you'd filter by current user's items
      // For now, we'll show all items since we don't have user-specific filtering
      setMyItems(response.data);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('Failed to load your items.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBidsForItem = async (itemId) => {
    try {
      setBidsLoading(true);
      setError('');
      const response = await bidsAPI.getBidsByItem(itemId);
      setItemBids(response.data);
      setSelectedItem(myItems.find(item => item.id === itemId));
    } catch (err) {
      console.error('Error fetching bids:', err);
      setError('Failed to load bids for this item.');
    } finally {
      setBidsLoading(false);
    }
  };

  const handleAcceptBid = async (bidId, bidderName, amount) => {
    if (window.confirm(`Accept bid of $${amount} from ${bidderName}?`)) {
      try {
        await bidsAPI.acceptBid(bidId);
        alert('Bid accepted successfully!');
        if (selectedItem) {
          fetchBidsForItem(selectedItem.id); // Refresh bids
        }
      } catch (err) {
        console.error('Error accepting bid:', err);
        alert('Failed to accept bid. Please try again.');
      }
    }
  };

  const handleRejectBid = async (bidId, bidderName, amount) => {
    if (window.confirm(`Reject bid of $${amount} from ${bidderName}?`)) {
      try {
        await bidsAPI.rejectBid(bidId);
        alert('Bid rejected successfully!');
        if (selectedItem) {
          fetchBidsForItem(selectedItem.id); // Refresh bids
        }
      } catch (err) {
        console.error('Error rejecting bid:', err);
        alert('Failed to reject bid. Please try again.');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBidStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'status-pending', label: 'Pending', icon: '⏳' },
      accepted: { class: 'status-accepted', label: 'Accepted', icon: '✅' },
      rejected: { class: 'status-rejected', label: 'Rejected', icon: '❌' },
      expired: { class: 'status-expired', label: 'Expired', icon: '⏰' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`status-badge ${config.class}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bids-loading">
        <div className="loading-spinner"></div>
        <p>Loading your items...</p>
      </div>
    );
  }

  return (
    <div className="bids-manager">
      <div className="bids-header">
        <h2>💰 Bid Management</h2>
        <p>View and manage bids on your items</p>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      <div className="bids-layout">
        {/* Items List */}
        <div className="items-section">
          <h3>Your Items ({myItems.length})</h3>
          <div className="items-list">
            {myItems.length === 0 ? (
              <div className="empty-items">
                <div className="empty-icon">📦</div>
                <p>No items posted yet</p>
                <p>Post items to receive bids!</p>
              </div>
            ) : (
              myItems.map(item => (
                <div
                  key={item.id}
                  className={`item-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
                  onClick={() => fetchBidsForItem(item.id)}
                >
                  {item.imageUrl && (
                    <div className="item-image">
                      <img src={item.imageUrl} alt={item.title} />
                    </div>
                  )}
                  <div className="item-info">
                    <h4>{item.title}</h4>
                    <p className="item-price">${parseFloat(item.price).toFixed(2)}</p>
                    <p className="item-date">Listed: {formatDate(item.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bids List */}
        <div className="bids-section">
          {selectedItem ? (
            <>
              <div className="selected-item-header">
                <h3>Bids for: {selectedItem.title}</h3>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="back-button"
                >
                  ← Back to Items
                </button>
              </div>

              {bidsLoading ? (
                <div className="bids-loading">
                  <div className="loading-spinner small"></div>
                  <p>Loading bids...</p>
                </div>
              ) : itemBids.length === 0 ? (
                <div className="empty-bids">
                  <div className="empty-icon">💰</div>
                  <h4>No Bids Yet</h4>
                  <p>This item hasn't received any bids yet.</p>
                  <p>Share your listing to attract more buyers!</p>
                </div>
              ) : (
                <div className="bids-list">
                  <div className="bids-stats">
                    <span>Total Bids: <strong>{itemBids.length}</strong></span>
                    <span>Highest Bid: <strong>${Math.max(...itemBids.map(bid => parseFloat(bid.amount))).toFixed(2)}</strong></span>
                  </div>

                  {itemBids.map((bid, index) => (
                    <div key={bid.id} className={`bid-card ${index === 0 ? 'highest-bid' : ''}`}>
                      {index === 0 && <div className="highest-bid-badge">🏆 Highest</div>}
                      
                      <div className="bid-header">
                        <div className="bidder-info">
                          <strong>Bidder:</strong> {bid.bidderId?.substring(0, 8)}...
                        </div>
                        {getBidStatusBadge(bid.status)}
                      </div>

                      <div className="bid-details">
                        <div className="bid-amount">
                          <span className="amount">${parseFloat(bid.amount).toFixed(2)}</span>
                          <span className="difference">
                            {parseFloat(bid.amount) > parseFloat(selectedItem.price) ? 
                              `+$${(parseFloat(bid.amount) - parseFloat(selectedItem.price)).toFixed(2)}` : 
                              'At asking price'
                            }
                          </span>
                        </div>
                        
                        <div className="bid-meta">
                          <span className="bid-time">Placed: {formatDate(bid.createdAt)}</span>
                          {bid.updatedAt !== bid.createdAt && (
                            <span className="bid-updated">Updated: {formatDate(bid.updatedAt)}</span>
                          )}
                        </div>
                      </div>

                      {bid.status === 'pending' && (
                        <div className="bid-actions">
                          <button
                            onClick={() => handleAcceptBid(bid.id, `Bidder ${bid.bidderId?.substring(0, 8)}`, bid.amount)}
                            className="accept-btn"
                          >
                            ✅ Accept Offer
                          </button>
                          <button
                            onClick={() => handleRejectBid(bid.id, `Bidder ${bid.bidderId?.substring(0, 8)}`, bid.amount)}
                            className="reject-btn"
                          >
                            ❌ Reject
                          </button>
                        </div>
                      )}

                      {bid.status === 'accepted' && (
                        <div className="bid-success">
                          ✅ Bid accepted! Contact the buyer to complete the transaction.
                        </div>
                      )}

                      {bid.status === 'rejected' && (
                        <div className="bid-rejected">
                          ❌ Bid was rejected.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="select-item-prompt">
              <div className="prompt-icon">👈</div>
              <h3>Select an Item</h3>
              <p>Choose an item from the list to view its bids</p>
              <p>You'll see all offers and can accept or reject them</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BidsManager;