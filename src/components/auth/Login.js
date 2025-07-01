import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    isAdmin: false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const loginUrl = `${API_ENDPOINTS.auth.login}?email=${formData.email}&password=${formData.password}`;
    
    const response = await fetch(loginUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors'
    });

    const data = await response.json();

    if (data && data.success && data.user) {
      // Check admin access
      if (formData.isAdmin && data.user.role !== 'admin') {
        setLoading(false);
        return;
      }

      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Navigate based on role
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
    
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'isAdmin' ? checked : value
    }));
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
      {/* Background Title */}
      <Typography
        variant="h2"
        sx={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255, 255, 255, 0.1)',
          fontWeight: 900,
          fontSize: { xs: '2rem', sm: '3rem', md: '4rem' },
          textAlign: 'center',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          zIndex: 0
        }}
      >
        OFFICE ATTENDANCE MANAGEMENT SYSTEM
      </Typography>

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
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            textAlign: 'center',
            py: 4
          }}
        >
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            DCM Infotech
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
            Enter your {formData.isAdmin ? 'Admin' : 'User'} credentials
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            {/* User/Admin Switch */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    name="isAdmin"
                    checked={formData.isAdmin}
                    onChange={handleChange}
                    color="primary"
                  />
                }
                label={
                  <Typography sx={{ fontWeight: 500 }}>
                    {formData.isAdmin ? 'Admin' : 'User'}
                  </Typography>
                }
                labelPlacement="end"
              />
            </Box>

            <TextField
              fullWidth
              required
              margin="normal"
              name="email"
              type="email"
              label="Email Address"
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