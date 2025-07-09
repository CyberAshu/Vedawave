import axios from 'axios';

const REACT_APP_API_BASE_URL =process.env.REACT_APP_API_BASE_URL;

const createAuthHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`
  }
});

const chatService = {
  getUsers: async (token) => {
    const response = await axios.get(`${REACT_APP_API_BASE_URL}/users`, createAuthHeaders(token));
    return response.data;
  },

  getChats: async (token) => {
    const response = await axios.get(`${REACT_APP_API_BASE_URL}/chats`, createAuthHeaders(token));
    return response.data;
  },

  createChat: async (token, userId) => {
    const response = await axios.post(
      `${REACT_APP_API_BASE_URL}/chats`,
      { user_id: userId },
      createAuthHeaders(token)
    );
    return response.data;
  },

  getMessages: async (token, chatId) => {
    const response = await axios.get(
      `${REACT_APP_API_BASE_URL}/chats/${chatId}/messages`,
      createAuthHeaders(token)
    );
    return response.data;
  },

  uploadFile: async (token, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(
      `${REACT_APP_API_BASE_URL}/upload`,
      formData,
      {
        ...createAuthHeaders(token),
        headers: {
          ...createAuthHeaders(token).headers,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  },

  editMessage: async (token, messageId, content) => {
    const response = await axios.put(
      `${REACT_APP_API_BASE_URL}/messages/${messageId}`,
      { content },
      createAuthHeaders(token)
    );
    return response.data;
  },

  addReaction: async (token, messageId, emoji) => {
    const response = await axios.post(
      `${REACT_APP_API_BASE_URL}/messages/${messageId}/reactions`,
      { emoji },
      createAuthHeaders(token)
    );
    return response.data;
  }
};

export default chatService;
