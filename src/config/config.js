// Configuration for different environments
const config = {
  development: {
    API_BASE_URL: 'http://localhost:8000/api'
  },
  production: {
    API_BASE_URL: 'https://office-attendance-track-backend.vercel.app/api'
  }
};

// Determine current environment
const environment = process.env.NODE_ENV || 'development';

// Export the configuration for the current environment
export const API_BASE_URL = config[environment].API_BASE_URL;

// Helper function to build API URLs
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
};

export default config[environment]; 