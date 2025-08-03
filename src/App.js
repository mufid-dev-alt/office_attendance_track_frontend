import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import UserDashboard from './components/dashboard/UserDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';
import AttendancePage from './components/attendance/AttendancePage';
import TodoPage from './components/todos/TodoPage';
import AttendanceRecords from './components/admin/AttendanceRecords';
import UserTodos from './components/admin/UserTodos';
import ManageUsers from './components/admin/ManageUsers';
import { ThemeProvider, createTheme } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2'
    },
    secondary: {
      main: '#f50057',
      light: '#ff4081',
      dark: '#c51162'
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12
        }
      }
    }
  }
});

const PrivateRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user ? children : <Navigate to="/" />;
};

const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user?.role === 'admin' ? children : <Navigate to="/dashboard" />;
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
      <Route
            path="/dashboard"
        element={
              <PrivateRoute>
              <UserDashboard />
            </PrivateRoute>
        }
      />
      <Route
            path="/admin"
        element={
              <AdminRoute>
              <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <PrivateRoute>
                <AttendancePage />
            </PrivateRoute>
        }
      />
      <Route
            path="/todos"
            element={
              <PrivateRoute>
                <TodoPage />
              </PrivateRoute>
            }
      />
      <Route
            path="/admin/attendance-records"
            element={
              <AdminRoute>
                <AttendanceRecords />
              </AdminRoute>
            }
      />
      <Route
            path="/admin/user-todos"
            element={
              <AdminRoute>
                <UserTodos />
              </AdminRoute>
            }
      />
      <Route
            path="/admin/manage-users"
            element={
              <AdminRoute>
                <ManageUsers />
              </AdminRoute>
            }
      />
      <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <ManageUsers />
              </AdminRoute>
            }
      />
      <Route
            path="/admin/todos"
            element={
              <AdminRoute>
                <UserTodos />
              </AdminRoute>
            }
      />
      {/* Catch-all route for handling deep links and page refresh */}
      <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
