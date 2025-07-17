/**
 * Utility functions for handling API errors consistently across the application
 */

import { checkApiHealth } from '../config/api';

/**
 * Handle API response errors and update API health status
 * @param {Response} response - The fetch API response object
 * @param {Function} setApiHealthy - State setter for API health status
 * @param {Function} showNotification - Function to display notifications (optional)
 * @param {Function} handleAuthError - Function to handle authentication errors (optional)
 * @returns {Object} - Object with error information
 */
export const handleApiError = async (response, setApiHealthy, showNotification = null, handleAuthError = null) => {
  // Handle HTTP error status codes
  if (!response.ok) {
    // Authentication errors
    if (response.status === 401 || response.status === 403) {
      if (handleAuthError) {
        handleAuthError();
      }
      return { 
        success: false, 
        message: 'Authentication error. Please log in again.', 
        status: response.status 
      };
    }
    
    // Server errors (likely API health issues)
    if (response.status >= 500) {
      if (setApiHealthy) {
        setApiHealthy(false);
      }
      
      const message = 'Server error. Please try again later.';
      if (showNotification) {
        showNotification(message, 'error');
      }
      
      return { 
        success: false, 
        message, 
        status: response.status 
      };
    }
    
    // Other client errors
    const message = `Request failed with status: ${response.status}`;
    if (showNotification) {
      showNotification(message, 'error');
    }
    
    return { 
      success: false, 
      message, 
      status: response.status 
    };
  }
  
  return { success: true };
};

/**
 * Check API health and handle the result
 * @param {boolean} currentApiHealthy - Current API health status
 * @param {Function} setApiHealthy - State setter for API health status
 * @param {Function} showNotification - Function to display notifications (optional)
 * @returns {boolean} - Whether the API is healthy and operation can proceed
 */
export const checkAndHandleApiHealth = async (currentApiHealthy, setApiHealthy, showNotification = null) => {
  // If API is already known to be unhealthy, check health
  if (!currentApiHealthy) {
    try {
      const health = await checkApiHealth();
      
      if (!health.healthy) {
        const message = 'Server connection issues. Please try again later.';
        if (showNotification) {
          showNotification(message, 'error');
        }
        return false;
      }
      
      // Update API status if it's now healthy
      if (setApiHealthy) {
        setApiHealthy(true);
      }
      return true;
    } catch (e) {
      const message = 'Cannot connect to server. Please try again later.';
      if (showNotification) {
        showNotification(message, 'error');
      }
      return false;
    }
  }
  
  // API is healthy, proceed
  return true;
};

/**
 * Handle fetch errors (network errors, etc.)
 * @param {Error} error - The error object
 * @param {Function} setApiHealthy - State setter for API health status
 * @param {Function} showNotification - Function to display notifications (optional)
 * @returns {Object} - Object with error information
 */
export const handleFetchError = (error, setApiHealthy, showNotification = null) => {
  console.error('API request failed:', error);
  
  if (setApiHealthy) {
    setApiHealthy(false);
  }
  
  const message = 'Network error. Please check your connection.';
  if (showNotification) {
    showNotification(message, 'error');
  }
  
  return { 
    success: false, 
    message, 
    error 
  };
};