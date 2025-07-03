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
  ListItemSecondaryAction
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Assignment as TodoIcon,
  DateRange as DateIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Header from '../common/Header';
import { API_ENDPOINTS } from '../../config/api';

const UserTodos = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
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
        setUsers(data.filter(user => user.role !== 'admin'));
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
        setTodos(data || []);
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
          showNotification('Todo added successfully', 'success');
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
          showNotification('Todo updated successfully', 'success');
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
  }, [fetchUsers, navigate]);

  useEffect(() => {
    if (selectedUser) {
      fetchUserTodos();
    }
  }, [fetchUserTodos]);

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

              {/* Tabular User Selection */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'flex-start' }}>
                {/* User List */}
                <Box sx={{ flex: 1, minWidth: { xs: '100%', md: '300px' } }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Users
                  </Typography>
                  <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                    {users.map((user) => (
                      <Card 
                        key={user.id}
                        sx={{ 
                          mb: 1,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'translateX(4px)',
                            boxShadow: theme.shadows[4],
                            bgcolor: theme.palette.action.hover
                          }
                        }}
                        onClick={() => setSelectedUser(user)}
                      >
                        <CardContent sx={{ py: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.main, width: 40, height: 40 }}>
                              {user.full_name.charAt(0)}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                                {user.full_name}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {user.email}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </Box>
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