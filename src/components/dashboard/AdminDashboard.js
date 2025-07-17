import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Drawer,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  EventNote as EventNoteIcon,
  ListAlt as ListAltIcon,
  People as PeopleIcon,
  ExitToApp as LogoutIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../common/Header';
import { API_ENDPOINTS, checkApiHealth } from '../../config/api';
import ApiStatus from '../common/ApiStatus';
import userService from '../../config/userService';
import eventService from '../../config/eventService';

// Admin Header Component
const AdminHeader = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const theme = useTheme();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: theme.zIndex.drawer + 1,
        borderRadius: 0,
        boxShadow: 'none',
        borderBottom: '1px solid',
        borderColor: 'divider',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <Toolbar sx={{ minHeight: '64px !important' }}>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 600,
            color: 'white'
          }}
        >
          Office Attendance Management - Admin
        </Typography>
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography 
              variant="subtitle1" 
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
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

// Sidebar Component
const Sidebar = ({ open, onClose }) => {
  const theme = useTheme();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
    { text: 'Attendance Records', icon: <EventNoteIcon />, path: '/admin/attendance-records' },
    { text: 'User Todos', icon: <ListAltIcon />, path: '/admin/user-todos' },
    { text: 'Manage Users', icon: <PeopleIcon />, path: '/admin/manage-users' }
  ];

  const drawerWidth = 240;

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            top: 64
          },
        }}
      >
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                component={Link}
                to={item.path}
                onClick={onClose}
                sx={{
                  mb: 1,
                  mx: 1,
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.light,
                    '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                      color: theme.palette.primary.main
                    }
                  }
                }}
              >
                <ListItemIcon sx={{ color: theme.palette.text.secondary }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    '& .MuiTypography-root': { 
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 500
                    } 
                  }} 
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            backgroundColor: theme.palette.background.default,
            borderRight: `1px solid ${theme.palette.divider}`,
            top: 64
          },
        }}
        open
      >
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                component={Link}
                to={item.path}
                sx={{
                  mb: 1,
                  mx: 1,
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.light,
                    '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                      color: theme.palette.primary.main
                    }
                  }
                }}
              >
                <ListItemIcon sx={{ color: theme.palette.text.secondary }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    '& .MuiTypography-root': { 
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 500
                    } 
                  }} 
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

const AdminDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(0); // All Time to show all data
  const [selectedYear, setSelectedYear] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exportingUser, setExportingUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [apiHealthy, setApiHealthy] = useState(true);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Handle API status changes
  const handleApiStatusChange = (status) => {
    setApiHealthy(status.healthy);
    if (!status.healthy) {
      showNotification('Server connection issues detected', 'warning');
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const showNotification = useCallback((message, severity) => {
    setNotification({ open: true, message, severity });
  }, []);

  const handleAuthError = useCallback(() => {
    localStorage.removeItem('user');
    navigate('/');
  }, [navigate]);

  const fetchUsers = useCallback(async () => {
    // Check API health before fetching users
    if (!apiHealthy) {
      try {
        const health = await checkApiHealth();
        if (!health.healthy) {
          console.error('API is not healthy, cannot fetch users:', health.error);
          showNotification('Server connection issues. Please try again later.', 'error');
          return;
        }
        // Update API status if it's now healthy
        setApiHealthy(true);
      } catch (e) {
        console.error('Failed to check API health:', e);
        showNotification('Cannot connect to server', 'error');
        return;
      }
    }
    
    try {
      const response = await fetch(API_ENDPOINTS.users.list, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleAuthError();
          return;
        }
        if (response.status >= 500) {
          // Server error might indicate API health issues
          setApiHealthy(false);
          showNotification('Server error. Please try again later.', 'error');
          return;
        }
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setApiHealthy(false);
      showNotification(error.message, 'error');
    }
  }, [showNotification, handleAuthError]);

  const fetchUserStats = useCallback(async () => {
    setLoading(true);
    try {
      // Check API health before fetching stats
      if (!apiHealthy) {
        try {
          const health = await checkApiHealth();
          if (!health.healthy) {
            console.error('API is not healthy, cannot fetch user stats:', health.error);
            showNotification('Server connection issues. Please try again later.', 'error');
            return;
          }
          // Update API status if it's now healthy
          setApiHealthy(true);
        } catch (e) {
          console.error('Failed to check API health:', e);
          showNotification('Cannot connect to server', 'error');
          return;
        }
      }
      
      // Get all users first
      const usersResponse = await fetch(API_ENDPOINTS.users.list);
      if (!usersResponse.ok) {
        if (usersResponse.status === 401 || usersResponse.status === 403) {
          handleAuthError();
          return;
        }
        if (usersResponse.status >= 500) {
          // Server error might indicate API health issues
          setApiHealthy(false);
          showNotification('Server error. Please try again later.', 'error');
          return;
        }
        throw new Error('Failed to fetch users');
      }
      const users = await usersResponse.json();
      
      // Get stats for each user
      const statsPromises = users.map(async (user) => {
        const params = new URLSearchParams();
        params.append('user_id', user.id);
        if (selectedMonth > 0) params.append('month', selectedMonth);
        if (selectedYear > 0) params.append('year', selectedYear);
        
        const response = await fetch(`${API_ENDPOINTS.attendance.stats}?${params.toString()}`);
        if (response.ok) {
          const stats = await response.json();
          return { userId: user.id, ...stats };
        }
        return { userId: user.id, total_days: 0, present_days: 0, absent_days: 0, attendance_rate: 0 };
      });
      
      const allStats = await Promise.all(statsPromises);
      const statsObj = {};
      allStats.forEach(stat => {
        statsObj[stat.userId] = stat;
      });
      
      setUserStats(statsObj);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setApiHealthy(false);
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, showNotification, handleAuthError]);

  const exportUserData = async (userId, userName) => {
    setExportingUser(userId);
    
    // Check API health before exporting
    if (!apiHealthy) {
      try {
        const health = await checkApiHealth();
        if (!health.healthy) {
          showNotification('Server connection issues. Please try again later.', 'error');
          setExportingUser(null);
          return;
        }
        // Update API status if it's now healthy
        setApiHealthy(true);
      } catch (e) {
        showNotification('Cannot connect to server. Please try again later.', 'error');
        setExportingUser(null);
        return;
      }
    }
    
    try {
      const params = new URLSearchParams();
      params.append('user_id', userId);
      if (selectedMonth > 0) params.append('month', selectedMonth);
      if (selectedYear > 0) params.append('year', selectedYear);
      
      const response = await fetch(`${API_ENDPOINTS.attendance.list}?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        if (!data || data.length === 0) {
          showNotification('No attendance data found for the selected period', 'warning');
          return;
        }
        
        // Get user details for proper Excel format
        const userDetails = users.find(u => u.id === userId);
        const excelContent = convertToExcelFormat(data, userDetails);
        const blob = new Blob([excelContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Generate filename based on filter
        const timeRange = selectedMonth === 0 || selectedYear === 0 ? 'AllTime' : `${months[selectedMonth - 1]}_${selectedYear}`;
        a.download = `${userName.replace(/\s+/g, '_')}_${timeRange}_Attendance.csv`;
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showNotification(`${userName}'s attendance data exported successfully (${data.length} records)`, 'success');
      } else {
        if (response.status === 401 || response.status === 403) {
          handleAuthError();
          return;
        }
        if (response.status >= 500) {
          // Server error might indicate API health issues
          setApiHealthy(false);
          showNotification('Server error. Please try again later.', 'error');
        } else {
          throw new Error(`Export failed: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Error exporting attendance data:', error);
      setApiHealthy(false);
      showNotification(error.message, 'error');
    } finally {
      setExportingUser(null);
    }
  };

  const convertToExcelFormat = (data, userDetails) => {
    // Create header rows matching the My Attendance format
    let csv = `USERNAME - ${userDetails?.full_name || 'Unknown User'}\n`;
    csv += `USER-EMAIL - ${userDetails?.email || 'Unknown Email'}\n`;
    csv += `DATE,DAY,ATTENDANCE\n`;
    
    // Sort data by date
    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Add data rows
    sortedData.forEach(record => {
      const date = new Date(record.date);
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
      const formattedDate = `${date.getDate()}-${months[date.getMonth()].substr(0, 3)}-${date.getFullYear().toString().substr(-2)}`;
      const status = record.status === 'present' ? 'PRESENT' : record.status === 'absent' ? 'ABSENT' : 'OFF';
      
      csv += `${formattedDate},${dayName},${status}\n`;
    });
    
    return csv;
  };

  const convertToCSV = (data) => {
    // This function is kept for backward compatibility but not used
    if (!data || data.length === 0) {
      return 'No data available';
    }
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Properly escape values that contain commas, quotes, or newlines
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getAttendanceRate = (present, total) => {
    if (total === 0) return 0;
    return Math.round((present / total) * 100);
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [fetchUsers, navigate]);

  useEffect(() => {
    if (users.length > 0) {
      fetchUserStats();
    }
  }, [users, fetchUserStats]);

  const refreshData = () => {
    fetchUsers();
    fetchUserStats();
  };

  // No auto-refresh or event-based refresh

  return (
    <Box sx={{ display: 'flex' }}>
      <AdminHeader onMenuClick={handleDrawerToggle} />
      <Sidebar open={mobileOpen} onClose={handleDrawerToggle} />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, md: 3 }, 
          mt: 8, 
          width: { sm: `calc(100% - 240px)` },
          ml: { sm: '240px' },
          backgroundColor: theme.palette.grey[50], 
          minHeight: '100vh'
        }}
      >
        {/* API Status Component */}
        <Box sx={{ mb: 2 }}>
          <ApiStatus onStatusChange={handleApiStatusChange} showSuccessMessage={false} />
        </Box>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 600,
                color: theme.palette.text.primary
              }}
            >
              Admin Dashboard
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Month</InputLabel>
                <Select
                  value={selectedMonth}
                  label="Month"
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <MenuItem value={0}>All Time</MenuItem>
                  {months.map((month, index) => (
                    <MenuItem key={index} value={index + 1}>
                      {month}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Year</InputLabel>
                <Select
                  value={selectedYear}
                  label="Year"
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <MenuItem value={0}>All Time</MenuItem>
                  {[2024, 2025, 2026].map(year => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Tooltip title="Refresh Data">
                <IconButton onClick={refreshData} color="primary">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* User Cards Section */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Employee Attendance - {selectedMonth === 0 || selectedYear === 0 ? 'All Time' : `${months[selectedMonth - 1]} ${selectedYear}`}
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3}>
                {users.filter(user => user.role !== 'admin').map((user) => {
                  const stats = userStats[user.id] || { present_days: 0, absent_days: 0, total_days: 0 };
                  const attendanceRate = getAttendanceRate(stats.present_days, stats.total_days);
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar 
                              sx={{ 
                                bgcolor: theme.palette.primary.main, 
                                mr: 2,
                                width: 50,
                                height: 50
                              }}
                            >
                              {getInitials(user.full_name)}
                            </Avatar>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {user.full_name}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {user.email}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Divider sx={{ my: 2 }} />
                          
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="textSecondary">
                                Present Days
                              </Typography>
                              <Chip 
                                label={stats.present_days} 
                                color="success" 
                                size="small"
                              />
                            </Box>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="textSecondary">
                                Absent Days
                              </Typography>
                              <Chip 
                                label={stats.absent_days} 
                                color="error" 
                                size="small"
                              />
                            </Box>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="textSecondary">
                                Total Days
                              </Typography>
                              <Chip 
                                label={stats.total_days} 
                                color="default" 
                                size="small"
                              />
                            </Box>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="textSecondary">
                                Attendance Rate
                              </Typography>
                              <Chip 
                                label={`${attendanceRate}%`} 
                                color={attendanceRate >= 80 ? 'success' : attendanceRate >= 60 ? 'warning' : 'error'} 
                                size="small"
                              />
                            </Box>
                          </Box>
                        </CardContent>
                        
                        <CardActions sx={{ p: 2, pt: 0 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={() => exportUserData(user.id, user.full_name)}
                            disabled={exportingUser === user.id}
                            size="small"
                          >
                            {exportingUser === user.id ? 'Exporting...' : 'Export Excel'}
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Paper>
        </Container>

        <Snackbar 
          open={notification.open} 
          autoHideDuration={6000} 
          onClose={() => setNotification({ ...notification, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setNotification({ ...notification, open: false })} 
            severity={notification.severity} 
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default AdminDashboard;