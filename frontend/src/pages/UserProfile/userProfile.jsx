// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { userAPI, itemsAPI, bidsAPI } from '../../services/api';
// import ProfileTabs from '../../components/ProfileTabs/profileTabs';
// import './UserProfile.css';

// const UserProfile = () => {
//   const [user, setUser] = useState(null);
//   const [myItems, setMyItems] = useState([]);
//   const [receivedBids, setReceivedBids] = useState([]);
//   const [activeTab, setActiveTab] = useState('items');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const navigate = useNavigate();

//   useEffect(() => {
//     fetchUserData();
//   }, []);

//   const fetchUserData = async () => {
//     try {
//       setLoading(true);
//       setError('');

//       // Fetch user profile, items, and bids in parallel
//       const [profileResponse, itemsResponse, bidsResponse] = await Promise.all([
//         userAPI.getProfile(),
//         userAPI.getMyItems(),
//         userAPI.getReceivedBids()
//       ]);

//       setUser(profileResponse.data);
//       setMyItems(itemsResponse.data);
//       setReceivedBids(bidsResponse.data);

//     } catch (err) {
//       console.error('Error fetching user data:', err);
//       setError('Failed to load profile data. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAcceptBid = async (bidId, itemTitle) => {
//     if (window.confirm(`Are you sure you want to accept the bid for "${itemTitle}"?`)) {
//       try {
//         await bidsAPI.acceptBid(bidId);
//         alert('Bid accepted successfully!');
//         fetchUserData(); // Refresh data
//       } catch (err) {
//         console.error('Error accepting bid:', err);
//         alert('Failed to accept bid. Please try again.');
//       }
//     }
//   };

//   const handleRejectBid = async (bidId, itemTitle) => {
//     if (window.confirm(`Are you sure you want to reject the bid for "${itemTitle}"?`)) {
//       try {
//         await bidsAPI.rejectBid(bidId);
//         alert('Bid rejected successfully!');
//         fetchUserData(); // Refresh data
//       } catch (err) {
//         console.error('Error rejecting bid:', err);
//         alert('Failed to reject bid. Please try again.');
//       }
//     }
//   };

//   const handleDeleteItem = async (itemId, itemTitle) => {
//     if (window.confirm(`Are you sure you want to delete "${itemTitle}"?`)) {
//       try {
//         await itemsAPI.delete(itemId);
//         setMyItems(myItems.filter(item => item.id !== itemId));
//         alert('Item deleted successfully!');
//       } catch (err) {
//         console.error('Error deleting item:', err);
//         alert('Failed to delete item. Please try again.');
//       }
//     }
//   };

//   const handleEditItem = (item) => {
//     navigate(`/edit-item/${item.id}`);
//   };

//   if (loading) return (
//     <div className="profile-loading">
//       <div className="loading-spinner"></div>
//       <p>Loading your profile...</p>
//     </div>
//   );

//   if (error) return (
//     <div className="profile-error">
//       <div className="error-icon">⚠️</div>
//       <h3>Error Loading Profile</h3>
//       <p>{error}</p>
//       <button onClick={fetchUserData} className="retry-btn">Try Again</button>
//     </div>
//   );

//   return (
//     <div className="user-profile">
//       {/* Profile Header */}
//       <div className="profile-header">
//         <div className="profile-avatar">
//           <div className="avatar-placeholder">
//             {user?.name?.charAt(0)?.toUpperCase() || 'U'}
//           </div>
//         </div>
//         <div className="profile-info">
//           <h1 className="profile-name">
//             {user?.name || 'User Profile'}
//           </h1>
//           <p className="profile-email">{user?.email}</p>
//           <div className="profile-stats">
//             <div className="stat">
//               <span className="stat-number">{myItems.length}</span>
//               <span className="stat-label">Items Posted</span>
//             </div>
//             <div className="stat">
//               <span className="stat-number">{receivedBids.length}</span>
//               <span className="stat-label">Bids Received</span>
//             </div>
//             <div className="stat">
//               <span className="stat-number">
//                 {receivedBids.filter(bid => bid.status === 'accepted').length}
//               </span>
//               <span className="stat-label">Bids Accepted</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Profile Tabs */}
//       <ProfileTabs
//         activeTab={activeTab}
//         setActiveTab={setActiveTab}
//         myItems={myItems}
//         receivedBids={receivedBids}
//         onAcceptBid={handleAcceptBid}
//         onRejectBid={handleRejectBid}
//         onDeleteItem={handleDeleteItem}
//         onEditItem={handleEditItem}
//       />
//     </div>
//   );
// };

