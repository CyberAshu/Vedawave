import axios from 'axios';

const REACT_APP_API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const authService = {
  login: async (email, password) => {
    const response = await axios.post(`${REACT_APP_API_BASE_URL}/auth/login`, {
      email,
      password
    });
    return response.data;
  },

  register: async (name, email, password, avatar = null) => {
    const response = await axios.post(`${REACT_APP_API_BASE_URL}/auth/register`, {
      name,
      email,
      password,
      avatar
    });
    return response.data;
  },

  logout: async (token) => {
    const response = await axios.post(`${REACT_APP_API_BASE_URL}/auth/logout`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  getCurrentUser: async (token) => {
    const response = await axios.get(`${REACT_APP_API_BASE_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  updateProfile: async (token, profileData) => {
    const response = await axios.put(`${REACT_APP_API_BASE_URL}/users/me`, profileData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  }
};

export default authService;
