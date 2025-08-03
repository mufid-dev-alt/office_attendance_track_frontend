import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
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
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Assignment as TodoIcon,
  DateRange as DateIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Header from '../common/Header';
import { API_ENDPOINTS } from '../../config/api';
import userService from '../../config/userService';
import eventService from '../../config/eventService';

const UserTodos = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [editDialog, setEditDialog] = useState({ 
    open: false, 
    todo: null, 
    notes: '', 
    date: '',
    isNew: false 
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const showNotification = useCallback((message, severity) => {
    setNotification({ open: true, message, severity });
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.users.list);
      if (response.ok) {
        const data = await response.json();
        const nonAdminUsers = Array.isArray(data.users) ? data.users.filter(user => user.role !== 'admin') : [];
        setUsers(nonAdminUsers);
        setFilteredUsers(nonAdminUsers);
      }
    } catch (error) {
      showNotification('Error fetching users', 'error');
    }
  }, [showNotification]);

  const fetchUserTodos = useCallback(async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.todos.list}?user_id=${selectedUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setTodos(Array.isArray(data.todos) ? data.todos : []);
      }
    } catch (error) {
      showNotification('Error fetching todos', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedUser, showNotification]);

  const handleAddTodo = () => {
    setEditDialog({
      open: true,
      todo: null,
      notes: '',
      date: new Date().toISOString().split('T')[0],
      isNew: true
    });
  };

  const handleEditTodo = (todo) => {
    setEditDialog({
      open: true,
      todo: todo,
      notes: todo.notes,
      date: todo.date_created || new Date().toISOString().split('T')[0],
      isNew: false
    });
  };

  const handleSaveTodo = async () => {
    if (!editDialog.notes.trim()) {
      showNotification('Please enter todo text', 'error');
      return;
    }

    if (!editDialog.date) {
      showNotification('Please select a date', 'error');
      return;
    }

    try {
      if (editDialog.isNew) {
        // Create new todo
        const response = await fetch(API_ENDPOINTS.todos.create, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: selectedUser.id,
            notes: editDialog.notes,
            date_created: editDialog.date
          })
        });

        if (response.ok) {
          const newTodo = await response.json();
          showNotification('Todo added successfully', 'success');
          // Notify other components
          eventService.todoAdded(selectedUser.id, newTodo);
        } else {
          throw new Error('Failed to add todo');
        }
      } else {
        // Update existing todo
        const response = await fetch(`${API_ENDPOINTS.todos.update(editDialog.todo.id)}?notes=${encodeURIComponent(editDialog.notes)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const updatedTodo = await response.json();
          showNotification('Todo updated successfully', 'success');
          // Notify other components
          eventService.todoUpdated(selectedUser.id, updatedTodo);
        } else {
          throw new Error('Failed to update todo');
        }
      }

      setEditDialog({ open: false, todo: null, notes: '', date: '', isNew: false });
      fetchUserTodos();
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  const handleDeleteTodo = async (todoId, todoText) => {
    if (!window.confirm(`Are you sure you want to delete "${todoText.substring(0, 50)}..."?`)) return;
    
    try {
      const response = await fetch(API_ENDPOINTS.todos.delete(todoId), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        showNotification('Todo deleted successfully', 'success');
        // Notify other components
        eventService.todoDeleted(selectedUser.id, todoId);
        fetchUserTodos();
      } else {
        throw new Error('Failed to delete todo');
      }
    } catch (error) {
      showNotification('Error deleting todo', 'error');
    }
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [navigate]);

  // Auto-refresh users every 30 seconds to catch updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUsers();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Only fetch users on component mount and via refresh button

  useEffect(() => {
    if (selectedUser) {
      fetchUserTodos();
    }
  }, [selectedUser]);

  useEffect(() => {
    const filtered = users.filter(user => 
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchQuery]);

  return (
    <>
      <Header />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, backgroundColor: theme.palette.grey[50], minHeight: '100vh' }}>
        <Container maxWidth="xl">
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 4 }}>
            User Todo Management
          </Typography>

          {!selectedUser ? (
            // User Selection Screen
            <Paper sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <TodoIcon sx={{ fontSize: 60, color: theme.palette.primary.main, mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  Select a User to Manage Todos
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Choose a user from the list below to view and edit their todos
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
            // User-Specific Todo View
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
                        {selectedUser.full_name}'s Todos
                      </Typography>
                      <Typography variant="body1" color="textSecondary">
                        {selectedUser.email}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddTodo}
                    >
                      Add New Todo
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

              {/* Todos List */}
              <Paper sx={{ p: 3 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : todos.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <TodoIcon sx={{ fontSize: 60, color: theme.palette.grey[400], mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
                      No todos found
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddTodo}
                    >
                      Add First Todo
                    </Button>
                  </Box>
                ) : (
                  <List>
                    {todos.map((todo, index) => (
                      <React.Fragment key={todo.id}>
                        <ListItem sx={{ py: 2 }}>
                          <ListItemText
                            primary={
                              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                {todo.notes}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <DateIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                                <Typography variant="body2" color="textSecondary">
                                  Created: {todo.date_created ? new Date(todo.date_created).toLocaleDateString() : 'No date'}
                                </Typography>
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              aria-label="edit"
                              onClick={() => handleEditTodo(todo)}
                              sx={{ mr: 1 }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => handleDeleteTodo(todo.id, todo.notes)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < todos.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Paper>
            </Box>
          )}
        </Container>

        {/* Edit Todo Dialog */}
        <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, todo: null, notes: '', date: '', isNew: false })} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editDialog.isNew ? 'Add New Todo' : 'Edit Todo'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Todo Description"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={editDialog.notes}
              onChange={(e) => setEditDialog({ ...editDialog, notes: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Date"
              type="date"
              fullWidth
              variant="outlined"
              value={editDialog.date}
              onChange={(e) => setEditDialog({ ...editDialog, date: e.target.value })}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog({ open: false, todo: null, notes: '', date: '', isNew: false })}>
              Cancel
            </Button>
            <Button onClick={handleSaveTodo} variant="contained">
              {editDialog.isNew ? 'Add Todo' : 'Update Todo'}
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

export default UserTodos; 