import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Button,
  IconButton,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Snackbar,
  Alert
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/ExitToApp';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PersonIcon from '@mui/icons-material/Person';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate, Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';
import eventService from '../../config/eventService';

const AdminHeader = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const theme = useTheme();

  const handleLogout = async () => {
    try {
      // Simple local logout since we don't have sessions
      localStorage.removeItem('user');
      navigate('/');
    } catch (error) {
      // Continue with local logout even if server logout fails
      localStorage.removeItem('user');
      navigate('/');
    }
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
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            color: 'white'
          }}
        >
          Admin Dashboard
        </Typography>
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontFamily: "'Poppins', sans-serif",
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

const Sidebar = ({ open, onClose }) => {
  const theme = useTheme();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
    { text: 'Attendance Records', icon: <EventAvailableIcon />, path: '/admin/attendance-records' },
    { text: 'User Todos', icon: <FormatListBulletedIcon />, path: '/admin/user-todos' },
    { text: 'Manage Users', icon: <PersonIcon />, path: '/admin/manage-users' }
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
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
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
            borderRight: `1px solid ${theme.palette.divider}`
          },
        }}
        open
      >
        <Toolbar />
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
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const stored = localStorage.getItem('adminSelectedMonth');
    return stored ? parseInt(stored) : new Date().getMonth() + 1;
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    const stored = localStorage.getItem('adminSelectedYear');
    return stored ? parseInt(stored) : new Date().getFullYear();
  });
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const showNotification = useCallback((message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      console.log('Fetching users from:', API_ENDPOINTS.users.list);
      const response = await fetch(API_ENDPOINTS.users.list, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized, redirect to login
          localStorage.removeItem('user');
          navigate('/');
          return [];
        }
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Users data received:', data);
      
      // Filter out admin users if needed
      const usersList = Array.isArray(data) ? data.filter(user => user.role !== 'admin') : [];
      setUsers(usersList);
      return usersList;
    } catch (error) {
      console.error('Error fetching users:', error);
      showNotification(`Error fetching users: ${error.message}`, 'error');
      return [];
    }
  }, [navigate, showNotification]);

  const fetchUserStats = useCallback(async (usersList) => {
    setLoading(true);
    try {
      const usersToProcess = usersList || users;
      if (!usersToProcess.length) {
        setLoading(false);
        return;
      }

      const statsPromises = usersToProcess.map(async (user) => {
        const params = new URLSearchParams();
        params.append('user_id', user.id);
        params.append('month', selectedMonth);
        params.append('year', selectedYear);
        
        console.log('Fetching stats for user:', user.id, 'from:', `${API_ENDPOINTS.attendance.stats}?${params.toString()}`);
        
        try {
          const response = await fetch(`${API_ENDPOINTS.attendance.stats}?${params.toString()}`, {
            headers: { 'Accept': 'application/json' }
          });
          
          if (!response.ok) {
            if (response.status === 401) {
              // Handle auth error
              throw new Error('Authentication failed');
            }
            throw new Error(`Server responded with ${response.status}`);
          }
          
          const data = await response.json();
          console.log('Stats received for user:', user.id, data);
          return { userId: user.id, stats: data };
        } catch (error) {
          console.error(`Error fetching stats for user ${user.id}:`, error);
          return { userId: user.id, stats: { present_days: 0, absent_days: 0, total_days: 0 } };
        }
      });

      const results = await Promise.all(statsPromises);
      const statsMap = {};
      results.forEach(result => {
        statsMap[result.userId] = result.stats;
      });

      setUserStats(statsMap);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      showNotification(`Error fetching attendance data: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [users, selectedMonth, selectedYear, showNotification]);

  const exportUserData = async (userId, userName) => {
    try {
      const params = new URLSearchParams();
      params.append('user_id', userId);
      params.append('month', selectedMonth);
      params.append('year', selectedYear);
      
      console.log('Exporting attendance for user:', userId, 'from:', `${API_ENDPOINTS.attendance.list}?${params.toString()}`);
      
      const response = await fetch(`${API_ENDPOINTS.attendance.list}?${params.toString()}`, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError();
          return;
        }
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      const records = Array.isArray(data) ? data : [];
      
      if (records.length === 0) {
        showNotification(`No attendance data found for ${userName}`, 'warning');
        return;
      }

      // Find the user object
      const user = users.find(u => u.id === userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Convert to Excel-like CSV format
      const excelContent = convertToExcelFormat(records, user);
      const blob = new Blob([excelContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const monthName = months[selectedMonth - 1];
      a.download = `${user.full_name.replace(/\s+/g, '_')}_${monthName}_${selectedYear}_Attendance.csv`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showNotification(`Attendance data for ${userName} downloaded successfully`, 'success');
    } catch (error) {
      console.error('Error exporting user data:', error);
      showNotification(`Error exporting data: ${error.message}`, 'error');
    }
  };

  const handleAuthError = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const convertToExcelFormat = (data, userData) => {
    // Create header rows matching the My Attendance format
    let csv = `USERNAME - ${userData.full_name}\n`;
    csv += `USER-EMAIL - ${userData.email}\n`;
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

  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const getAttendanceRate = (userId) => {
    const stats = userStats[userId];
    if (!stats) return 0;
    
    const totalDays = stats.total_days || (stats.present_days + stats.absent_days);
    if (totalDays === 0) return 0;
    
    return Math.round((stats.present_days / totalDays) * 100);
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'admin') {
      navigate('/');
      return;
    }

    const loadData = async () => {
      const usersList = await fetchUsers();
      await fetchUserStats(usersList);
    };

    loadData();
    
    // Listen for user updates from other components
    const unsubscribe = eventService.listen((eventType, data) => {
      if (['user_added', 'user_deleted', 'user_updated'].includes(eventType)) {
        console.log(`${eventType} event detected, refreshing users`);
        loadData();
      } else if (eventType === 'attendance_updated') {
        console.log('Attendance update detected, refreshing stats');
        fetchUserStats();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [navigate, selectedMonth, selectedYear]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const usersList = await fetchUsers();
      await fetchUserStats(usersList);
      showNotification('Data refreshed successfully', 'success');
    } catch (error) {
      console.error('Error refreshing data:', error);
      showNotification('Error refreshing data', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AdminHeader onMenuClick={handleDrawerToggle} />
      <Sidebar open={mobileOpen} onClose={handleDrawerToggle} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          width: { sm: `calc(100% - 240px)` },
          ml: { sm: '240px' },
          backgroundColor: theme.palette.grey[50]
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                color: theme.palette.text.primary
              }}
            >
              Employee Attendance Overview
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Month</InputLabel>
                <Select
                  value={selectedMonth}
                  label="Month"
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    localStorage.setItem('adminSelectedMonth', e.target.value);
                  }}
                >
                  {months.map((month, index) => (
                    <MenuItem key={index + 1} value={index + 1}>
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
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    localStorage.setItem('adminSelectedYear', e.target.value);
                  }}
                >
                  {[2024, 2025, 2026].map(year => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={loading}
                sx={{ height: 40 }}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : users.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6">No employees found</Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {users.map(user => {
                const stats = userStats[user.id] || { present_days: 0, absent_days: 0, total_days: 0 };
                const totalDays = stats.total_days || (stats.present_days + stats.absent_days);
                const attendanceRate = getAttendanceRate(user.id);
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={user.id}>
                    <Card sx={{ 
                      height: '100%',
                      boxShadow: theme.shadows[2],
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[4]
                      }
                    }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: theme.palette.primary.main,
                              width: 50,
                              height: 50,
                              fontSize: '1.2rem',
                              fontWeight: 600
                            }}
                          >
                            {getUserInitials(user.full_name)}
                          </Avatar>
                          <Box sx={{ ml: 2 }}>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontFamily: "'Poppins', sans-serif",
                                fontWeight: 600,
                                lineHeight: 1.2
                              }}
                            >
                              {user.full_name}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                fontFamily: "'Poppins', sans-serif",
                              }}
                            >
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Present</Typography>
                            <Typography variant="h6" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                              {stats.present_days || 0}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Absent</Typography>
                            <Typography variant="h6" sx={{ color: theme.palette.error.main, fontWeight: 600 }}>
                              {stats.absent_days || 0}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Total Days</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {totalDays || 0}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Attendance</Typography>
                            <Typography variant="h6" sx={{ 
                              fontWeight: 600,
                              color: attendanceRate >= 75 ? theme.palette.success.main : 
                                     attendanceRate >= 50 ? theme.palette.warning.main : 
                                     theme.palette.error.main
                            }}>
                              {attendanceRate}%
                            </Typography>
                          </Grid>
                        </Grid>
                        
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<DownloadIcon />}
                          onClick={() => exportUserData(user.id, user.full_name)}
                          sx={{ 
                            mt: 3,
                            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #1a3366 0%, #234785 100%)',
                            }
                          }}
                        >
                          Export Excel
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Container>
      </Box>

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
  );
};

export default AdminDashboard;