// export default UserProfile;



// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { itemsAPI } from '../../services/api';
// import './userProfile.css';

// const UserProfile = () => {
//   const [user, setUser] = useState(null);
//   const [myItems, setMyItems] = useState([]);
//   const [receivedBids, setReceivedBids] = useState([]);
//   const [activeTab, setActiveTab] = useState('items');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const navigate = useNavigate();

//   useEffect(() => {
//     fetchUserData();
//   }, []);

//   // Get user info from localStorage or create a mock user
//   const getUserInfo = () => {
//     const token = localStorage.getItem('token');
//     let userInfo = {
//       id: 'current-user',
//       name: 'Current User',
//       email: 'user@campus.edu'
//     };

//     // Try to extract info from token if it's a JWT
//     if (token) {
//       try {
//         const payload = JSON.parse(atob(token.split('.')[1]));
//         userInfo = {
//           id: payload.userId || userInfo.id,
//           name: payload.name || userInfo.name,
//           email: payload.email || userInfo.email
//         };
//       } catch (error) {
//         console.log('Token is not JWT or cannot be decoded', error);
//       }
//     }

//     return userInfo;
//   };

//   const fetchUserData = async () => {
//     try {
//       setLoading(true);
//       setError('');

//       // Get user info from localStorage/token
//       const userInfo = getUserInfo();
//       setUser(userInfo);

//       // Fetch all items and filter to show only user's items
//       const itemsResponse = await itemsAPI.getAll();
//       const allItems = itemsResponse.data;

//       // Since we don't have a way to identify user's items, show all items for now
//       // In a real app, you'd filter by sellerId: allItems.filter(item => item.sellerId === userInfo.id)
//       setMyItems(allItems);

//       // Bids functionality is not available yet, so show empty array
//       setReceivedBids([]);

//     } catch (err) {
//       console.error('Error fetching user data:', err);
//       setError('Failed to load items. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };
  

//   const handleDeleteItem = async (itemId, itemTitle) => {
//     if (window.confirm(`Are you sure you want to delete "${itemTitle}"?`)) {
//       try {
//         await itemsAPI.delete(itemId);
//         setMyItems(myItems.filter(item => item.id !== itemId));
//         alert('Item deleted successfully!');
//       } catch (err) {
//         console.error('Error deleting item:', err);
//         alert('Failed to delete item. Please try again.');
//       }
//     }
//   };

//   const handleEditItem = (item) => {
//     navigate(`/edit-item/${item.id}`);
//   };

//   const handleMarkAsSold = async (itemId, itemTitle) => {
//     if (window.confirm(`Mark "${itemTitle}" as sold?`)) {
//       try {
//         await itemsAPI.markAsSold(itemId);
//         setMyItems(myItems.filter(item => item.id !== itemId));
//         alert('Item marked as sold!');
//       } catch (err) {
//         console.error('Error marking item as sold:', err);
//         alert('Failed to mark item as sold. Please try again.');
//       }
//     }
//   };

//   if (loading) return (
//     <div className="profile-loading">
//       <div className="loading-spinner"></div>
//       <p>Loading your profile...</p>
//     </div>
//   );

//   if (error) return (
//     <div className="profile-error">
//       <div className="error-icon">⚠️</div>
//       <h3>Error Loading Profile</h3>
//       <p>{error}</p>
//       <button onClick={fetchUserData} className="retry-btn">Try Again</button>
//     </div>
//   );

