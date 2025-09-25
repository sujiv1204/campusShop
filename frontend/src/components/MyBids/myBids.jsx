// // components/MyBids.jsx
// import { useState, useEffect } from 'react';
// import axios from 'axios';

// const MyBids = () => {
//   const [bids, setBids] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     fetchUserBids();
//   }, []);

//   const fetchUserBids = async () => {
//     try {
//       setLoading(true);
//       setError('');
      
//       const token = localStorage.getItem('token'); // or your token storage method
//       if (!token) {
//         throw new Error('No authentication token found');
//       }

//       const response = await axios.get(
//         `${process.env.REACT_APP_API_URL || 'http://localhost:5003'}/api/bids/my-bids`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       setBids(response.data);
//     } catch (error) {
//       console.error('Error fetching user bids:', error);
//       setError(error.response?.data?.message || 'Failed to fetch bids');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString();
//   };

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD'
//     }).format(amount);
//   };

//   if (loading) {
//     return (
//       <div className="my-bids-container">
//         <div className="loading-spinner">Loading your bids...</div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="my-bids-container">
//         <div className="error-message">
//           <p>Error: {error}</p>
//           <button onClick={fetchUserBids} className="retry-btn">
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="my-bids-container">
//       <div className="my-bids-header">
//         <h2>My Bids ({bids.length})</h2>
//         <button onClick={fetchUserBids} className="refresh-btn">
//           🔄 Refresh
//         </button>
//       </div>

//       {bids.length === 0 ? (
//         <div className="no-bids">
//           <p>You haven't placed any bids yet.</p>
//         </div>
//       ) : (
//         <div className="bids-list">
//           {bids.map((bid) => (
//             <div key={bid._id || bid.id} className="bid-card">
//               <div className="bid-info">
//                 <h3>{bid.itemName || 'Unnamed Item'}</h3>
//                 <p className="bid-amount">
//                   Your Bid: <strong>{formatCurrency(bid.bidAmount)}</strong>
//                 </p>
//                 <p className="bid-time">
//                   Placed on: {formatDate(bid.bidTime || bid.createdAt)}
//                 </p>
//                 <p className={`bid-status ${bid.status?.toLowerCase()}`}>
//                   Status: {bid.status || 'Active'}
//                 </p>
//                 {bid.currentHighestBid && (
//                   <p className="current-highest">
//                     Current Highest: {formatCurrency(bid.currentHighestBid)}
//                   </p>
//                 )}
//               </div>
//               <div className="bid-actions">
//                 {bid.status === 'Active' && (
//                   <button className="view-item-btn">
//                     View Item
//                   </button>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default MyBids;