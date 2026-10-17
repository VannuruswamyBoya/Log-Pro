import apiClient from './client';

export const reportsApi = {
  getWeeklySummary: async (params = {}) => {
    const response = await apiClient.get('/reports/weekly/', { params });
    return response.data;
  },

  exportCSV: async (params = {}) => {
    const response = await apiClient.get('/reports/export/csv/', {
      params,
      responseType: 'blob',
    });
    downloadBlob(response.data, `LogPro_Report_${params.start_date || 'week'}.csv`);
  },

  exportExcel: async (params = {}) => {
    const response = await apiClient.get('/reports/export/excel/', {
      params,
      responseType: 'blob',
    });
    downloadBlob(response.data, `LogPro_Report_${params.start_date || 'week'}.xlsx`);
  },

  exportPDF: async (params = {}) => {
    const response = await apiClient.get('/reports/export/pdf/', {
      params,
      responseType: 'blob',
    });
    downloadBlob(response.data, `LogPro_Report_${params.start_date || 'week'}.pdf`);
  },
};

function downloadBlob(blobData, fallbackName) {
  const url = window.URL.createObjectURL(new Blob([blobData]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fallbackName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
