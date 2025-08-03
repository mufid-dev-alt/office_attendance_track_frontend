// API endpoints configuration with improved error handling and logging
const BASE_URL = process.env.REACT_APP_API_URL || 'https://office-attendance-track-backend.onrender.com';

// Log the base URL being used for debugging
console.log('Using API base URL:', BASE_URL);
console.log('Environment:', process.env.NODE_ENV);
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
    console.log('Making API request to:', url);
    console.log('Request options:', options);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      let errorData = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        console.error('Could not parse error response as JSON');
      }
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('Successful response data:', responseData);
    return responseData;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};