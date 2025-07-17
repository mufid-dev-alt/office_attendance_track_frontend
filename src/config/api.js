// API endpoints configuration
const BASE_URL = process.env.REACT_APP_API_URL || 'https://office-attendance-track-backend.vercel.app';

export const API_ENDPOINTS = {
  // User management
  USERS: `${BASE_URL}/api/users`,
  LOGIN: `${BASE_URL}/api/login`,
  LOGOUT: `${BASE_URL}/api/logout`,

  // Attendance management
  ATTENDANCE: `${BASE_URL}/api/attendance`,
  ATTENDANCE_SYNC: `${BASE_URL}/api/attendance/force-sync`,

  // Todo management
  TODOS: `${BASE_URL}/api/todos`,

  // Health check
  HEALTH: `${BASE_URL}/health`,
}; 