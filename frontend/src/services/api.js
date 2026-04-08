import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const ASSETS_URL = process.env.REACT_APP_ASSETS_URL || 'http://localhost:5000';

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const jobs = {
  getAll: (params) => api.get('/jobs', { params }),
  getById: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
  getMyJobs: () => api.get('/jobs/my-jobs/list'),
  getMatches: (params) => api.get('/jobs/match', { params }),
  getRecommendations: () => api.get('/recommendations'),
};

export const applications = {
  getAll: (params) => api.get('/applications', { params }),
  apply: (data) => api.post('/applications', data),
  getById: (id) => api.get(`/applications/${id}`),
  updateStatus: (id, data) => api.put(`/applications/${id}/status`, data),
  schedule: (id, data) => api.post(`/applications/${id}/schedule`, data),
  delete: (id) => api.delete(`/applications/${id}`),
};

export const companies = {
  getAll: (params) => api.get('/companies', { params }),
  getById: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post('/companies', data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  getMyCompany: () => api.get('/companies/my-company'),
  getJobs: (id, params) => api.get(`/companies/${id}/jobs`, { params }),
};

export const reviews = {
  getByCompany: (companyId, params) => api.get(`/reviews/company/${companyId}`, { params }),
  create: (data) => api.post('/reviews', data),
  markHelpful: (id) => api.post(`/reviews/${id}/helpful`),
};

export const users = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadResume: (formData) => api.post('/users/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getSavedJobs: () => api.get('/users/saved-jobs'),
  saveJob: (jobId) => api.post(`/users/saved-jobs/${jobId}`),
  unsaveJob: (jobId) => api.delete(`/users/saved-jobs/${jobId}`),
  addEducation: (data) => api.post('/users/education', data),
  deleteEducation: (id) => api.delete(`/users/education/${id}`),
  addExperience: (data) => api.post('/users/experience', data),
  deleteExperience: (id) => api.delete(`/users/experience/${id}`),
  updateSkills: (skillIds) => api.post('/users/skills', { skillIds }),
};

export const notifications = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const skills = {
  getAll: (params) => api.get('/skills', { params }),
  getCategories: () => api.get('/skills/categories'),
  create: (data) => api.post('/skills', data),
};

export const search = {
  jobs: (params) => api.get('/search/jobs', { params }),
  suggestions: (q) => api.get('/search/suggestions', { params: { q } }),
  candidates: (params) => api.get('/search/candidates', { params }),
};

export const analytics = {
  getRecruiter: () => api.get('/analytics/recruiter'),
  getSeeker: () => api.get('/analytics/seeker'),
};

export const assets = {
  getResumeUrl: (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${ASSETS_URL}${cleanPath}`;
  }
};

export default api;