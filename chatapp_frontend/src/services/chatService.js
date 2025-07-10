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

  getMessages: async (token, chatId, limit = 10, offset = 0) => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    const response = await axios.get(
      `${REACT_APP_API_BASE_URL}/chats/${chatId}/messages?${params}`,
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
  },

  deleteChat: async (token, chatId) => {
    const response = await axios.delete(
      `${REACT_APP_API_BASE_URL}/chats/${chatId}`,
      createAuthHeaders(token)
    );
    return response.data;
  },

  deleteMultipleChats: async (token, chatIds) => {
    // Ensure chatIds is always an array
    const idsArray = Array.isArray(chatIds) ? chatIds : [chatIds];
    
    const response = await axios({
      url: `${REACT_APP_API_BASE_URL}/chats/bulk`,
      method: 'DELETE',
      headers: {
        ...createAuthHeaders(token).headers,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({ chat_ids: idsArray })
    });
    return response.data;
  }
};

export default chatService;
