import apiClient from './client';

export const adminApi = {
  getDashboard: async () => {
    const response = await apiClient.get('/admin/dashboard/');
    return response.data;
  },

  getAllSubmissions: async (params = {}) => {
    const response = await apiClient.get('/admin/submissions/', { params });
    return response.data;
  },

  getUsers: async () => {
    const response = await apiClient.get('/admin/users/');
    return response.data;
  },

  createUser: async (userData) => {
    const response = await apiClient.post('/admin/users/', userData);
    return response.data;
  },

  toggleUserStatus: async (userId) => {
    const response = await apiClient.patch(`/admin/users/${userId}/toggle-status/`);
    return response.data;
  },

  getSettings: async () => {
    const response = await apiClient.get('/admin/settings/');
    return response.data;
  },

  updateSettings: async (settingsData) => {
    const response = await apiClient.put('/admin/settings/', settingsData);
    return response.data;
  },
};
