import axios from 'axios';
import { auth } from '../config/firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased to 30 seconds for AI operations
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
  getUser: (token) => api.get('/api/auth/user', token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  updateUser: (userData, token) => api.put('/api/auth/user', userData, token ? { headers: { Authorization: `Bearer ${token}` } } : {}),

  // Trip endpoints
  getTrips: (token) => api.get('/api/trips', token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  createTrip: (tripData) => api.post('/api/trips', tripData, { timeout: 30000 }), // 30 seconds for trip creation
  getTripById: (id) => api.get(`/api/trips/${id}`),
  updateTrip: (id, updateData) => api.put(`/api/trips/${id}`, updateData),
  deleteTrip: (id) => api.delete(`/api/trips/${id}`),
  generateItinerary: (id, preferences) => 
    api.post(`/api/trips/${id}/generate-itinerary`, { preferences }, { timeout: 60000 }), // 60 seconds for AI generation
  regenerateItinerary: (id, data) => 
    api.post(`/api/trips/${id}/regenerate-itinerary`, data, { timeout: 60000 }), // 60 seconds for AI generation
  
  // Booking and payment endpoints
  bookTrip: (id) => api.post(`/api/trips/${id}/book`),
  processPayment: (id) => api.post(`/api/trips/${id}/payment`),
  cancelBooking: (id) => api.post(`/api/trips/${id}/cancel`),
  
  // Trip participant endpoints
  addParticipants: (tripId, participants) => 
    api.post(`/api/trips/${tripId}/participants`, { participants }),
  removeParticipant: (tripId, email) => 
    api.delete(`/api/trips/${tripId}/participants/${encodeURIComponent(email)}`),
  getParticipants: (tripId) => 
    api.get(`/api/trips/${tripId}/participants`),
};

export default api;