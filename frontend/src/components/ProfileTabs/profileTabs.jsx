import React from 'react';
import './ProfileTabs.css';

const ProfileTabs = ({
  activeTab,
  setActiveTab,
  myItems,
  receivedBids,
  onAcceptBid,
  onRejectBid,
  onDeleteItem,
  onEditItem
}) => {
  const tabs = [
    { id: 'items', label: `My Items (${myItems.length})`, icon: '📦' },
    { id: 'bids', label: `Received Bids (${receivedBids.length})`, icon: '💰' }
  ];

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
      pending: { class: 'status-pending', label: 'Pending' },
      accepted: { class: 'status-accepted', label: 'Accepted' },
      rejected: { class: 'status-rejected', label: 'Rejected' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  return (
    <div className="profile-tabs">
      {/* Tab Navigation */}
      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'items' && (
          <div className="items-tab">
            {myItems.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <h3>No Items Posted Yet</h3>
                <p>Start selling by posting your first item!</p>
              </div>
            ) : (
              <div className="items-grid">
                {myItems.map(item => (
                  <div key={item.id} className="profile-item-card">
                    {item.imageUrl && (
                      <div className="item-image">
                        <img src={item.imageUrl} alt={item.title} />
                      </div>
                    )}
                    <div className="item-content">
                      <h4 className="item-title">{item.title}</h4>
                      <p className="item-description">{item.description}</p>
                      <div className="item-details">
                        <span className="item-price">${parseFloat(item.price).toFixed(2)}</span>
                        <span className="item-date">{formatDate(item.createdAt)}</span>
                      </div>
                      <div className="item-actions">
                        <button 
                          onClick={() => onEditItem(item)}
                          className="action-btn edit-btn"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => onDeleteItem(item.id, item.title)}
                          className="action-btn delete-btn"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bids' && (
          <div className="bids-tab">
            {receivedBids.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💰</div>
                <h3>No Bids Received Yet</h3>
                <p>Bids will appear here when other users bid on your items</p>
              </div>
            ) : (
              <div className="bids-list">
                {receivedBids.map(bid => (
                  <div key={bid.id} className="bid-card">
                    <div className="bid-header">
                      <div className="bidder-info">
                        <strong>Bidder ID:</strong> {bid.bidderId?.substring(0, 8)}...
                      </div>
                      {getBidStatusBadge(bid.status)}
                    </div>
                    
                    <div className="bid-details">
                      <div className="bid-item">
                        <strong>Item:</strong> {bid.item?.title || 'Item not available'}
                      </div>
                      <div className="bid-amount">
                        <strong>Bid Amount:</strong> ${parseFloat(bid.amount).toFixed(2)}
                      </div>
                      <div className="bid-time">
                        <strong>Placed:</strong> {formatDate(bid.createdAt)}
                      </div>
                    </div>

                    {bid.status === 'pending' && (
                      <div className="bid-actions">
                        <button 
                          onClick={() => onAcceptBid(bid.id, bid.item?.title)}
                          className="action-btn accept-btn"
                        >
                          ✅ Accept Bid
                        </button>
                        <button 
                          onClick={() => onRejectBid(bid.id, bid.item?.title)}
                          className="action-btn reject-btn"
                        >
                          ❌ Reject Bid
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileTabs;