import axios from 'axios';

const REACT_APP_API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Get auth token from localStorage
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  return token ? `Bearer ${token}` : null;
};

// Create axios instance with auth headers
const api = axios.create({
  baseURL: REACT_APP_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

export const friendService = {
  // Search users (excluding friends and pending requests)
  searchUsers: async (query = '') => {
    try {
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Send friend request
  sendFriendRequest: async (receiverId) => {
    try {
      const response = await api.post('/friend-requests', {
        receiver_id: receiverId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get friend requests (sent and received)
  getFriendRequests: async () => {
    try {
      const response = await api.get('/friend-requests');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update friend request (accept/reject)
  updateFriendRequest: async (requestId, status) => {
    try {
      const response = await api.put(`/friend-requests/${requestId}`, {
        status
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get friends list
  getFriends: async () => {
    try {
      const response = await api.get('/friends');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
