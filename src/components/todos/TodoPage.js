import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DateRangeIcon from '@mui/icons-material/DateRange';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import Header from '../common/Header';
import { API_ENDPOINTS } from '../../config/api';
import eventService from '../../config/eventService';

const TodoPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState([]);
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

  const handleAuthError = useCallback(() => {
    localStorage.removeItem('user');
    navigate('/');
  }, [navigate]);

  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData) {
        handleAuthError();
        return;
      }

      const response = await fetch(`${API_ENDPOINTS.todos.list}?user_id=${userData.id}`, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleAuthError();
          return;
        }
        throw new Error('Failed to fetch todos');
      }

      const data = await response.json();
      setTodos(Array.isArray(data.todos) ? data.todos : []);
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification, handleAuthError]);

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
      showNotification('Please enter a todo', 'error');
      return;
    }

    if (!editDialog.date) {
      showNotification('Please select a date', 'error');
      return;
    }

    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem('user'));
      
      if (editDialog.isNew) {
        // Create new todo
      const response = await fetch(API_ENDPOINTS.todos.create, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          user_id: userData.id,
            notes: editDialog.notes,
            date_created: editDialog.date
        })
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleAuthError();
          return;
        }
        throw new Error('Failed to create todo');
      }

      showNotification('Todo created successfully', 'success');
      } else {
        // Update existing todo
        const response = await fetch(`${API_ENDPOINTS.todos.update(editDialog.todo.id)}?notes=${encodeURIComponent(editDialog.notes)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleAuthError();
          return;
        }
        throw new Error('Failed to update todo');
      }

      showNotification('Todo updated successfully', 'success');
      }

      setEditDialog({ open: false, todo: null, notes: '', date: '', isNew: false });
      fetchTodos();
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.todos.delete(id), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleAuthError();
          return;
        }
        throw new Error('Failed to delete todo');
      }

      showNotification('Todo deleted successfully', 'success');
      fetchTodos();
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) {
      navigate('/');
      return;
    }
    fetchTodos();
  }, [fetchTodos, navigate]);
  
  // Listen for events from eventService
  useEffect(() => {
    const unsubscribe = eventService.listen((eventType, data) => {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData) return;
      
      if (eventType === 'backend_reset_detected') {
        showNotification('Backend reset detected. Using locally stored data.', 'warning');
        fetchTodos();
      }
      
      if (eventType === 'todo_added' || eventType === 'todo_updated' || eventType === 'todo_deleted') {
        if (data.userId === userData.id) {
          console.log(`📣 TodoPage received event: ${eventType}`);
          fetchTodos();
        }
      }
    });
    
    return () => unsubscribe();
  }, [fetchTodos, showNotification]);
  
  // Auto-refresh todos every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTodos();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [fetchTodos]);

  return (
    <>
      <Header />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, backgroundColor: theme.palette.grey[50], minHeight: '100vh' }}>
      <Container maxWidth="lg">
          <Paper sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                My Todos
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
                onClick={handleAddTodo}
                sx={{
                  borderRadius: 3,
                  px: 3,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600
            }}
          >
                Add Todo
          </Button>
        </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
            ) : todos.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
                  No todos yet
              </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Start by adding your first todo item
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddTodo}
                  sx={{
                    borderRadius: 3,
                    px: 3,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  Add First Todo
                </Button>
                </Box>
              ) : (
                <List>
                {(Array.isArray(todos) ? todos : []).map((todo, index) => (
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
                            <DateRangeIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
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
                            onClick={() => handleDelete(todo.id)}
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
      </Container>

        {/* Add/Edit Todo Dialog */}
      <Dialog 
          open={editDialog.open} 
          onClose={() => setEditDialog({ open: false, todo: null, notes: '', date: '', isNew: false })}
        maxWidth="sm"
        fullWidth
      >
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

export default TodoPage; 