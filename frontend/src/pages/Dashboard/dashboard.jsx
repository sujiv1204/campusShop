// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { itemsAPI } from '../../services/api';
// import './dashboard.css';

// const Dashboard = () => {
//   const [myItems, setMyItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const navigate = useNavigate();

//   useEffect(() => {
//     fetchMyItems();
//   }, []);

//   const fetchMyItems = async () => {
//     try {
//       setLoading(true);
//       // First try the specific endpoint, fallback to filtering all items
//       try {
//         const response = await itemsAPI.getMyItems();
//         setMyItems(response.data);
//       } catch (err) {
//         console.error(err);
//         // If my-items endpoint doesn't exist, get all and filter client-side
//         const response = await itemsAPI.getAll();
//         // Note: This requires your backend to include seller info or you'll need to filter differently
//         setMyItems(response.data);
//       }
//     } catch (err) {
//       setError('Failed to load your items');
//       console.error('Error fetching items:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCreateItem = () => {
//     navigate('/create-item');
//   };

//   const handleEditItem = (item) => {
//     navigate(`/edit-item/${item.id}`);
//   };

//   const handleDeleteItem = async (itemId) => {
//     if (window.confirm('Are you sure you want to delete this item?')) {
//       try {
//         await itemsAPI.delete(itemId);
//         setMyItems(myItems.filter(item => item.id !== itemId));
//       } catch (error) {
//         console.error('Error deleting item:', error);
//         setError('Error deleting item');
//       }
//     }
//   };

//   if (loading) return <div className="loading">Loading your items...</div>;
//   if (error) return <div className="error">{error}</div>;

//   return (
//     <div className="dashboard">
//       <div className="dashboard-header">
//         <h1>My Dashboard</h1>
//         <button onClick={handleCreateItem} className="create-item-btn">
//           + Create New Item
//         </button>
//       </div>

//       <h2>My Items ({myItems.length})</h2>
      
//       {myItems.length === 0 ? (
//         <div className="no-items">
//           <p>You haven't posted any items yet.</p>
//           <button onClick={handleCreateItem} className="create-first-item-btn">
//             Create Your First Item
//           </button>
//         </div>
//       ) : (
//         <div className="items-list">
//           {myItems.map((item) => (
//             <div key={item.id} className="item-card">
//               {item.imageUrl && (
//                 <div className="item-image">
//                   <img src={item.imageUrl} alt={item.title} />
//                 </div>
//               )}
              
//               <div className="item-details">
//                 <h3>{item.title}</h3>
//                 <p className="description">{item.description}</p>
//                 <p className="price">${item.price}</p>
//                 <p className="date">
//                   Posted: {new Date(item.createdAt).toLocaleDateString()}
//                 </p>
                
//                 <div className="item-actions">
//                   <button 
//                     onClick={() => handleEditItem(item)}
//                     className="edit-btn"
//                   >
//                     Edit
//                   </button>
//                   <button 
//                     onClick={() => handleDeleteItem(item.id)}
//                     className="delete-btn"
//                   >
//                     Delete
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default Dashboard;




import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI } from '../../services/api';
import './dashboard.css';

