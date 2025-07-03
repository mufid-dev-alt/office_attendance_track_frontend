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
  Divider
} from '@mui/material';
import {
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Header from '../common/Header';
import { API_ENDPOINTS } from '../../config/api';

const AttendanceRecords = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
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
  const [filteredUsers, setFilteredUsers] = useState([]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const showNotification = useCallback((message, severity) => {
    setNotification({ open: true, message, severity });
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.users.list);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.filter(user => user.role !== 'admin'));
        setFilteredUsers(data.filter(user => user.role !== 'admin'));
      }
    } catch (error) {
      showNotification('Error fetching users', 'error');
    }
  }, [showNotification]);

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

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [fetchUsers, navigate]);

  useEffect(() => {
    if (selectedUser) {
      fetchUserAttendance();
    }
  }, [fetchUserAttendance]);

  useEffect(() => {
    const filtered = users.filter(user => 
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchQuery]);

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
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      fontSize: '1.1rem'
                    }
                  }}
                />
              </Box>

              {/* Users List */}
              <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, textAlign: 'left' }}>
                  Users
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {filteredUsers.map((user) => (
                    <Box
                      key={user.id}
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: theme.palette.divider,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        bgcolor: theme.palette.background.paper,
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          bgcolor: theme.palette.primary.light + '08',
                          transform: 'translateX(4px)'
                        }
                      }}
                      onClick={() => setSelectedUser(user)}
                    >
                      <Avatar 
                        sx={{ 
                          mr: 2, 
                          bgcolor: theme.palette.primary.main, 
                          width: 40, 
                          height: 40,
                          fontSize: '1rem',
                          fontWeight: 600
                        }}
                      >
                        {user.full_name.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {user.full_name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          wordBreak: 'break-word'
                        }}>
                          {user.email}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
                
                {filteredUsers.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      No users found matching your search
                    </Typography>
                  </Box>
                )}
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
                      <ArrowBackIcon />
                    </IconButton>
                    
                    <Typography variant="h6" sx={{ fontWeight: 600, minWidth: 200, textAlign: 'center' }}>
                      {months[selectedMonth - 1]} {selectedYear}
                    </Typography>
                    
                    <IconButton onClick={() => navigateMonth('next')}>
                      <ArrowForwardIcon />
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
                  <Box>
                    {/* Calendar Header */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 2 }}>
                      {weekDays.map((day) => (
                        <Typography
                          key={day}
                          variant="body2"
                          sx={{
                            textAlign: 'center',
                            fontWeight: 600,
                            p: 1,
                            bgcolor: theme.palette.grey[100],
                            borderRadius: 1
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
                      gap: { xs: 0.5, sm: 1 },
                      maxWidth: '100%'
                    }}>
                      {calendarData.map((dayData, index) => (
                        <Box key={index} sx={{ aspectRatio: '1/1' }}>
                          {dayData.isEmpty ? (
                            <Box sx={{ height: '100%' }} />
                          ) : (
                            <Card
                              sx={{
                                height: '100%',
                                minHeight: { xs: 50, sm: 60, md: 70 },
                                maxHeight: { xs: 60, sm: 70, md: 80 },
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
                                  setEditDialog({
                                    open: true,
                                    date: dayData.date,
                                    status: dayData.status || 'present'
                                  });
                                }
                              }}
                            >
                              <CardContent sx={{ 
                                p: { xs: 0.5, sm: 1 }, 
                                textAlign: 'center', 
                                height: '100%', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                justifyContent: 'space-between',
                                '&:last-child': { pb: { xs: 0.5, sm: 1 } }
                              }}>
                                <Typography variant="body2" sx={{ 
                                  fontWeight: 600, 
                                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                                  lineHeight: 1
                                }}>
                                  {dayData.day}
                                </Typography>
                                
                                {dayData.isWeekend ? (
                                  <Typography variant="caption" color="textSecondary" sx={{ 
                                    fontSize: { xs: '0.55rem', sm: '0.65rem', md: '0.75rem' },
                                    lineHeight: 1
                                  }}>
                                    OFF
                                  </Typography>
                                ) : dayData.status ? (
                                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                    {dayData.status === 'present' ? (
                                      <PresentIcon sx={{ fontSize: { xs: 12, sm: 14, md: 16 }, color: theme.palette.success.main }} />
                                    ) : (
                                      <AbsentIcon sx={{ fontSize: { xs: 12, sm: 14, md: 16 }, color: theme.palette.error.main }} />
                                    )}
                                  </Box>
                                ) : (
                                  <Typography variant="caption" color="textSecondary" sx={{ 
                                    fontSize: { xs: '0.5rem', sm: '0.6rem', md: '0.7rem' },
                                    lineHeight: 1
                                  }}>
                                    Click to mark
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
        <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, date: null, status: 'present' })}>
          <DialogTitle>
            Mark Attendance for {editDialog.date ? new Date(editDialog.date).toLocaleDateString() : ''}
          </DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Attendance Status</InputLabel>
              <Select
                value={editDialog.status}
                label="Attendance Status"
                onChange={(e) => setEditDialog({ ...editDialog, status: e.target.value })}
              >
                <MenuItem value="present">Present</MenuItem>
                <MenuItem value="absent">Absent</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog({ open: false, date: null, status: 'present' })}>
              Cancel
            </Button>
            <Button
              onClick={() => updateAttendance(editDialog.date, editDialog.status)}
              variant="contained"
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification({ ...notification, open: false })}
        >
          <Alert severity={notification.severity} onClose={() => setNotification({ ...notification, open: false })}>
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default AttendanceRecords; 