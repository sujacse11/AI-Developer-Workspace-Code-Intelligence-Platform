import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token to every outgoing request if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Handle 401 Unauthorized token refresh automatically
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/users/refresh/`, { refresh: refreshToken });
          const newAccess = res.data.access;
          localStorage.setItem('access_token', newAccess);
          if (res.data.refresh) {
            localStorage.setItem('refresh_token', res.data.refresh);
          }
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return apiClient(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/auth';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Endpoints helper API
export const api = {
  // Auth
  login: (username, password) => apiClient.post('/users/login/', { username, password }),
  register: (data) => apiClient.post('/users/register/', data),
  getProfile: () => apiClient.get('/users/me/'),
  updateProfile: (data) => apiClient.patch('/users/me/', data),
  getDashboard: () => apiClient.get('/dashboard/'),
  getActivityLog: () => apiClient.get('/users/activity/'),

  // Projects & Files
  getProjects: () => apiClient.get('/projects/'),
  getProject: (id) => apiClient.get(`/projects/${id}/`),
  createProject: (data) => apiClient.post('/projects/', data),
  deleteProject: (id) => apiClient.delete(`/projects/${id}/`),
  createFile: (projectId, data) => apiClient.post(`/projects/${projectId}/files/`, data),
  saveFile: (fileId, data) => apiClient.put(`/files/${fileId}/`, data),
  deleteFile: (fileId) => apiClient.delete(`/files/${fileId}/`),
  getFileVersions: (fileId) => apiClient.get(`/files/${fileId}/versions/`),
  revertFileVersion: (fileId, versionId) => apiClient.post(`/files/${fileId}/revert/${versionId}/`),
  uploadZip: (projectId, formData) => apiClient.post(`/projects/${projectId}/upload/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  downloadZipUrl: (projectId) => `${API_BASE_URL}/projects/${projectId}/download/`,

  // AI Actions & Jobs
  executeAI: (data) => apiClient.post('/ai/execute/', data),
  getAIJob: (jobId) => apiClient.get(`/ai/jobs/${jobId}/`),
  getAIHistory: (params) => apiClient.get('/ai/history/', { params }),

  // Collaboration
  getProjectMembers: (projectId) => apiClient.get(`/projects/${projectId}/members/`),
  addProjectMember: (projectId, data) => apiClient.post(`/projects/${projectId}/members/`, data),
  getFileComments: (fileId) => apiClient.get(`/files/${fileId}/comments/`),
  addFileComment: (fileId, data) => apiClient.post(`/files/${fileId}/comments/`, data),
  getReviewHistory: (projectId) => apiClient.get(`/projects/${projectId}/review-history/`),

  // Admin Panel
  getAdminOverview: () => apiClient.get('/admin/stats/overview/'),
  getAdminAIUsage: () => apiClient.get('/admin/ai-usage/'),
  getAdminUsers: () => apiClient.get('/admin/users/'),
  toggleAdminUserActive: (userId) => apiClient.patch(`/admin/users/${userId}/toggle/`),
  getAdminSettings: () => apiClient.get('/admin/settings/'),
  updateAdminSettings: (data) => apiClient.patch('/admin/settings/', data),
};
