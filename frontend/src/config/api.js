// config/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  endpoints: {
    login: '/users/login',
    signup: '/users/signup',
    logout: '/users/logout',
    googleLogin: '/users/google-login',
    
    me: '/users/me',
    updateProfile: '/users/me',
    uploadAvatar: '/users/upload-avatar',
    deleteAvatar: '/users/delete-avatar',
    
    forgotPassword: '/users/forgot-password',
    resetPassword: '/users/reset-password',
    changePassword: '/users/change-password',
    
    myImages: '/ip/my-images',
    runPipeline: '/ip/run-pipeline',
    matches: (imageId) => `/ip/matches/${imageId}`,
    confirmMatch: (matchId) => `/ip/confirm-match/${matchId}`,
    reviewHistory: '/ip/match-history',
    matchStats: '/ip/match-stats',
    
    dmcaReports: '/ip/dmca/reports',
    dmcaReportDownload: (reportId) => `/ip/dmca/report/${reportId}/download`,
    sendDmcaEmail: (reportId) => `/ip/dmca/report/${reportId}/send-email`,
    
    notifications: '/notifications',
  }
};

export const buildUrl = (endpoint) => {
  const path = typeof endpoint === 'function' ? endpoint : endpoint;
  return `${API_CONFIG.baseURL}${path}`;
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const getAuthHeadersForUpload = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
  };
};

export const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
  };
};

export default API_CONFIG;