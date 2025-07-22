/**
 * Utility functions for handling API errors consistently across the application
 */

import { } from '../config/api';

/**
 * Handle API response errors
 * @param {Response} response - The fetch API response object
 * @param {Function} showNotification - Function to display notifications (optional)
 * @param {Function} handleAuthError - Function to handle authentication errors (optional)
 * @returns {Object} - Object with error information
 */
export const handleApiError = async (response, showNotification = null, handleAuthError = null) => {
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
    
    // Server errors
    if (response.status >= 500) {
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
 * Handle fetch errors (network errors, etc.)
 * @param {Error} error - The error object
 * @param {Function} showNotification - Function to display notifications (optional)
 * @returns {Object} - Object with error information
 */
export const handleFetchError = (error, showNotification = null) => {
  console.error('API request failed:', error);
  
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