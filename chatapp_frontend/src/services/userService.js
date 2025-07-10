const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const FILE_BASE_URL = process.env.REACT_APP_FILE_BASE_URL;

class UserService {
  async updateProfile(token, profileData) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async getCurrentUser(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  async updateStatus(token, statusMessage) {
    try {
      return await this.updateProfile(token, { status_message: statusMessage });
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  }

  async uploadAvatar(token, file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      const uploadResult = await response.json();
      
      // Update profile with new avatar URL
      return await this.updateProfile(token, { 
        avatar: `${FILE_BASE_URL}${uploadResult.file_url}` 
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }
}

const userService = new UserService();
export default userService;
