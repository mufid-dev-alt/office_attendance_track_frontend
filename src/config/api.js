// API endpoints configuration with improved error handling and logging
// Force using the production backend URL to ensure it's always correct
const PROD_BACKEND_URL = 'https://office-attendance-track-backend.onrender.com';
// Remove any trailing slashes to prevent double-slash issues in URL paths
const normalizeUrl = (url) => url.endsWith('/') ? url.slice(0, -1) : url;
const BASE_URL = normalizeUrl(process.env.REACT_APP_API_URL || PROD_BACKEND_URL);

// Log the base URL being used (will be removed in production)
console.log('Environment:', process.env.NODE_ENV);
console.log('Using API base URL:', BASE_URL);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

export const API_ENDPOINTS = {
  // User management
  users: {
    list: `${BASE_URL}/api/users`,
    create: `${BASE_URL}/api/users`,
    delete: (userId) => `${BASE_URL}/api/users/${userId}`,
    permanentDelete: (userId) => `${BASE_URL}/api/users/${userId}/permanent-delete`,
    undo: (userId) => `${BASE_URL}/api/users/${userId}/undo`,
  },
  auth: {
    login: `${BASE_URL}/api/login`,
    logout: `${BASE_URL}/api/logout`,
  },
  attendance: {
    list: `${BASE_URL}/api/attendance`,
    stats: `${BASE_URL}/api/attendance/stats`,
    create: `${BASE_URL}/api/attendance`,
    delete: (attendanceId) => `${BASE_URL}/api/attendance/${attendanceId}`,
    sync: `${BASE_URL}/api/attendance/force-sync`,
  },
  todos: {
    list: `${BASE_URL}/api/todos`,
    create: `${BASE_URL}/api/todos`,
    update: (todoId) => `${BASE_URL}/api/todos/${todoId}`,
    delete: (todoId) => `${BASE_URL}/api/todos/${todoId}`,
  },
};

// Add a utility function for making API requests with better error handling
export const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};