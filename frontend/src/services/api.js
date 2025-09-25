// import axios from 'axios';

// const API_BASE = '/api';

// const api = axios.create({
//   baseURL: API_BASE,
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// // Items API
// export const itemsAPI = {
//   getAll: () => api.get('/items/'),
//   getById: (id) => api.get(`/items/${id}`),
//   create: (itemData) => api.post('/items/', itemData),
//   update: (id, itemData) => api.put(`/items/${id}`, itemData),
//   delete: (id) => api.delete(`/items/${id}`),
//   uploadImage: (id, imageFile) => {
//     const formData = new FormData();
//     formData.append('image', imageFile);
//     return api.post(`/items/${id}/upload-image`, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     });
//   },
//   markAsSold: (id) => {
//     // Make sure we're using the correct endpoint and method
//     return api.post(`/items/${id}/sell`, {}, {
//       headers: {
//         'Content-Type': 'application/json'
//       }
//     });
//   },

//   // Add endpoint to get user's items
//   getMyItems: () => api.get('/items/my-items'),
// };

// // Bids API
// export const bidsAPI = {
//   placeBid: (bidData) => api.post('/bids/', bidData),
//   getBidsByItem: (itemId) => api.get(`/bids/item/${itemId}`),
//   getMyBids: () => api.get('/bids/my-bids'),
//   // Add these endpoints for bid management
//   acceptBid: (bidId) => api.patch(`/bids/${bidId}/accept`),
//   rejectBid: (bidId) => api.patch(`/bids/${bidId}/reject`),
//   getReceivedBids: () => api.get('/bids/received'),
  
// };

// // User API - Add this section
// export const userAPI = {
//   // Get current user profile - you might need to create this endpoint
//   getProfile: () => api.get('/auth/profile'),
//   // Update user profile
//   updateProfile: (profileData) => api.put('/auth/profile', profileData),
// };

// // If the profile endpoint doesn't exist, we can create a fallback
// export const authAPI = {
//   getProfile: () => {
//     // Fallback: Since we might not have a profile endpoint,
//     // we can return basic user info from the token or create a mock response
//     const token = localStorage.getItem('token');
//     if (!token) {
//       return Promise.reject(new Error('No token found'));
//     }
    
//     // Try to decode the token to get user info (if it's a JWT)
//     try {
//       const payload = JSON.parse(atob(token.split('.')[1]));
//       return Promise.resolve({
//         data: {
//           id: payload.userId || 'unknown',
//           name: payload.name || 'User',
//           email: payload.email || 'user@example.com'
//         }
//       });
//     } catch (error) {
//         console.log(error);
//       // If token decoding fails, return a mock profile
//       return Promise.resolve({
//         data: {
//           id: 'user-id',
//           name: 'Current User',
//           email: 'user@campus.edu'
//         }
//       });
//     }
//   }
// };

// export default api;




// import axios from 'axios';

// const API_BASE = '/api';

// const api = axios.create({
//   baseURL: API_BASE,
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// // Helper function to get user ID from token
// const getUserIdFromToken = () => {
//   const token = localStorage.getItem('token');
//   if (!token) return null;
  
//   try {
//     const payload = JSON.parse(atob(token.split('.')[1]));
//     return payload.userId;
//   } catch (error) {
//     console.error('Error decoding token:', error);
//     return null;
//   }
// };

// // Items API
// export const itemsAPI = {
//   getAll: () => api.get('/items/'),
//   getById: (id) => api.get(`/items/${id}`),
//   create: (itemData) => api.post('/items/', itemData),
//   update: (id, itemData) => api.put(`/items/${id}`, itemData),
//   delete: (id) => api.delete(`/items/${id}`),
//   uploadImage: (id, imageFile) => {
//     const formData = new FormData();
//     formData.append('image', imageFile);
//     return api.post(`/items/${id}/upload-image`, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     });
//   },
//   markAsSold: (id) => {
//     return api.post(`/items/${id}/sell`, {}, {
//       headers: {
//         'Content-Type': 'application/json'
//       }
//     });
//   },
//   getMyItems: () => api.get('/items/my-items'),
// };

// // Bids API - UPDATED
// export const bidsAPI = {
//   placeBid: (bidData) => api.post('/bids/', bidData),
//   getBidsByItem: (itemId) => api.get(`/bids/item/${itemId}`),
  
//   // CORRECTED: Get user's bids with bidderId parameter
//   getMyBids: () => {
//     const bidderId = getUserIdFromToken();
//     if (!bidderId) {
//       return Promise.reject(new Error('User ID not found in token'));
//     }
//     console.log('##########', bidderId);
//     return api.get(`/bids?bidderId=${bidderId}`);
//   },
  
//   // Alternative method if you want to keep the backend route structure
//   getMyBidsAlt: () => api.get('/bids/my-bids'), // This would require backend route change
  
//   acceptBid: (bidId) => api.patch(`/bids/${bidId}/accept`),
//   rejectBid: (bidId) => api.patch(`/bids/${bidId}/reject`),
//   getReceivedBids: () => api.get('/bids/received'),
// };

// // User API
// export const userAPI = {
//   getProfile: () => api.get('/auth/profile'),
//   updateProfile: (profileData) => api.put('/auth/profile', profileData),
// };

// export const authAPI = {
//   getProfile: () => {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       return Promise.reject(new Error('No token found'));
//     }
    
//     try {
//       const payload = JSON.parse(atob(token.split('.')[1]));
//       return Promise.resolve({
//         data: {
//           id: payload.userId || 'unknown',
//           name: payload.name || 'User',
//           email: payload.email || 'user@example.com'
//         }
//       });
//     } catch (error) {
//       console.log(error);
//       return Promise.resolve({
//         data: {
//           id: 'user-id',
//           name: 'Current User',
//           email: 'user@campus.edu'
//         }
//       });
//     }
//   }
// };

// export default api;



import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Items API
export const itemsAPI = {
  getAll: () => api.get('/items/'),
  getById: (id) => api.get(`/items/${id}`),
  create: (itemData) => api.post('/items/', itemData),
  update: (id, itemData) => api.put(`/items/${id}`, itemData),
  delete: (id) => api.delete(`/items/${id}`),
  uploadImage: (id, imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return api.post(`/items/${id}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  markAsSold: (id) => {
    return api.post(`/items/${id}/sell`, {}, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  },
  getMyItems: () => api.get('/items/my-items'),
  
  // NEW: Get bids for items I've made (as a seller)
  getMyItemBids: () => api.get('/items/me/bids'),
};

// Bids API
export const bidsAPI = {
  placeBid: (bidData) => api.post('/bids/', bidData),
  getBidsByItem: (itemId) => api.get(`/bids/item/${itemId}`),
  
  // UPDATED: Use the new endpoint
  getMyBids: () => api.get('/profiles/me/bids'), // This is the correct endpoint now
  
  acceptBid: (bidId) => api.patch(`/bids/${bidId}/accept`),
  rejectBid: (bidId) => api.patch(`/bids/${bidId}/reject`),
  getReceivedBids: () => api.get('/bids/received'),
};

export default api;