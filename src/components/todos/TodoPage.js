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
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import Header from '../common/Header';
import { API_ENDPOINTS } from '../../config/api';

const TodoPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [editingTodo, setEditingTodo] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
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
      setTodos(data || []);
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification, handleAuthError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) {
      showNotification('Please enter a todo', 'error');
      return;
    }

    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem('user'));
      
      const response = await fetch(API_ENDPOINTS.todos.create, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          user_id: userData.id,
          notes: newTodo,
          completed: 0
        })
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleAuthError();
          return;
        }
        throw new Error('Failed to create todo');
      }

      const data = await response.json();
      showNotification('Todo created successfully', 'success');
      setNewTodo('');
      setDialogOpen(false);
      fetchTodos();
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (todo) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_ENDPOINTS.todos.update(todo.id)}?completed=${todo.completed ? 0 : 1}`, {
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

      const data = await response.json();
      showNotification('Todo updated successfully', 'success');
      setEditingTodo(null);
      setDialogOpen(false);
      setNewTodo('');
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

      const data = await response.json();
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

  return (
    <>
      <Header />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, backgroundColor: theme.palette.grey[50], minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 600,
                color: theme.palette.primary.main
            }}
          >
            Todo List
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingTodo(null);
                setNewTodo('');
              setDialogOpen(true);
            }}
          >
              Add New Todo
          </Button>
        </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                My Todos ({todos.length})
              </Typography>
              
              {todos.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    No todos yet. Click "Add New Todo" to get started!
                </Typography>
                </Box>
              ) : (
                <List>
                  {todos.map(todo => (
                      <ListItem
                        key={todo.id}
                        sx={{
                          mb: 1,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: theme.palette.divider,
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography
                              sx={{
                                fontWeight: 500,
                              color: theme.palette.text.primary
                              }}
                            >
                            {todo.notes}
                            </Typography>
                          }
                          secondary={
                            <Typography
                              variant="body2"
                              sx={{
                                color: theme.palette.text.secondary,
                              mt: 0.5
                            }}
                          >
                            {new Date(todo.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            </Typography>
                          }
                        />
                      
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => {
                              setEditingTodo(todo);
                            setNewTodo(todo.notes);
                              setDialogOpen(true);
                            }}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleDelete(todo.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                </List>
              )}
              </Paper>
          )}
      </Container>

        {/* Add/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
          <DialogTitle sx={{ fontWeight: 600 }}>
            {editingTodo ? 'Edit Todo' : 'Add New Todo'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
                label="Todo *"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
              required
              multiline
                rows={4}
                placeholder="Enter your todo..."
              />
          </Box>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
              onClick={editingTodo ? () => handleUpdate(editingTodo) : handleSubmit}
            variant="contained"
          >
              {editingTodo ? 'Update' : 'Add'} Todo
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setNotification(prev => ({ ...prev, open: false }))} 
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

export default TodoPage; 