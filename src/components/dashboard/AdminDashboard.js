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
  Divider
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Header from '../common/Header';
import { API_ENDPOINTS } from '../../config/api';

const AdminDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(0); // All Time to show all data
  const [selectedYear, setSelectedYear] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exportingUser, setExportingUser] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

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
    try {
      const response = await fetch(API_ENDPOINTS.users.list, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleAuthError();
          return;
        }
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data || []);
    } catch (error) {
      showNotification(error.message, 'error');
    }
  }, [showNotification, handleAuthError]);

  const fetchUserStats = useCallback(async () => {
    setLoading(true);
    try {
      // Get all users first
      const usersResponse = await fetch(API_ENDPOINTS.users.list);
      if (!usersResponse.ok) throw new Error('Failed to fetch users');
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
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, showNotification, handleAuthError]);

  const exportUserData = async (userId, userName) => {
    setExportingUser(userId);
    
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
        
        const csvContent = convertToCSV(data);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Generate filename based on filter
        const timeRange = selectedMonth === 0 || selectedYear === 0 ? 'AllTime' : `${months[selectedMonth - 1]}_${selectedYear}`;
        a.download = `${userName}_attendance_${timeRange}.csv`;
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showNotification(`${userName}'s attendance data exported successfully (${data.length} records)`, 'success');
      } else {
        throw new Error(`Export failed: ${response.status}`);
      }
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setExportingUser(null);
    }
  };

  const convertToCSV = (data) => {
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

  return (
    <>
      <Header />
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, mt: 8, backgroundColor: theme.palette.grey[50], minHeight: '100vh' }}>
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
    </>
  );
};

export default AdminDashboard; 