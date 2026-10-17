import apiClient from './client';

export const authApi = {
  login: async (identifier, password, portal = 'user') => {
    const response = await apiClient.post('/auth/login/', {
      identifier,
      password,
      portal,
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/auth/profile/');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await apiClient.put('/auth/profile/', profileData);
    return response.data;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout/');
    } catch (e) {
      // Ignore network errors on logout
    }
    localStorage.removeItem('logpro_access_token');
    localStorage.removeItem('logpro_refresh_token');
    localStorage.removeItem('logpro_user');
  },
};
