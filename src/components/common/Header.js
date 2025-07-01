import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    // Simple local logout - no server call needed since we don't use sessions
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        borderRadius: 0,
        boxShadow: 'none',
        borderBottom: '1px solid',
        borderColor: 'divider',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <Toolbar sx={{ minHeight: '64px !important' }}>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 600,
            color: 'white'
          }}
        >
          Office Attendance Management
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {user && (
            <>
              <Typography 
                variant="subtitle1" 
                component="span" 
                sx={{ 
                  color: 'white',
                  fontWeight: 500,
                  display: { xs: 'none', sm: 'inline' }
                }}
              >
                Welcome, {user.full_name}
              </Typography>
              <Button 
                color="inherit" 
                onClick={handleLogout}
                sx={{
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 0,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.5)'
                  }
                }}
              >
                Logout
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 