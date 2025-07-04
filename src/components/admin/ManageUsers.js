import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Undo as UndoIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Header from '../common/Header';
import { API_ENDPOINTS } from '../../config/api';
import userService from '../../config/userService';
import eventService from '../../config/eventService';

const ManageUsers = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [recentlyDeleted, setRecentlyDeleted] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: ''
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [serverSyncStatus, setServerSyncStatus] = useState('synced'); // 'synced', 'syncing', 'error'

  const showNotification = useCallback((message, severity) => {
    setNotification({ open: true, message, severity });
  }, []);

  const getRemainingTime = useCallback((deletedAt) => {
    const deletedTime = new Date(deletedAt);
    const timeDiff = 5 * 60 * 1000 - (currentTime - deletedTime); // 5 minutes in ms
    
    if (timeDiff <= 0) return null;
    
    const minutes = Math.floor(timeDiff / 60000);
    const seconds = Math.floor((timeDiff % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [currentTime]);

  // Load users using the centralized user service
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const usersList = await userService.getUsers();
      setUsers(usersList.filter(user => user.role !== 'admin'));
      setServerSyncStatus('synced');
    } catch (error) {
      console.error('Error fetching users:', error);
      showNotification('Error fetching users', 'error');
      setServerSyncStatus('error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const handleAddUser = () => {
    setFormData({
      full_name: '',
      email: '',
      password: ''
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    try {
      setServerSyncStatus('syncing');
      await userService.deleteUser(userToDelete.id);
      
      // Add to recently deleted list for undo functionality
      setRecentlyDeleted(prev => [...prev, {
        ...userToDelete,
        deletedAt: new Date().toISOString(),
        message: `${userToDelete.full_name} has been deleted`
      }]);

      showNotification(`${userToDelete.full_name} and all their data has been deleted`, 'success');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      
      // Refresh user list
      fetchUsers();
      setServerSyncStatus('synced');
    } catch (error) {
      console.error('Error deleting user:', error);
      showNotification(`Error deleting user: ${error.message}`, 'error');
      setServerSyncStatus('error');
    }
  };

  const handleUndo = async (userId) => {
    try {
      setServerSyncStatus('syncing');
      const result = await userService.restoreUser(userId);
      
      // Remove from recently deleted list
      setRecentlyDeleted(prev => prev.filter(item => item.id !== userId));
      
      showNotification(`${result.restored_user.full_name} has been restored successfully`, 'success');
      
      // Refresh user list
      fetchUsers();
      setServerSyncStatus('synced');
    } catch (error) {
      console.error('Error restoring user:', error);
      showNotification(`Error restoring user: ${error.message}`, 'error');
      setServerSyncStatus('error');
    }
  };
  
  const handlePermanentDelete = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to permanently delete ${userName}? This action cannot be undone.`)) {
      try {
        setServerSyncStatus('syncing');
        await userService.permanentlyDeleteUser(userId);
        
        // Remove from recently deleted list
        setRecentlyDeleted(prev => prev.filter(item => item.id !== userId));
        
        showNotification(`${userName} has been permanently deleted`, 'success');
        setServerSyncStatus('synced');
      } catch (error) {
        console.error('Error permanently deleting user:', error);
        showNotification(`Error permanently deleting user: ${error.message}`, 'error');
        setServerSyncStatus('error');
      }
    }
  };

  const handleSubmit = async () => {
    // Validate form
    if (!formData.full_name || !formData.email || !formData.password) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    try {
      setServerSyncStatus('syncing');
      await userService.addUser({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: 'user'
      });

      showNotification(`User ${formData.full_name} has been created successfully`, 'success');
      setDialogOpen(false);
      
      // Refresh user list
      fetchUsers();
      setServerSyncStatus('synced');
    } catch (error) {
      console.error('Error creating user:', error);
      showNotification(`Error creating user: ${error.message}`, 'error');
      setServerSyncStatus('error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Initialize user service and fetch users on component mount
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'admin') {
      navigate('/');
      return;
    }
    
    fetchUsers();
    
    // Subscribe to user service updates
    const unsubscribe = userService.subscribe((eventType, data, updatedUsers) => {
      if (['user_added', 'user_deleted', 'user_restored', 'sync_complete', 'init_complete'].includes(eventType)) {
        setUsers(updatedUsers.filter(user => user.role !== 'admin'));
      }
      
      if (eventType === 'sync_complete') {
        showNotification('Users synchronized with server', 'info');
      }
    });
    
    return () => unsubscribe();
  }, [fetchUsers, navigate, showNotification]);

  // Update current time every second for the countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Clean up expired deleted users
  useEffect(() => {
    setRecentlyDeleted(prev => 
      prev.filter(item => {
        const deletedTime = new Date(item.deletedAt);
        const timeDiff = new Date() - deletedTime;
        return timeDiff < 5 * 60 * 1000; // 5 minutes in ms
      })
    );
  }, [currentTime]);

  // No event-based refresh

  return (
    <>
      <Header />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, backgroundColor: theme.palette.grey[50], minHeight: '100vh' }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Active Users ({users.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <IconButton 
                color="primary" 
                onClick={fetchUsers} 
                title="Refresh users list"
              >
                <RefreshIcon />
              </IconButton>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddUser}
              >
                Add User
              </Button>
            </Box>
          </Box>

          <Paper sx={{ mb: 4, overflow: 'hidden' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: theme.palette.primary.light }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>User ID</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Full Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Registration Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user.id} hover>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>
                          <IconButton 
                            color="error" 
                            onClick={() => handleDeleteClick(user)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {recentlyDeleted.length > 0 && (
            <Paper sx={{ mb: 4, p: 3, backgroundColor: theme.palette.warning.light }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WarningIcon sx={{ color: theme.palette.warning.dark, mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.warning.dark }}>
                  Recently Deleted Users
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 2, color: theme.palette.warning.dark }}>
                These users can be restored within 5 minutes of deletion. After that, they will be permanently removed.
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                {recentlyDeleted.map(item => {
                  const remainingTime = getRemainingTime(item.deletedAt);
                  if (!remainingTime) return null;
                  
                  return (
                    <Box key={item.id} sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      backgroundColor: 'white',
                      p: 2,
                      borderRadius: 1
                    }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {item.full_name} ({item.email})
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          color="warning"
                          startIcon={<UndoIcon />}
                          onClick={() => handleUndo(item.id)}
                        >
                          Restore
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handlePermanentDelete(item.id, item.full_name)}
                        >
                          Delete Now
                        </Button>
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            </Paper>
          )}


        </Container>
      </Box>

      {/* Add User Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="full_name"
            label="Full Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.full_name}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="email"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={formData.email}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="password"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={formData.password}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Add User</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete {userToDelete?.full_name}?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            This will remove the user and all associated data.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
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
    </>
  );
};

export default ManageUsers; 