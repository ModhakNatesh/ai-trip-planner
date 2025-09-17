import axios from 'axios';
import { auth } from '../config/firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      auth.signOut();
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Sample API call
  hello: () => api.get('/api/hello'),
  
  // Status check
  getStatus: () => api.get('/api/status'),

  // Auth endpoints
  verifyToken: (token) => api.post('/api/auth/verify-token', { token }),
  getUser: () => api.get('/api/auth/user'),
  updateUser: (userData) => api.put('/api/auth/user', userData),

  // Trip endpoints
  getTrips: () => api.get('/api/trips'),
  createTrip: (tripData) => api.post('/api/trips', tripData),
  getTripById: (id) => api.get(`/api/trips/${id}`),
  updateTrip: (id, updateData) => api.put(`/api/trips/${id}`, updateData),
  deleteTrip: (id) => api.delete(`/api/trips/${id}`),
  generateItinerary: (id, preferences) => 
    api.post(`/api/trips/${id}/generate-itinerary`, { preferences }),
};

export default api;