const Dashboard = () => {
  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyItems();
  }, []);

  const fetchMyItems = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await itemsAPI.getAll();
      setMyItems(response.data);
    } catch (err) {
      setError('Failed to load items');
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId, itemTitle) => {
    console.log('=== DELETE OPERATION STARTED ===');
    console.log('Item ID to delete:', itemId);
    console.log('Item Title:', itemTitle);
    console.log('Current Bearer Token:', localStorage.getItem('token'));
    
    if (window.confirm(`Are you sure you want to delete "${itemTitle}"? This action cannot be undone.`)) {
      try {
        setError('');
        setSuccess('');
        
        // Debug: Check what we're sending
        console.log('Sending DELETE request to:', `/api/items/${itemId}`);
        console.log('With Authorization header:', `Bearer ${localStorage.getItem('token')}`);
        
        // Make the DELETE request
        const response = await itemsAPI.delete(itemId);
        
        console.log('✅ DELETE SUCCESSFUL:', response.data);
        setSuccess(`"${itemTitle}" has been deleted successfully!`);
        
        // Update UI by removing the deleted item
        setMyItems(prevItems => prevItems.filter(item => item.id !== itemId));
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
        
      } catch (error) {
        console.error('❌ DELETE FAILED:', error);
        
        // Detailed error analysis
        if (error.response) {
          // Server responded with error status
          console.log('Error Status:', error.response.status);
          console.log('Error Data:', error.response.data);
          console.log('Error Headers:', error.response.headers);
          
          if (error.response.status === 403) {
            setError('🚫 Access Denied: You can only delete items that you created.');
          } else if (error.response.status === 404) {
            setError('🔍 Item Not Found: The item may have been already deleted.');
          } else if (error.response.status === 401) {
            setError('🔐 Authentication Failed: Please login again.');
            localStorage.removeItem('token');
            navigate('/login');
          } else {
            setError(`❌ Server Error: ${error.response.data?.message || 'Please try again.'}`);
          }
        } else if (error.request) {
          // Request was made but no response received
          setError('🌐 Network Error: Could not connect to the server.');
        } else {
          // Something else happened
          setError(`💥 Unexpected Error: ${error.message}`);
        }
        
        // Clear error after 5 seconds
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  const handleCreateItem = () => {
    navigate('/create-item');
  };

  const handleEditItem = (item) => {
    navigate(`/edit-item/${item.id}`);
  };

  // Test function to verify API connection
  const testDeleteAPI = async () => {
    if (myItems.length === 0) {
      setError('No items available to test');
      return;
    }
    
    const testItem = myItems[0];
    console.log('🧪 TESTING DELETE API WITH ITEM:', testItem);
    
    try {
      const response = await fetch(`/api/items/${testItem.id}`, {
        method: 'GET', // Just test if endpoint exists
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Test GET response:', response.status, response.statusText);
    } catch (testError) {
      console.error('Test failed:', testError);
    }
  };

  if (loading) return <div className="loading">Loading your items...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>My Dashboard</h1>
        <div className="header-actions">
          <button onClick={testDeleteAPI} className="test-btn" title="Test API connection">
            {/* 🧪 Test API */}
          </button>
          <button onClick={handleCreateItem} className="create-item-btn">
            + Create New Item
          </button>
        </div>
      </div>

      {/* Debug Information */}
      {/* <div className="debug-info">
        <h3>Debug Information</h3>
        <p><strong>Authentication:</strong> {localStorage.getItem('token') ? '✅ Logged In' : '❌ Not Logged In'}</p>
        <p><strong>Token Present:</strong> {localStorage.getItem('token') ? 'Yes' : 'No'}</p>
        <p><strong>Items Loaded:</strong> {myItems.length}</p>
        <p><strong>First Item ID (if any):</strong> {myItems[0]?.id || 'None'}</p>
      </div> */}

      {/* Messages */}
      {success && (
        <div className="success-message">
          ✅ {success}
          <button onClick={() => setSuccess('')} className="close-message">×</button>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          ❌ {error}
          <button onClick={() => setError('')} className="close-message">×</button>
        </div>
      )}

      <h2>Available Items ({myItems.length})</h2>
      
      {myItems.length === 0 ? (
        <div className="no-items">
          <p>No items found. Create your first item!</p>
          <button onClick={handleCreateItem} className="create-first-item-btn">
            Create Your First Item
          </button>
        </div>
      ) : (
        <div className="items-list">
          {myItems.map((item) => (
            <div key={item.id} className="item-card">
              {item.imageUrl && (
                <div className="item-image">
                  <img src={item.imageUrl} alt={item.title}   />
                </div>
              )}
              
              <div className="item-details">
                <h3>{item.title}</h3>
                <p className="description">{item.description}</p>
                <p className="price">${parseFloat(item.price).toFixed(2)}</p>
                <p className="date">Posted: {new Date(item.createdAt).toLocaleDateString()}</p>
                
                <div className="item-actions">
                  <button 
                    onClick={() => handleEditItem(item)}
                    className="edit-btn"
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteItem(item.id, item.title)}
                    className="delete-btn"
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
  );
};

export default Dashboard;