//   return (
//     <div className="user-profile">
//       {/* Profile Header */}
//       <div className="profile-header">
//         <div className="profile-avatar">
//           <div className="avatar-placeholder">
//             {user?.name?.charAt(0)?.toUpperCase() || 'U'}
//           </div>
//         </div>
//         <div className="profile-info">
//           <h1 className="profile-name">
//             {user?.name || 'User Profile'}
//           </h1>
//           <p className="profile-email">{user?.email}</p>
//           <div className="profile-stats">
//             <div className="stat">
//               <span className="stat-number">{myItems.length}</span>
//               <span className="stat-label">Items Available</span>
//             </div>
//             <div className="stat">
//               <span className="stat-number">{receivedBids.length}</span>
//               <span className="stat-label">Bids Received</span>
//             </div>
//             <div className="stat">
//               <span className="stat-number">
//                 {myItems.filter(item => item.status === 'sold').length}
//               </span>
//               <span className="stat-label">Items Sold</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Simple Tabs */}
//       <div className="simple-tabs">
//         <div className="tab-navigation">
//           <button
//             className={`tab-button ${activeTab === 'items' ? 'active' : ''}`}
//             onClick={() => setActiveTab('items')}
//           >
//             📦 My Items ({myItems.length})
//           </button>
//           <button
//             className={`tab-button ${activeTab === 'bids' ? 'active' : ''}`}
//             onClick={() => setActiveTab('bids')}
//           >
//             💰 Bids ({receivedBids.length})
//           </button>
//         </div>

//         <div className="tab-content">
//           {activeTab === 'items' && (
//             <div className="items-tab">
//               {myItems.length === 0 ? (
//                 <div className="empty-state">
//                   <div className="empty-icon">📦</div>
//                   <h3>No Items Posted Yet</h3>
//                   <p>Start selling by posting your first item!</p>
//                   <button 
//                     onClick={() => navigate('/create-item')}
//                     className="cta-button"
//                   >
//                     Create Your First Item
//                   </button>
//                 </div>
//               ) : (
//                 <div className="items-grid">
//                   {myItems.map(item => (
//                     <div key={item.id} className="profile-item-card">
//                       {item.imageUrl && (
//                         <div className="item-image">
//                           <img src={item.imageUrl} alt={item.title} />
//                         </div>
//                       )}
//                       <div className="item-content">
//                         <h4 className="item-title">{item.title}</h4>
//                         <p className="item-description">{item.description}</p>
//                         <div className="item-details">
//                           <span className="item-price">${parseFloat(item.price).toFixed(2)}</span>
//                           <span className="item-date">
//                             {new Date(item.createdAt).toLocaleDateString()}
//                           </span>
//                         </div>
//                         <div className="item-actions">
//                           <button 
//                             onClick={() => handleEditItem(item)}
//                             className="action-btn edit-btn"
//                           >
//                             ✏️ Edit
//                           </button>
//                           <button 
//                             onClick={() => handleMarkAsSold(item.id, item.title)}
//                             className="action-btn sold-btn"
//                           >
//                             ✅ Mark Sold
//                           </button>
//                           <button 
//                             onClick={() => handleDeleteItem(item.id, item.title)}
//                             className="action-btn delete-btn"
//                           >
//                             🗑️ Delete
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}

//           {activeTab === 'bids' && (
//             <div className="bids-tab">
//               <div className="empty-state">
//                 <div className="empty-icon">💰</div>
//                 <h3>Bidding Feature Coming Soon</h3>
//                 <p>The bidding system is currently under development.</p>
//                 <p>Check back later to see bids on your items!</p>
//                 <div className="feature-preview">
//                   <h4>What to expect:</h4>
//                   <ul>
//                     <li>✅ View bids on your items</li>
//                     <li>✅ Accept or reject offers</li>
//                     <li>✅ Chat with potential buyers</li>
//                     <li>✅ Track bidding history</li>
//                   </ul>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UserProfile;



// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { itemsAPI } from '../../services/api';
// import BidsManager from '../../components/BidsManager/bidsManager';
// import './UserProfile.css';

// const UserProfile = () => {
//   const [user, setUser] = useState(null);
//   const [myItems, setMyItems] = useState([]);
//   const [activeTab, setActiveTab] = useState('items');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const navigate = useNavigate();

//   useEffect(() => {
//     fetchUserData();
//   }, []);

