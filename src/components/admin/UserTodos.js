import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
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
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Header from '../common/Header';
import { API_ENDPOINTS } from '../../config/api';

const UserTodos = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [editedNotes, setEditedNotes] = useState('');
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const showNotification = useCallback((message, severity) => {
    setNotification({ open: true, message, severity });
  }, []);

  const fetchTodos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.todos.list, {
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setTodos(data || []);
      } else {
        throw new Error('Failed to fetch todos');
      }
    } catch (error) {
      showNotification('Error fetching todos', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const handleEdit = (todo) => {
    setEditingTodo(todo);
    setEditedNotes(todo.notes);
    setDialogOpen(true);
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.todos.update(editingTodo.id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          notes: editedNotes,
          completed: editingTodo.completed
        })
      });

      if (response.ok) {
        showNotification('Todo updated successfully', 'success');
        setDialogOpen(false);
        fetchTodos();
      } else {
        throw new Error('Failed to update todo');
      }
    } catch (error) {
      showNotification('Error updating todo', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this todo?')) return;
    
    try {
      const response = await fetch(API_ENDPOINTS.todos.delete(id), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        showNotification('Todo deleted successfully', 'success');
        fetchTodos();
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
    fetchTodos();
  }, [fetchTodos, navigate]);

  return (
    <>
      <Header />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, backgroundColor: theme.palette.grey[50], minHeight: '100vh' }}>
        <Container maxWidth="xl">
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              User Todos
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
              View and manage all user todo entries
            </Typography>
          </Box>

          <Paper sx={{ p: 3 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Todo</TableCell>
                      <TableCell>Created Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {todos.map((todo) => (
                      <TableRow key={todo.id}>
                        <TableCell>{todo.user_name || 'Unknown'}</TableCell>
                        <TableCell>{todo.user_email || 'N/A'}</TableCell>
                        <TableCell sx={{ maxWidth: 400 }}>
                          <Typography variant="body2">
                            {todo.notes}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {new Date(todo.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              color: todo.completed ? theme.palette.success.main : theme.palette.warning.main,
                              fontWeight: 600
                            }}
                          >
                            {todo.completed ? 'Completed' : 'Pending'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton onClick={() => handleEdit(todo)} color="primary">
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDelete(todo.id)} color="error">
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

        {/* Edit Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Todo</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Todo"
                multiline
                rows={4}
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} variant="contained">
              Update
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