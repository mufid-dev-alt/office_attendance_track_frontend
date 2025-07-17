import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box, CircularProgress } from '@mui/material';
import { checkApiHealth } from '../../config/api';

/**
 * Component to display API connection status
 * Can be used throughout the application to show server connection status
 */
const ApiStatus = ({ onStatusChange = null, showSuccessMessage = false }) => {
  const [status, setStatus] = useState({
    checked: false,
    loading: true,
    healthy: true,
    message: null,
    database: null
  });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await checkApiHealth();
        const newStatus = {
          checked: true,
          loading: false,
          healthy: health.healthy,
          message: health.error,
          database: health.database
        };
        setStatus(newStatus);
        
        // Notify parent component if callback provided
        if (onStatusChange) {
          onStatusChange(newStatus);
        }
      } catch (e) {
        const newStatus = {
          checked: true,
          loading: false,
          healthy: false,
          message: e.message,
          database: null
        };
        setStatus(newStatus);
        
        if (onStatusChange) {
          onStatusChange(newStatus);
        }
      }
    };
    
    checkHealth();
  }, [onStatusChange]);

  if (status.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" sx={{ ml: 1 }}>
          Checking server connection...
        </Typography>
      </Box>
    );
  }

  if (!status.healthy) {
    return (
      <Paper 
        elevation={0}
        sx={{ 
          p: 1.5, 
          backgroundColor: (theme) => theme.palette.warning.light,
          color: (theme) => theme.palette.warning.contrastText,
          borderRadius: 1,
          border: (theme) => `1px solid ${theme.palette.warning.main}`
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          Server connection issues detected.
        </Typography>
        {status.message && (
          <Typography variant="caption" display="block">
            Details: {status.message}
          </Typography>
        )}
        {status.database && status.database.status === 'error' && (
          <Typography variant="caption" display="block">
            Database: {status.database.error}
          </Typography>
        )}
      </Paper>
    );
  }

  if (showSuccessMessage && status.healthy) {
    return (
      <Paper 
        elevation={0}
        sx={{ 
          p: 1.5, 
          backgroundColor: (theme) => theme.palette.success.light,
          color: (theme) => theme.palette.success.contrastText,
          borderRadius: 1,
          border: (theme) => `1px solid ${theme.palette.success.main}`
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          Server connection established successfully.
        </Typography>
      </Paper>
    );
  }

  // If healthy and not showing success message, return null
  return null;
};

export default ApiStatus;