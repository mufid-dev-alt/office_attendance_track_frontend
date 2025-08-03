// API endpoints configuration with improved error handling and logging
const BASE_URL = (process.env.REACT_APP_API_URL || 'https://office-attendance-track-backend.onrender.com').replace(/\/+$/, '');

// Log the base URL being used (for debugging)
console.log('Using API base URL:', BASE_URL);
console.log('Environment:', process.env.NODE_ENV);
console.log('Raw REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

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

// Log the login endpoint for debugging
console.log('Login endpoint URL:', API_ENDPOINTS.auth.login);

// Utility function for making API requests with error handling
export const apiRequest = async (url, options = {}) => {
  try {
    console.log('Making API request to:', url);
    console.log('Request options:', options);
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        // If not JSON, use status text
      }
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error.message);
    throw error;
  }
};