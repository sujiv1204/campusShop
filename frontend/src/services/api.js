import axios from 'axios';

const API_BASE = '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token in every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem('token');
      window.location.href = '/login'; // Redirect to login
    }
    return Promise.reject(error);
  }
);

// Items API
export const itemsAPI = {
  // Get all items
  getAll: () => api.get('/items/'),
  
  // Get items by current user
  getMyItems: () => api.get('/items/my-items'),
  
  // Get single item
  getById: (id) => api.get(`/items/${id}`),
  
  // Create new item
  create: (itemData) => api.post('/items/', itemData),
  
  // Update item
  update: (id, itemData) => api.put(`/items/${id}`, itemData),
  
  // Delete item
  delete: (id) => api.delete(`/items/${id}`),
  
  // Upload image
  uploadImage: (id, imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return api.post(`/items/${id}/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};

export default api;