import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  InputAdornment
} from '@mui/material';
import {
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  Edit as EditIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Search as SearchIcon,
  EventBusy as OffIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Header from '../common/Header';
import { API_ENDPOINTS } from '../../config/api';
import userService from '../../config/userService';
import eventService from '../../config/eventService';

const AttendanceRecords = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editDialog, setEditDialog] = useState({ open: false, date: null, status: 'present' });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [searchQuery, setSearchQuery] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const showNotification = useCallback((message, severity) => {
    setNotification({ open: true, message, severity });
  }, []);

  // Fetch users using the centralized user service
  const fetchUsers = useCallback(async () => {
    try {
      const usersList = await userService.getUsers();
      const nonAdminUsers = usersList.filter(user => user.role !== 'admin');
      setUsers(nonAdminUsers);
      setFilteredUsers(nonAdminUsers.filter(user => 
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } catch (error) {
      console.error('Error fetching users:', error);
      showNotification('Error fetching users', 'error');
    }
  }, [showNotification, searchQuery]);

  const fetchUserAttendance = useCallback(async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('user_id', selectedUser.id);
      params.append('month', selectedMonth);
      params.append('year', selectedYear);
      
      const response = await fetch(`${API_ENDPOINTS.attendance.list}?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data || []);
      }
    } catch (error) {
      showNotification('Error fetching attendance data', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedUser, selectedMonth, selectedYear, showNotification]);

  const updateAttendance = async (date, status) => {
    try {
      const response = await fetch(API_ENDPOINTS.attendance.create, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.id,
          status: status,
          date: date,
          notes: `Updated by admin on ${new Date().toLocaleString()}`
        })
      });

      if (response.ok) {
        showNotification(`Attendance marked as ${status} for ${date}`, 'success');
        
        // Notify other components about the attendance update using eventService
        eventService.attendanceUpdated(selectedUser.id, date, status);
        
        fetchUserAttendance();
        setEditDialog({ open: false, date: null, status: 'present' });
      } else {
        throw new Error('Failed to update attendance');
      }
    } catch (error) {
      showNotification('Error updating attendance', 'error');
    }
  };

  const exportUserAttendance = async () => {
    if (!selectedUser) return;
    
    setDownloading(true);
    try {
      const excelContent = convertToExcelFormat(attendanceData, selectedUser);
      const blob = new Blob([excelContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedUser.full_name.replace(/\s+/g, '_')}_${months[selectedMonth - 1]}_${selectedYear}_Attendance.csv`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showNotification('Attendance exported successfully', 'success');
    } catch (error) {
      showNotification('Error exporting attendance', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const convertToExcelFormat = (data, userDetails) => {
    let csv = `USERNAME - ${userDetails.full_name}\n`;
    csv += `USER-EMAIL - ${userDetails.email}\n`;
    csv += `DATE,DAY,ATTENDANCE\n`;
    
    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sortedData.forEach(record => {
      const date = new Date(record.date);
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
      const formattedDate = `${date.getDate()}-${months[date.getMonth()].substr(0, 3)}-${date.getFullYear().toString().substr(-2)}`;
      const status = record.status === 'present' ? 'PRESENT' : record.status === 'absent' ? 'ABSENT' : 'OFF';
      
      csv += `${formattedDate},${dayName},${status}\n`;
    });
    
    return csv;
  };

  const generateCalendarData = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1).getDay();
    const calendarData = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarData.push({ isEmpty: true });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(selectedYear, selectedMonth - 1, day).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const attendanceRecord = attendanceData.find(record => record.date === dateStr);
      
      calendarData.push({
        day,
        date: dateStr,
        status: attendanceRecord?.status || null,
        isWeekend,
        isToday: dateStr === new Date().toISOString().split('T')[0]
      });
    }

    return calendarData;
  };

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  // Initialize component and check auth
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [fetchUsers, navigate]);

  // Auto-refresh users every 30 seconds to catch updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUsers();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchUsers]);

  // Listen for user updates from user service
  useEffect(() => {
    const unsubscribe = userService.subscribe((eventType, data, updatedUsers) => {
      if (['user_added', 'user_deleted', 'user_restored', 'sync_complete', 'init_complete'].includes(eventType)) {
        const nonAdminUsers = updatedUsers.filter(user => user.role !== 'admin');
        setUsers(nonAdminUsers);
        setFilteredUsers(nonAdminUsers.filter(user => 
          user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
        ));
      }
    });
    
    return () => unsubscribe();
  }, [searchQuery]);

  // Only fetch users on component mount and via refresh button

  useEffect(() => {
    if (selectedUser) {
      fetchUserAttendance();
    }
  }, [fetchUserAttendance, selectedUser]);

  useEffect(() => {
    const filtered = users.filter(user => 
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchQuery]);

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleEditAttendance = (date) => {
    const record = attendanceData.find(r => r.date === date);
    setEditDialog({ 
      open: true, 
      date, 
      status: record?.status || 'present' 
    });
  };

  const handleStatusChange = (event) => {
    setEditDialog(prev => ({ ...prev, status: event.target.value }));
  };

  const handleSaveAttendance = () => {
    updateAttendance(editDialog.date, editDialog.status);
  };

  const calendarData = selectedUser ? generateCalendarData() : [];
  const presentDays = calendarData.filter(day => day.status === 'present').length;
  const absentDays = calendarData.filter(day => day.status === 'absent').length;
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <Header />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, backgroundColor: theme.palette.grey[50], minHeight: '100vh' }}>
        <Container maxWidth="xl">
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 4 }}>
            User Attendance Management
          </Typography>

          {!selectedUser ? (
            // User Selection Screen
            <Paper sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <PersonIcon sx={{ fontSize: 60, color: theme.palette.primary.main, mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  Select a User to Manage Attendance
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Choose a user from the list below to view and edit their attendance records
                </Typography>
              </Box>

              {/* Search Field */}
              <Box sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
                <TextField
                  fullWidth
                  placeholder="Search by name or email..."
                  variant="outlined"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Users List */}
              <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, textAlign: 'left' }}>
                  Users
                </Typography>
                <List>
                  {filteredUsers.length === 0 && (
                    <ListItem>
                      <ListItemText primary="No users found" />
                    </ListItem>
                  )}
                  {filteredUsers.map((user) => (
                    <ListItem 
                      key={user.id}
                      button 
                      onClick={() => setSelectedUser(user)}
                      sx={{ 
                        mb: 1, 
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: theme.palette.divider,
                        '&:hover': {
                          backgroundColor: theme.palette.primary.light,
                          color: 'white'
                        }
                      }}
                    >
                      <ListItemText 
                        primary={user.full_name} 
                        secondary={user.email}
                        primaryTypographyProps={{ fontWeight: 600 }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Paper>
          ) : (
            // User-Specific Attendance View
            <Box>
              {/* Selected User Header */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.main, width: 56, height: 56 }}>
                      {selectedUser.full_name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {selectedUser.full_name}
                      </Typography>
                      <Typography variant="body1" color="textSecondary">
                        {selectedUser.email}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={exportUserAttendance}
                      disabled={downloading}
                    >
                      {downloading ? 'Exporting...' : 'Export'}
                    </Button>
                    
                    <Button
                      variant="outlined"
                      onClick={() => setSelectedUser(null)}
                    >
                      Change User
                    </Button>
                  </Box>
                </Box>
              </Paper>

              {/* Month Navigation */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => navigateMonth('prev')}>
                      <ChevronLeftIcon />
                    </IconButton>
                    
                    <Typography variant="h6" sx={{ fontWeight: 600, minWidth: 200, textAlign: 'center' }}>
                      {months[selectedMonth - 1]} {selectedYear}
                    </Typography>
                    
                    <IconButton onClick={() => navigateMonth('next')}>
                      <ChevronRightIcon />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Chip
                      icon={<PresentIcon />}
                      label={`Present: ${presentDays}`}
                      color="success"
                      variant="outlined"
                    />
                    <Chip
                      icon={<AbsentIcon />}
                      label={`Absent: ${absentDays}`}
                      color="error"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </Paper>

              {/* Calendar View */}
              <Paper sx={{ p: 3 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box sx={{ maxWidth: { xs: '100%', sm: '500px', md: '600px' }, mx: 'auto' }}>
                    {/* Calendar Header */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: { xs: 0.3, sm: 0.5 }, mb: 1 }}>
                      {weekDays.map((day) => (
                        <Typography
                          key={day}
                          variant="body2"
                          sx={{
                            textAlign: 'center',
                            fontWeight: 600,
                            p: { xs: 0.5, sm: 0.8 },
                            bgcolor: theme.palette.grey[100],
                            borderRadius: 1,
                            fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' }
                          }}
                        >
                          {day}
                        </Typography>
                      ))}
                    </Box>

                    {/* Calendar Days */}
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(7, 1fr)', 
                      gap: { xs: 0.3, sm: 0.5 },
                      maxWidth: '100%'
                    }}>
                      {calendarData.map((dayData, index) => (
                        <Box key={index} sx={{ aspectRatio: '1/1', maxWidth: '100px' }}>
                          {dayData.isEmpty ? (
                            <Box sx={{ height: '100%' }} />
                          ) : (
                            <Card
                              sx={{
                                height: '100%',
                                minHeight: { xs: 40, sm: 45, md: 50 },
                                maxHeight: { xs: 45, sm: 50, md: 60 },
                                cursor: dayData.isWeekend ? 'default' : 'pointer',
                                bgcolor: dayData.isWeekend
                                  ? theme.palette.grey[100]
                                  : dayData.status === 'present'
                                  ? theme.palette.success.light
                                  : dayData.status === 'absent'
                                  ? theme.palette.error.light
                                  : theme.palette.background.paper,
                                border: dayData.isToday ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                                borderColor: dayData.isToday ? theme.palette.primary.main : theme.palette.divider,
                                '&:hover': !dayData.isWeekend ? {
                                  boxShadow: theme.shadows[2],
                                  transform: 'translateY(-1px)'
                                } : {},
                                display: 'flex',
                                flexDirection: 'column'
                              }}
                              onClick={() => {
                                if (!dayData.isWeekend) {
                                  handleEditAttendance(dayData.date);
                                }
                              }}
                            >
                              <CardContent sx={{ 
                                p: { xs: 0.3, sm: 0.5 }, 
                                textAlign: 'center', 
                                height: '100%', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                justifyContent: 'space-between',
                                '&:last-child': { pb: { xs: 0.3, sm: 0.5 } }
                              }}>
                                <Typography variant="body2" sx={{ 
                                  fontWeight: 600, 
                                  fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                                  lineHeight: 1
                                }}>
                                  {dayData.day}
                                </Typography>
                                
                                {dayData.isWeekend ? (
                                  <Typography variant="caption" color="textSecondary" sx={{ 
                                    fontSize: { xs: '0.5rem', sm: '0.55rem', md: '0.6rem' },
                                    lineHeight: 1
                                  }}>
                                    OFF
                                  </Typography>
                                ) : dayData.status ? (
                                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                    {dayData.status === 'present' ? (
                                      <PresentIcon sx={{ fontSize: { xs: 10, sm: 12, md: 14 }, color: theme.palette.success.main }} />
                                    ) : (
                                      <AbsentIcon sx={{ fontSize: { xs: 10, sm: 12, md: 14 }, color: theme.palette.error.main }} />
                                    )}
                                  </Box>
                                ) : (
                                  <Typography variant="caption" color="textSecondary" sx={{ 
                                    fontSize: { xs: '0.45rem', sm: '0.5rem', md: '0.55rem' },
                                    lineHeight: 1
                                  }}>
                                    Click
                                  </Typography>
                                )}
                              </CardContent>
                            </Card>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Paper>
            </Box>
          )}
        </Container>

        {/* Edit Attendance Dialog */}
        <Dialog open={editDialog.open} onClose={() => setEditDialog({ ...editDialog, open: false })}>
          <DialogTitle>Edit Attendance</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Date: {editDialog.date ? new Date(editDialog.date).toLocaleDateString() : ''}
            </Typography>
            <Select
              value={editDialog.status}
              onChange={handleStatusChange}
              fullWidth
            >
              <MenuItem value="present">Present</MenuItem>
              <MenuItem value="absent">Absent</MenuItem>
              <MenuItem value="off">Day Off</MenuItem>
            </Select>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog({ ...editDialog, open: false })}>Cancel</Button>
            <Button onClick={handleSaveAttendance} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>

        {/* Notification */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default AttendanceRecords; 