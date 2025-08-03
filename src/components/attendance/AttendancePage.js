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
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  useTheme,
  IconButton
} from '@mui/material';
import {
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  CalendarToday as CalendarIcon,
  Download as DownloadIcon,
  Undo as UndoIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Header from '../common/Header';
import { API_ENDPOINTS } from '../../config/api';
import eventService from '../../config/eventService';

const AttendancePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [todayMarked, setTodayMarked] = useState(false);
  const [todayAttendanceId, setTodayAttendanceId] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Check if today is weekend
  const isWeekend = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
  };

  // Force sync attendance data with the backend
  const forceSync = async () => {
    try {
      setMessage('Syncing attendance data...');
      const response = await fetch(API_ENDPOINTS.attendance.sync, {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const result = await response.json();
        setMessage(`Attendance data synced successfully (${result.record_count} records)`);
        // Refresh attendance data
        await fetchAttendance();
      } else {
        throw new Error('Failed to sync attendance data');
      }
    } catch (error) {
      setMessage('Error syncing attendance data');
      console.error('Error:', error);
    }
  };

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData) {
        navigate('/');
        return;
      }

      const response = await fetch(`${API_ENDPOINTS.attendance.list}?user_id=${userData.id}`, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/');
          return;
        }
        throw new Error('Failed to fetch attendance data');
      }

      const data = await response.json();
      setAttendanceData(Array.isArray(data.records) ? data.records : []);
      
      // Check if today's attendance is already marked
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = (Array.isArray(data.records) ? data.records : []).find(record => record.date === today);
      setTodayMarked(!!todayRecord);
      setTodayAttendanceId(todayRecord?.id || null);
    } catch (error) {
      setMessage('Error fetching attendance data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const markAttendance = async (status) => {
    // Check if it's weekend
    if (isWeekend()) {
      setMessage('You cannot mark attendance on Saturday and Sunday');
      return;
    }

    setMarkingAttendance(true);
    setMessage('');

    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(API_ENDPOINTS.attendance.create, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          user_id: userData.id,
          status: status,
          date: today,
          notes: `Marked via app on ${new Date().toLocaleString()}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to mark attendance');
      }

      const data = await response.json();
      setMessage(`Attendance marked as ${status} successfully!`);
      setTodayMarked(true);
      setTodayAttendanceId(data.id); // Set the ID for undo functionality
      // Refresh attendance data
      await fetchAttendance();
    } catch (error) {
      setMessage('Error marking attendance');
      console.error('Error:', error);
    } finally {
      setMarkingAttendance(false);
    }
  };

  const undoTodayAttendance = async () => {
    if (!todayAttendanceId) return;
    
    setMarkingAttendance(true);
    setMessage('');

    try {
      const response = await fetch(API_ENDPOINTS.attendance.delete(todayAttendanceId), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to undo attendance');
      }

      setMessage('Today\'s attendance has been undone');
      setTodayMarked(false);
      setTodayAttendanceId(null);
      
      // Force sync with backend to ensure data is persisted
      await forceSync();
      
      // Refresh attendance data
      await fetchAttendance();
    } catch (error) {
      setMessage('Error undoing attendance');
      console.error('Error:', error);
    } finally {
      setMarkingAttendance(false);
    }
  };

  const downloadMyAttendance = async () => {
    setDownloading(true);
    
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      
      const params = new URLSearchParams();
      params.append('user_id', userData.id);
      params.append('month', selectedMonth);
      params.append('year', selectedYear);
      
      const response = await fetch(`${API_ENDPOINTS.attendance.list}?${params.toString()}`, {
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        const records = Array.isArray(data.records) ? data.records : [];
        if (records.length === 0) {
          setMessage('No attendance data found for the selected period');
          setDownloading(false);
          return;
        }
        
        // Convert to Excel-like CSV format
        const excelContent = convertToExcelFormat(records, userData);
        const blob = new Blob([excelContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const monthName = months[selectedMonth - 1];
        a.download = `${userData.full_name.replace(/\s+/g, '_')}_${monthName}_${selectedYear}_Attendance.csv`;
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setMessage('Attendance data downloaded successfully');
      } else {
        throw new Error(`Download failed: ${response.status}`);
      }
    } catch (error) {
      setMessage('Error downloading attendance data');
    } finally {
      setDownloading(false);
    }
  };

  const convertToExcelFormat = (data, userData) => {
    // Create header rows
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

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) {
      navigate('/');
      return;
    }
    fetchAttendance();
  }, [fetchAttendance, navigate]);
  
  // No event-based refresh - user will manually sync when needed
  
  // No auto-refresh - user will manually sync when needed

  // Generate calendar data for the selected month
  const generateCalendarData = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1).getDay();
    const calendarData = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarData.push({ isEmpty: true });
    }

    // Add actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(selectedYear, selectedMonth - 1, day).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
      const attendanceRecord = (Array.isArray(attendanceData) ? attendanceData : []).find(record => record.date === dateStr);
      
      calendarData.push({
        day,
        date: dateStr,
        status: attendanceRecord?.status || null,
        notes: attendanceRecord?.notes || null,
        isWeekend
      });
    }

    return calendarData;
  };

  const calendarData = generateCalendarData();
  const presentDays = calendarData.filter(day => day.status === 'present').length;
  const absentDays = calendarData.filter(day => day.status === 'absent').length;
  const totalMarkedDays = presentDays + absentDays;

  const getStatusColor = (status, isWeekend) => {
    if (isWeekend) {
      return theme.palette.grey[200]; // Light gray for weekends
    }
    switch (status) {
      case 'present': return theme.palette.success.main;
      case 'absent': return theme.palette.error.main;
      default: return theme.palette.background.paper; // White for unmarked weekdays
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <PresentIcon sx={{ fontSize: 16, color: 'white' }} />;
      case 'absent': return <AbsentIcon sx={{ fontSize: 16, color: 'white' }} />;
      default: return null;
  }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <Header />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, backgroundColor: theme.palette.grey[50], minHeight: '100vh' }}>
      <Container maxWidth="lg">
          {/* Header Section */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
              My Attendance
        </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={downloadMyAttendance}
                disabled={downloading}
                sx={{ mr: 2 }}
              >
                {downloading ? 'Downloading...' : 'Download Attendance'}
              </Button>
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Month</InputLabel>
                <Select
                  value={selectedMonth}
                  label="Month"
                  onChange={(e) => setSelectedMonth(e.target.value)}
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
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
              </Box>

          {/* Today's Attendance Marking */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Mark Today's Attendance
                                </Typography>
            
            {message && (
              <Alert 
                severity={message.includes('successfully') ? 'success' : 'error'} 
                sx={{ mb: 2 }}
                onClose={() => setMessage('')}
                >
                {message}
              </Alert>
            )}

            {isWeekend() && (
              <Alert severity="info" sx={{ mb: 2 }}>
                You cannot mark attendance on Saturday and Sunday
                </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button
                      variant="contained"
                color="success"
                startIcon={<PresentIcon />}
                onClick={() => markAttendance('present')}
                disabled={markingAttendance || todayMarked || isWeekend()}
                    >
                {markingAttendance ? <CircularProgress size={20} /> : 'Present'}
                    </Button>
              
                    <Button
                      variant="contained"
                color="error"
                startIcon={<AbsentIcon />}
                onClick={() => markAttendance('absent')}
                disabled={markingAttendance || todayMarked || isWeekend()}
                    >
                {markingAttendance ? <CircularProgress size={20} /> : 'Absent'}
                    </Button>

              {todayMarked && (
                <>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<UndoIcon />}
                    onClick={undoTodayAttendance}
                    disabled={markingAttendance || !todayAttendanceId}
                  >
                    Undo
                  </Button>
                <Chip 
                  label="Today's attendance already marked" 
                  color="info" 
                  size="small"
                />
                </>
              )}
            </Box>
          </Paper>

          {/* Statistics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="h6">
                        Present Days
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                        {presentDays}
                      </Typography>
                    </Box>
                    <PresentIcon sx={{ fontSize: 40, color: theme.palette.success.main }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="h6">
                        Absent Days
                </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.error.main }}>
                        {absentDays}
                    </Typography>
                    </Box>
                    <AbsentIcon sx={{ fontSize: 40, color: theme.palette.error.main }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="h6">
                        Total Marked
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        {totalMarkedDays}
                    </Typography>
                    </Box>
                    <CalendarIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="h6">
                        Attendance Rate
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.info.main }}>
                        {totalMarkedDays > 0 ? Math.round((presentDays / totalMarkedDays) * 100) : 0}%
                      </Typography>
                </Box>
                    <CalendarIcon sx={{ fontSize: 40, color: theme.palette.info.main }} />
              </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Monthly Calendar */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              {months[selectedMonth - 1]} {selectedYear} - Attendance Calendar
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                {/* Weekday Headers */}
                <Grid container spacing={1} sx={{ mb: 1 }}>
                  {weekDays.map((day, index) => (
                    <Grid item xs={12/7} key={day}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: index === 0 || index === 6 ? theme.palette.grey[100] : theme.palette.primary.main,
                          color: index === 0 || index === 6 ? theme.palette.text.primary : 'white',
                          py: 1,
                          borderRadius: 1,
                          fontWeight: 600
                        }}
      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {day}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                {/* Calendar Days */}
                <Grid container spacing={1}>
                  {calendarData.map((dayData, index) => (
                    <Grid item xs={12/7} key={dayData.isEmpty ? `empty-${index}` : dayData.day}>
                      {dayData.isEmpty ? (
                        <Box sx={{ minHeight: 60 }} />
                      ) : (
                        <Box
          sx={{ 
                            aspectRatio: '1',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: getStatusColor(dayData.status, dayData.isWeekend),
                            color: dayData.isWeekend ? theme.palette.text.secondary : (dayData.status ? 'white' : theme.palette.text.primary),
                            border: `2px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            position: 'relative',
                            minHeight: 60,
                            cursor: dayData.status ? 'pointer' : 'default',
                            boxShadow: dayData.status ? theme.shadows[2] : theme.shadows[1],
                            '&:hover': {
                              boxShadow: theme.shadows[4],
                              transform: 'translateY(-2px)',
                              transition: 'all 0.2s ease-in-out'
                            }
                          }}
                          title={dayData.status ? `${dayData.date}: ${dayData.status}${dayData.notes ? ` - ${dayData.notes}` : ''}` : dayData.date}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {dayData.day}
                          </Typography>
                          {getStatusIcon(dayData.status)}
                          {dayData.status && (
                            <Typography variant="caption" sx={{ fontSize: '0.6rem', textTransform: 'uppercase', mt: 0.5 }}>
                              {dayData.status.charAt(0)}
                            </Typography>
                          )}
                          {dayData.isWeekend && !dayData.status && (
                            <Typography variant="caption" sx={{ fontSize: '0.5rem', opacity: 0.7 }}>
                              Weekend
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Paper>

          {/* Legend */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 20, height: 20, backgroundColor: theme.palette.success.main, borderRadius: 1 }} />
              <Typography variant="body2">Present</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 20, height: 20, backgroundColor: theme.palette.error.main, borderRadius: 1 }} />
              <Typography variant="body2">Absent</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 20, height: 20, backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }} />
              <Typography variant="body2">Not Marked</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 20, height: 20, backgroundColor: theme.palette.grey[200], borderRadius: 1 }} />
              <Typography variant="body2">Weekend</Typography>
            </Box>
          </Box>
        </Container>
    </Box>
    </>
  );
};

export default AttendancePage; 