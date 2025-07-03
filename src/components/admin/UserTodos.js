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
  Autocomplete,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
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
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as PersonIcon,
  CheckCircle as CompletedIcon,
  RadioButtonUnchecked as PendingIcon,
  Assignment as TodoIcon
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
      isNew: true
    });
  };

  const handleEditTodo = (todo) => {
    setEditDialog({
      open: true,
      todo: todo,
      notes: todo.notes,
      isNew: false
    });
  };

  const handleSaveTodo = async () => {
    if (!editDialog.notes.trim()) {
      showNotification('Please enter todo text', 'error');
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
            completed: 0
          })
        });

        if (response.ok) {
          showNotification('Todo added successfully', 'success');
        } else {
          throw new Error('Failed to add todo');
        }
      } else {
        // Update existing todo
        const response = await fetch(API_ENDPOINTS.todos.update(editDialog.todo.id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notes: editDialog.notes,
            completed: editDialog.todo.completed
          })
        });

        if (response.ok) {
          showNotification('Todo updated successfully', 'success');
        } else {
          throw new Error('Failed to update todo');
        }
      }

      setEditDialog({ open: false, todo: null, notes: '', isNew: false });
      fetchUserTodos();
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  const handleToggleComplete = async (todo) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.todos.update(todo.id)}?completed=${todo.completed ? 0 : 1}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        showNotification(`Todo marked as ${todo.completed ? 'pending' : 'completed'}`, 'success');
        fetchUserTodos();
      } else {
        throw new Error('Failed to update todo status');
      }
    } catch (error) {
      showNotification('Error updating todo status', 'error');
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

  const completedTodos = todos.filter(todo => todo.completed);
  const pendingTodos = todos.filter(todo => !todo.completed);

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
                  Choose a user from the list below to view and manage their todo items
                </Typography>
              </Box>

              <Autocomplete
                options={users}
                getOptionLabel={(option) => `${option.full_name} (${option.email})`}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search and Select User"
                    variant="outlined"
                    fullWidth
                    placeholder="Type to search by name or email..."
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.main }}>
                      {option.full_name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {option.full_name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {option.email}
                      </Typography>
                    </Box>
                  </Box>
                )}
                onChange={(event, newValue) => {
                  setSelectedUser(newValue);
                }}
                sx={{ maxWidth: 600, mx: 'auto' }}
              />

              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Quick User List
                </Typography>
                <Grid container spacing={2}>
                  {users.map((user) => (
                    <Grid item xs={12} sm={6} md={4} key={user.id}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: theme.shadows[4]
                          }
                        }}
                        onClick={() => setSelectedUser(user)}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.main }}>
                              {user.full_name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {user.full_name}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {user.email}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
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

              {/* Statistics */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<TodoIcon />}
                    label={`Total Todos: ${todos.length}`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<PendingIcon />}
                    label={`Pending: ${pendingTodos.length}`}
                    color="warning"
                    variant="outlined"
                  />
                  <Chip
                    icon={<CompletedIcon />}
                    label={`Completed: ${completedTodos.length}`}
                    color="success"
                    variant="outlined"
                  />
                </Box>
              </Paper>

              {/* Todo Lists */}
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {/* Pending Todos */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: 'fit-content' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}>
                        <PendingIcon sx={{ mr: 1, color: theme.palette.warning.main }} />
                        Pending Todos ({pendingTodos.length})
                      </Typography>
                      
                      {pendingTodos.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <Typography variant="body2" color="textSecondary">
                            No pending todos
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {pendingTodos.map((todo) => (
                            <Card key={todo.id} sx={{ border: '1px solid', borderColor: theme.palette.warning.light }}>
                              <CardContent sx={{ pb: 1 }}>
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                  {todo.notes}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  Created: {new Date(todo.created_at).toLocaleDateString()}
                                </Typography>
                              </CardContent>
                              <CardActions sx={{ pt: 0, justifyContent: 'space-between' }}>
                                <Box>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleToggleComplete(todo)}
                                    color="success"
                                    title="Mark as completed"
                                  >
                                    <CompletedIcon />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditTodo(todo)}
                                    color="primary"
                                    title="Edit todo"
                                  >
                                    <EditIcon />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteTodo(todo.id, todo.notes)}
                                    color="error"
                                    title="Delete todo"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              </CardActions>
                            </Card>
                          ))}
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* Completed Todos */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: 'fit-content' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}>
                        <CompletedIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                        Completed Todos ({completedTodos.length})
                      </Typography>
                      
                      {completedTodos.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <Typography variant="body2" color="textSecondary">
                            No completed todos
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {completedTodos.map((todo) => (
                            <Card key={todo.id} sx={{ border: '1px solid', borderColor: theme.palette.success.light, bgcolor: theme.palette.success.light + '10' }}>
                              <CardContent sx={{ pb: 1 }}>
                                <Typography variant="body1" sx={{ mb: 1, textDecoration: 'line-through', opacity: 0.8 }}>
                                  {todo.notes}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  Created: {new Date(todo.created_at).toLocaleDateString()}
                                </Typography>
                              </CardContent>
                              <CardActions sx={{ pt: 0, justifyContent: 'space-between' }}>
                                <Box>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleToggleComplete(todo)}
                                    color="warning"
                                    title="Mark as pending"
                                  >
                                    <PendingIcon />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditTodo(todo)}
                                    color="primary"
                                    title="Edit todo"
                                  >
                                    <EditIcon />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteTodo(todo.id, todo.notes)}
                                    color="error"
                                    title="Delete todo"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              </CardActions>
                            </Card>
                          ))}
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </Box>
          )}
        </Container>

        {/* Add/Edit Todo Dialog */}
        <Dialog 
          open={editDialog.open} 
          onClose={() => setEditDialog({ open: false, todo: null, notes: '', isNew: false })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 600 }}>
            {editDialog.isNew ? 'Add New Todo' : 'Edit Todo'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              label="Todo Description"
              multiline
              rows={4}
              value={editDialog.notes}
              onChange={(e) => setEditDialog({ ...editDialog, notes: e.target.value })}
              placeholder="Enter todo description..."
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog({ open: false, todo: null, notes: '', isNew: false })}>
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