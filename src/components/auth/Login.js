import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  Paper,
  useTheme,
  Link
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, checkApiHealth } from '../../config/api';

const Login = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('user'); // 'user' or 'admin'
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState({ checked: false, healthy: true, message: null });
  
  // Check API health when component mounts
  useEffect(() => {
    const checkHealth = async () => {
      setLoading(true);
      try {
        const health = await checkApiHealth();
        if (!health.healthy) {
          setApiStatus({ 
            checked: true, 
            healthy: false, 
            message: `API connection issue: ${health.error || 'Unknown error'}` 
          });
          if (health.database && health.database.status === 'error') {
            setError(`Database connection issue: ${health.database.error || 'Unknown database error'}`);
          } else {
            setError('Server connection issue. Please try again later.');
          }
        } else {
          setApiStatus({ checked: true, healthy: true, message: null });
        }
      } catch (e) {
        setApiStatus({ 
          checked: true, 
          healthy: false, 
          message: `Failed to check API health: ${e.message}` 
        });
        setError('Cannot connect to server. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    checkHealth();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill both fields');
      setLoading(false);
      return;
    }
    
    // Check if API is healthy before attempting login
    if (!apiStatus.healthy) {
      // Refresh API health status
      try {
        const health = await checkApiHealth();
        if (!health.healthy) {
          setError('Server is currently unavailable. Please try again later.');
          setLoading(false);
          return;
        }
        // Update API status if it's now healthy
        setApiStatus({ ...apiStatus, healthy: true, message: null });
      } catch (e) {
        setError('Cannot connect to server. Please try again later.');
        setLoading(false);
        return;
      }
    }

    try {
    // Use POST method instead of GET for better security
    const response = await fetch(API_ENDPOINTS.auth.login, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password
      }),
      mode: 'cors'
    });

    if (!response.ok) {
      const errorText = `Server error: ${response.status} ${response.statusText}`;
      console.error(errorText);
      setError('Server error. Please try again later.');
      setLoading(false);
      return;
    }

    try {
      const data = await response.json();

      if (data && data.success && data.user) {
        // Check if user role matches selected tab
        if (activeTab === 'admin' && data.user.role !== 'admin') {
          setError('Admin access required. Please use User login.');
          setLoading(false);
          return;
        }
        
        if (activeTab === 'user' && data.user.role === 'admin') {
          setError('Please use Admin login for administrative access.');
          setLoading(false);
          return;
        }

        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log(`Login successful for ${data.user.email} with role ${data.user.role}`);
        
        // Navigate based on role
        if (data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        // Handle specific error messages from the server
        const errorMessage = data.message || 'Invalid email or password';
        setError(errorMessage);
        console.error('Login failed:', errorMessage);
      }
    } catch (error) {
      console.error('Error parsing response:', error);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user types
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setFormData({ email: '', password: '' });
    setError('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2,
        position: 'relative',
        overflow: 'hidden'
      }}
    >


      <Card 
        sx={{ 
          maxWidth: 450, 
          width: '100%', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)', 
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            textAlign: 'center',
            py: 4
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              mb: 2, 
              opacity: 0.9,
              fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
              letterSpacing: '0.1em'
            }}
          >
            OFFICE ATTENDANCE MANAGEMENT SYSTEM
          </Typography>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            DCM Infotech
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
            Enter your {activeTab === 'admin' ? 'Admin' : 'User'} credentials
          </Typography>
        </Box>

        {/* Tab Navigation */}
        <Box sx={{ display: 'flex', backgroundColor: theme.palette.grey[100] }}>
          <Button
            fullWidth
            onClick={() => switchTab('user')}
            sx={{
              py: 2,
              borderRadius: 0,
              backgroundColor: activeTab === 'user' ? 'white' : 'transparent',
              color: activeTab === 'user' ? theme.palette.primary.main : theme.palette.text.secondary,
              fontWeight: activeTab === 'user' ? 600 : 400,
              boxShadow: activeTab === 'user' ? '0 -2px 4px rgba(0,0,0,0.1)' : 'none',
              '&:hover': {
                backgroundColor: activeTab === 'user' ? 'white' : theme.palette.grey[200]
              }
            }}
          >
            User Sign In
          </Button>
          <Button
            fullWidth
            onClick={() => switchTab('admin')}
            sx={{
              py: 2,
              borderRadius: 0,
              backgroundColor: activeTab === 'admin' ? 'white' : 'transparent',
              color: activeTab === 'admin' ? theme.palette.primary.main : theme.palette.text.secondary,
              fontWeight: activeTab === 'admin' ? 600 : 400,
              boxShadow: activeTab === 'admin' ? '0 -2px 4px rgba(0,0,0,0.1)' : 'none',
              '&:hover': {
                backgroundColor: activeTab === 'admin' ? 'white' : theme.palette.grey[200]
              }
            }}
          >
            Admin Sign In
          </Button>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {/* Status Messages */}
          <Box sx={{ mb: 3 }}>
            {error && (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2, 
                  backgroundColor: theme.palette.error.light,
                  color: theme.palette.error.contrastText,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.error.main}`
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {error}
                </Typography>
                {apiStatus.message && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Details: {apiStatus.message}
                  </Typography>
                )}
              </Paper>
            )}
            
            {!error && !apiStatus.healthy && (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2, 
                  backgroundColor: theme.palette.warning.light,
                  color: theme.palette.warning.contrastText,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.warning.main}`
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Server connection issues detected. Login may not work properly.
                </Typography>
                {apiStatus.message && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Details: {apiStatus.message}
                  </Typography>
                )}
              </Paper>
            )}
            
            {!error && apiStatus.checked && apiStatus.healthy && (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2, 
                  backgroundColor: theme.palette.success.light,
                  color: theme.palette.success.contrastText,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.success.main}`
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Server connection established successfully.
                </Typography>
              </Paper>
            )}
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              required
              margin="normal"
              name="email"
              type="email"
              label="Email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              required
              margin="normal"
              name="password"
              type="password"
              label="Password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />



            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ 
                mt: 2, 
                mb: 2, 
                py: 1.5,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                }
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>


        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;