import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { ExitToApp as LogoutIcon } from '@mui/icons-material';
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
                startIcon={<LogoutIcon />}
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  color: 'white',
                  borderRadius: '24px',
                  px: 3,
                  py: 1,
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
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