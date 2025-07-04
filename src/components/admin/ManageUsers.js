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
  Warning as WarningIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Header from '../common/Header';
import { API_ENDPOINTS } from '../../config/api';

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
    id: '',
    full_name: '',
    email: '',
    password: ''
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.users.list, {
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.filter(user => user.role !== 'admin'));
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (error) {
      showNotification('Error fetching users', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const handleAddUser = () => {
    setFormData({
      id: '',
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
      const response = await fetch(API_ENDPOINTS.users.delete(userToDelete.id), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add to recently deleted list
        setRecentlyDeleted(prev => [...prev, {
          ...userToDelete,
          deletedAt: new Date().toISOString(),
          message: result.message
        }]);

        showNotification(`${userToDelete.full_name} and all their data has been permanently deleted`, 'success');
        setDeleteDialogOpen(false);
        setUserToDelete(null);
        fetchUsers();
        
        // Notify other admin components about the update
        localStorage.setItem('userUpdate', JSON.stringify({
          type: 'user_deleted',
          timestamp: new Date().toISOString()
        }));
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete user');
      }
    } catch (error) {
      showNotification(error.message || 'Error deleting user', 'error');
    }
  };

  const handleUndo = async (userId) => {
    try {
      const response = await fetch(API_ENDPOINTS.users.undo(userId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        
        // Remove from recently deleted list
        setRecentlyDeleted(prev => prev.filter(user => user.id !== userId));
        
        showNotification(`${result.restored_user.full_name} and all their data has been restored`, 'success');
        fetchUsers();
        
        // Notify other admin components about the update
        localStorage.setItem('userUpdate', JSON.stringify({
          type: 'user_restored',
          timestamp: new Date().toISOString()
        }));
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to restore user');
      }
    } catch (error) {
      showNotification(error.message || 'Error restoring user', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!formData.id || !formData.full_name || !formData.email || !formData.password) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    // Validate User ID is a number
    const userId = parseInt(formData.id);
    if (isNaN(userId) || userId <= 0) {
      showNotification('User ID must be a positive number', 'error');
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.users.create, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: 'user'
        })
      });

      if (response.ok) {
        showNotification('User added successfully', 'success');
        setDialogOpen(false);
        setFormData({
          id: '',
          full_name: '',
          email: '',
          password: ''
        });
        fetchUsers();
        
        // Notify other admin components about the update
        localStorage.setItem('userUpdate', JSON.stringify({
          type: 'user_added',
          timestamp: new Date().toISOString()
        }));
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to add user');
      }
    } catch (error) {
      showNotification(error.message || 'Error adding user', 'error');
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

  // Auto-refresh users every 30 seconds to catch updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUsers();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchUsers]);

  // Update current time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Clear recently deleted users after 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setRecentlyDeleted(prev => prev.filter(user => {
        const deletedTime = new Date(user.deletedAt);
        const timeDiff = now - deletedTime;
        return timeDiff < 5 * 60 * 1000; // 5 minutes
      }));
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Header />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, backgroundColor: theme.palette.grey[50], minHeight: '100vh' }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                Manage Users
              </Typography>
              <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
                Add or remove user accounts
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddUser}
            >
              Add New User
            </Button>
          </Box>

          {/* Vercel Notice */}
          <Paper sx={{ p: 3, mb: 3, backgroundColor: '#e3f2fd', border: '1px solid #2196f3' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1976d2', display: 'flex', alignItems: 'center', gap: 1 }}>
              ℹ️ Demo Environment Notice
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              <strong>Important:</strong> This application is running on Vercel's serverless platform for demonstration purposes. 
              New users will persist during your current session but may reset when the serverless function restarts. 
              For production use, a persistent database solution (PostgreSQL, MongoDB, etc.) would be implemented.
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>Current session features:</strong> ✅ Add users ✅ Delete users ✅ Undo functionality ✅ Real-time updates
            </Typography>
          </Paper>

          {/* Recently Deleted Users */}
          {recentlyDeleted.length > 0 && (
            <Paper sx={{ p: 3, mb: 3, backgroundColor: '#fff3e0', border: '1px solid #ffb74d' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#f57c00' }}>
                Recently Deleted Users
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                These users have been permanently deleted. Click "Undo" to restore them and all their data. 
                <strong>Undo option expires after 5 minutes.</strong>
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {recentlyDeleted.map((user) => {
                  const remainingTime = getRemainingTime(user.deletedAt);
                  if (!remainingTime) return null; // Don't show expired items
                  
                  return (
                    <Chip
                      key={user.id}
                      label={`${user.full_name} (ID: ${user.id}) - ${remainingTime}`}
                      color="warning"
                      variant="outlined"
                      deleteIcon={<UndoIcon />}
                      onDelete={() => handleUndo(user.id)}
                      sx={{ mb: 1 }}
                    />
                  );
                })}
              </Stack>
            </Paper>
          )}

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Active Users ({users.length})
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: { xs: 'auto', sm: 650 } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>User ID</TableCell>
                      <TableCell>Full Name</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Email</TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Registration Date</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {user.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {user.full_name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" sx={{ display: { xs: 'block', md: 'none' } }}>
                              {user.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          {user.email}
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton 
                            onClick={() => handleDeleteClick(user)} 
                            color="error"
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
        </Container>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="error" />
            Confirm User Deletion
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to permanently delete <strong>{userToDelete?.full_name}</strong>?
            </Typography>
            <Box sx={{ backgroundColor: '#ffebee', p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="body2" color="error" sx={{ fontWeight: 600, mb: 1 }}>
                This action will:
              </Typography>
              <Typography variant="body2" color="error" component="ul" sx={{ ml: 2 }}>
                <li>Remove the user from the system permanently</li>
                <li>Delete all their attendance records</li>
                <li>Delete all their todo items</li>
                <li>Prevent them from logging in</li>
                <li>Remove them from all admin dashboards</li>
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary">
              Don't worry - you can undo this action if it was done by mistake.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} variant="contained" color="error">
              Delete User
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add User Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New User</DialogTitle>
          <DialogContent>
            <Box 
              component="form" 
              onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}
            >
              <TextField
                fullWidth
                label="User ID *"
                type="number"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                helperText="Unique identifier for the user (must be a positive number)"
                required
                inputProps={{ min: 1 }}
              />
              
              <TextField
                fullWidth
                label="Full Name *"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
              
              <TextField
                fullWidth
                label="Email *"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              
              <TextField
                fullWidth
                label="Password *"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                helperText="User will use this password to login"
                required
                autoComplete="new-password"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" type="submit">
              Add User
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

export default ManageUsers; 