// API endpoints configuration
const BASE_URL = process.env.REACT_APP_API_URL || 'https://office-attendance-track-backend.onrender.com';

// Utility function to check API health
export const checkApiHealth = async () => {
  try {
    console.log('Checking API health at:', `${BASE_URL}/api/health`);
    const response = await fetch(`${BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors'
    });
    
    if (!response.ok) {
      console.error('API health check failed with status:', response.status);
      return { healthy: false, error: `HTTP error ${response.status}` };
    }
    
    const data = await response.json();
    console.log('API health check response:', data);
    return { 
      healthy: data.status === 'healthy', 
      database: data.database,
      error: data.status !== 'healthy' ? data.message : null 
    };
  } catch (error) {
    console.error('API health check failed:', error);
    return { healthy: false, error: error.message };
  }
};

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
  health: {
    check: `${BASE_URL}/api/health`,
  },
};