//   const getUserInfo = () => {
//     const token = localStorage.getItem('token');
//     let userInfo = {
//       id: 'current-user',
//       name: 'Current User',
//       email: 'user@campus.edu'
//     };

//     if (token) {
//       try {
//         const payload = JSON.parse(atob(token.split('.')[1]));
//         userInfo = {
//           id: payload.userId || userInfo.id,
//           name: payload.name || userInfo.name,
//           email: payload.email || userInfo.email
//         };
//       } catch (error) {
//         console.log('Token is not JWT or cannot be decoded', error);
//       }
//     }

//     return userInfo;
//   };

//   const fetchUserData = async () => {
//     try {
//       setLoading(true);
//       setError('');

//       const userInfo = getUserInfo();
//       setUser(userInfo);

//       const itemsResponse = await itemsAPI.getAll();
//       setMyItems(itemsResponse.data);

//     } catch (err) {
//       console.error('Error fetching user data:', err);
//       setError('Failed to load profile data. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDeleteItem = async (itemId, itemTitle) => {
//     if (window.confirm(`Are you sure you want to delete "${itemTitle}"?`)) {
//       try {
//         await itemsAPI.delete(itemId);
//         setMyItems(myItems.filter(item => item.id !== itemId));
//         alert('Item deleted successfully!');
//       } catch (err) {
//         console.error('Error deleting item:', err);
//         alert('Failed to delete item. Please try again.');
//       }
//     }
//   };

//   const handleEditItem = (item) => {
//     navigate(`/edit-item/${item.id}`);
//   };

//   const handleMarkAsSold = async (itemId, itemTitle) => {
//     if (window.confirm(`Mark "${itemTitle}" as sold?`)) {
//       try {
//         await itemsAPI.markAsSold(itemId);
//         setMyItems(myItems.filter(item => item.id !== itemId));
//         alert('Item marked as sold!');
//       } catch (err) {
//         console.error('Error marking item as sold:', err);
//         alert('Failed to mark item as sold. Please try again.');
//       }
//     }
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   };

//   if (loading) return (
//     <div className="profile-loading">
//       <div className="loading-spinner"></div>
//       <p>Loading your profile...</p>
//     </div>
//   );

//   if (error) return (
//     <div className="profile-error">
//       <div className="error-icon">⚠️</div>
//       <h3>Error Loading Profile</h3>
//       <p>{error}</p>
//       <button onClick={fetchUserData} className="retry-btn">Try Again</button>
//     </div>
//   );

//   return (
//     <div className="user-profile">
//       {/* Profile Header */}
//       <div className="profile-header">
//         <div className="profile-avatar">
//           <div className="avatar-placeholder">
//             {user?.name?.charAt(0)?.toUpperCase() || 'U'}
//           </div>
//         </div>
//         <div className="profile-info">
//           <h1 className="profile-name">
//             {user?.name || 'User Profile'}
//           </h1>
//           <p className="profile-email">{user?.email}</p>
//           <div className="profile-stats">
//             <div className="stat">
//               <span className="stat-number">{myItems.length}</span>
//               <span className="stat-label">Items Posted</span>
//             </div>
//             <div className="stat">
//               <span className="stat-number">0</span>
//               <span className="stat-label">Active Bids</span>
//             </div>
//             <div className="stat">
//               <span className="stat-number">
//                 {myItems.filter(item => item.status === 'sold').length}
//               </span>
//               <span className="stat-label">Items Sold</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Tab Navigation */}
//       <div className="profile-tabs-navigation">
//         <button
//           className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
//           onClick={() => setActiveTab('items')}
//         >
//           📦 My Items ({myItems.length})
//         </button>
//         <button
//           className={`tab-btn ${activeTab === 'bids' ? 'active' : ''}`}
//           onClick={() => setActiveTab('bids')}
//         >
//           💰 Manage Bids
//         </button>
//       </div>

