// Dynamic API configuration for different environments
const getApiBaseUrl = () => {
    // For production, use the correct backend Vercel URL
    if (process.env.NODE_ENV === 'production') {
        return 'https://office-attendance-track-backend.vercel.app';
    }
    // For development, use localhost
    return 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

console.log('API_BASE_URL:', API_BASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Using correct deployed backend URL - Back to /api prefix');

export const API_ENDPOINTS = {
    auth: {
        login: `${API_BASE_URL}/api/login`,
        logout: `${API_BASE_URL}/api/logout`
    },
    attendance: {
        create: `${API_BASE_URL}/api/attendance`,
        list: `${API_BASE_URL}/api/attendance`,
        stats: `${API_BASE_URL}/api/attendance/stats`,
        update: (id) => `${API_BASE_URL}/api/attendance/${id}`,
        delete: (id) => `${API_BASE_URL}/api/attendance/${id}`
    },
    users: {
        list: `${API_BASE_URL}/api/users`,
        get: (id) => `${API_BASE_URL}/api/users/${id}`,
        create: `${API_BASE_URL}/api/users`,
        delete: (id) => `${API_BASE_URL}/api/users/${id}`
    },
    todos: {
        create: `${API_BASE_URL}/api/todos`,
        list: `${API_BASE_URL}/api/todos`,
        update: (id) => `${API_BASE_URL}/api/todos/${id}`,
        delete: (id) => `${API_BASE_URL}/api/todos/${id}`
    }
};

export default API_ENDPOINTS; 