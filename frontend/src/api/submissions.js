import apiClient from './client';

export const submissionsApi = {
  getTodayStatus: async () => {
    const response = await apiClient.get('/submissions/status/today/');
    return response.data;
  },

  uploadSubmission: async (formData, onProgress = null) => {
    const response = await apiClient.post('/submissions/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return response.data;
  },

  getMyHistory: async (params = {}) => {
    const response = await apiClient.get('/submissions/my-history/', { params });
    return response.data;
  },

  downloadSubmission: async (submissionId, filename = 'log_sheet') => {
    const response = await apiClient.get(`/submissions/${submissionId}/download/`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