//       {/* Tab Content */}
//       <div className="profile-tab-content">
//         {activeTab === 'items' ? (
//           <div className="items-tab">
//             {myItems.length === 0 ? (
//               <div className="empty-state">
//                 <div className="empty-icon">📦</div>
//                 <h3>No Items Posted Yet</h3>
//                 <p>Start selling by posting your first item!</p>
//                 <button 
//                   onClick={() => navigate('/create-item')}
//                   className="cta-button"
//                 >
//                   Create Your First Item
//                 </button>
//               </div>
//             ) : (
//               <div className="items-grid">
//                 {myItems.map(item => (
//                   <div key={item.id} className="profile-item-card">
//                     {item.imageUrl && (
//                       <div className="item-image">
//                         <img src={item.imageUrl} alt={item.title} />
//                       </div>
//                     )}
//                     <div className="item-content">
//                       <h4 className="item-title">{item.title}</h4>
//                       <p className="item-description">{item.description}</p>
//                       <div className="item-details">
//                         <span className="item-price">${parseFloat(item.price).toFixed(2)}</span>
//                         <span className="item-date">
//                           Listed: {formatDate(item.createdAt)}
//                         </span>
//                       </div>
//                       <div className="item-actions">
//                         <button 
//                           onClick={() => handleEditItem(item)}
//                           className="action-btn edit-btn"
//                         >
//                           ✏️ Edit
//                         </button>
//                         <button 
//                           onClick={() => handleMarkAsSold(item.id, item.title)}
//                           className="action-btn sold-btn"
//                         >
//                           ✅ Mark Sold
//                         </button>
//                         <button 
//                           onClick={() => handleDeleteItem(item.id, item.title)}
//                           className="action-btn delete-btn"
//                         >
//                           🗑️ Delete
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         ) : (
//           <BidsManager />
//         )}
//       </div>
//     </div>
//   );
// };

// export default UserProfile;




import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI } from '../../services/api';
import BidsManager from '../../components/BidsManager/bidsManager';
import './UserProfile.css';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [activeTab, setActiveTab] = useState('items');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const getUserInfo = () => {
    const token = localStorage.getItem('token');
    let userInfo = {
      id: 'current-user',
      name: 'Current User',
      email: 'user@campus.edu'
    };

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userInfo = {
          id: payload.userId || userInfo.id,
          name: payload.name || userInfo.name,
          email: payload.email || userInfo.email
        };
      } catch (error) {
        console.log('Token is not JWT or cannot be decoded', error);
      }
    }

    return userInfo;
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError('');

      const userInfo = getUserInfo();
      setUser(userInfo);

      const itemsResponse = await itemsAPI.getAll();
      setMyItems(itemsResponse.data);

    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId, itemTitle) => {
    if (window.confirm(`Are you sure you want to delete "${itemTitle}"?`)) {
      try {
        await itemsAPI.delete(itemId);
        setMyItems(myItems.filter(item => item.id !== itemId));
        alert('Item deleted successfully!');
      } catch (err) {
        console.error('Error deleting item:', err);
        alert('Failed to delete item. Please try again.');
      }
    }
  };

  const handleEditItem = (item) => {
    navigate(`/edit-item/${item.id}`);
  };

  const handleMarkAsSold = async (itemId, itemTitle) => {
    if (window.confirm(`Mark "${itemTitle}" as sold?`)) {
      try {
        console.log('Attempting to mark item as sold:', itemId);
        
        // Check if token exists
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Please login again. Your session may have expired.');
          navigate('/login');
          return;
        }

        console.log('Token exists, making API call...');
        
        // Make the API call to mark as sold
        const response = await itemsAPI.markAsSold(itemId);
        
        console.log('Mark as sold successful:', response.data);
        
        // Remove the item from the list
        setMyItems(myItems.filter(item => item.id !== itemId));
        alert('Item marked as sold successfully!');
        
      } catch (err) {
        console.error('Error marking item as sold:', err);
        
        // Detailed error information
        if (err.response) {
          console.error('Response status:', err.response.status);
          console.error('Response data:', err.response.data);
          console.error('Response headers:', err.response.headers);
          
          if (err.response.status === 401) {
            alert('Authentication failed. Please login again.');
            localStorage.removeItem('token');
            navigate('/login');
          } else if (err.response.status === 403) {
            alert('You do not have permission to mark this item as sold.');
          } else if (err.response.status === 404) {
            alert('Item not found. It may have been already deleted.');
          } else {
            alert(`Failed to mark item as sold: ${err.response.data?.message || 'Please try again.'}`);
          }
        } else if (err.request) {
          alert('Network error: Could not connect to the server. Please check your connection.');
        } else {
          alert(`Error: ${err.message}`);
        }
      }
    }
  };

  // Alternative method using fetch directly (if the API service isn't working)
  const handleMarkAsSoldDirect = async (itemId, itemTitle) => {
    if (window.confirm(`Mark "${itemTitle}" as sold?`)) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Please login again.');
          navigate('/login');
          return;
        }

        console.log('Using direct fetch to mark item as sold...');
        
        const response = await fetch(`/api/items/${itemId}/sell`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Direct fetch successful:', result);
        
        setMyItems(myItems.filter(item => item.id !== itemId));
        alert('Item marked as sold successfully!');
        
      } catch (err) {
        console.error('Direct fetch error:', err);
        alert(`Failed to mark item as sold: ${err.message}`);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) return (
    <div className="profile-loading">
      <div className="loading-spinner"></div>
      <p>Loading your profile...</p>
    </div>
  );

  if (error) return (
    <div className="profile-error">
      <div className="error-icon">⚠️</div>
      <h3>Error Loading Profile</h3>
      <p>{error}</p>
      <button onClick={fetchUserData} className="retry-btn">Try Again</button>
    </div>
  );

  return (
    <div className="user-profile">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-placeholder">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
        <div className="profile-info">
          <h1 className="profile-name">
            {user?.name || 'User Profile'}
          </h1>
          <p className="profile-email">{user?.email}</p>
          <div className="profile-stats">
            <div className="stat">
              <span className="stat-number">{myItems.length}</span>
              <span className="stat-label">Items Posted</span>
            </div>
            <div className="stat">
              <span className="stat-number">0</span>
              <span className="stat-label">Active Bids</span>
            </div>
            <div className="stat">
              <span className="stat-number">
                {myItems.filter(item => item.status === 'sold').length}
              </span>
              <span className="stat-label">Items Sold</span>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="debug-info" style={{background: '#f0f8ff', padding: '10px', borderRadius: '5px', marginBottom: '20px', fontSize: '12px'}}>
        <strong>Debug Info:</strong> Token: {localStorage.getItem('token') ? 'Exists' : 'Missing'} | 
        Items: {myItems.length} | 
        API Base: /api/items/ID/sell
      </div>

      {/* Tab Navigation */}
      <div className="profile-tabs-navigation">
        <button
          className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          📦 My Items ({myItems.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'bids' ? 'active' : ''}`}
          onClick={() => setActiveTab('bids')}
        >
          💰 Manage Bids
        </button>
      </div>

      {/* Tab Content */}
      <div className="profile-tab-content">
        {activeTab === 'items' ? (
          <div className="items-tab">
            {myItems.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <h3>No Items Posted Yet</h3>
                <p>Start selling by posting your first item!</p>
                <button 
                  onClick={() => navigate('/create-item')}
                  className="cta-button"
                >
                  Create Your First Item
                </button>
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
                        <span className="item-date">
                          Listed: {formatDate(item.createdAt)}
                        </span>
                        <span className="item-id" style={{fontSize: '10px', color: '#999'}}>
                          ID: {item.id.substring(0, 8)}...
                        </span>
                      </div>
                      <div className="item-actions">
                        <button 
                          onClick={() => handleEditItem(item)}
                          className="action-btn edit-btn"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => handleMarkAsSold(item.id, item.title)}
                          className="action-btn sold-btn"
                        >
                          ✅ Mark Sold
                        </button>
                        {/* Alternative button for testing */}
                        <button 
                          onClick={() => handleMarkAsSoldDirect(item.id, item.title)}
                          className="action-btn test-btn"
                          style={{background: '#6f42c1'}}
                          title="Test with direct fetch"
                        >
                          🔧 Test Sell
                        </button>
                        <button 
                          onClick={() => handleDeleteItem(item.id, item.title)}
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
        ) : (
          <BidsManager />
        )}
      </div>
    </div>
  );
};

export default UserProfile;