import { API_ENDPOINTS } from './api';
import eventService from './eventService';

// User Service - Centralized user management for persistence across components
class UserService {
  constructor() {
    this.users = [];
    this.listeners = [];
    this.initialized = false;
    this.sessionId = Date.now().toString();
    this.backendResetDetected = false;
    console.log('🔄 User service initialized with session ID:', this.sessionId);
  }

  // Load users from backend and localStorage
  async initialize() {
    if (this.initialized) return this.users;
    
    try {
      // Try to load from localStorage first for immediate display
      const savedUsers = this.loadFromLocalStorage();
      if (savedUsers && savedUsers.length > 0) {
        this.users = savedUsers;
        this.notifyListeners('init_start', null, this.users);
      }

      // Always fetch from backend to ensure latest data
      const response = await fetch(API_ENDPOINTS.users.list);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch users');
      }

      this.users = data.users;
      this.saveToLocalStorage();
      this.initialized = true;
      this.notifyListeners('init_complete', null, this.users);
      
      return this.users;
    } catch (error) {
      console.error('Error initializing user service:', error);
      this.notifyListeners('init_error', error, this.users);
      throw error;
    }
  }

  // Add a new user
  async addUser(userData) {
    try {
      const response = await fetch(API_ENDPOINTS.users.create, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to add user');
      }

      // Update local state
      this.users = [...this.users, data.user];
      this.saveToLocalStorage();
      this.notifyListeners('user_added', data.user, this.users);
      
      return data.user;
    } catch (error) {
      console.error('Error adding user:', error);
      this.notifyListeners('user_add_error', error, this.users);
      throw error;
    }
  }

  // Delete a user
  async deleteUser(userId) {
    try {
      const response = await fetch(API_ENDPOINTS.users.delete(userId), {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete user');
      }

      // Update local state
      this.users = this.users.filter(user => user.id !== userId);
      this.saveToLocalStorage();
      this.notifyListeners('user_deleted', { userId, deletedUser: data.user }, this.users);
      
      return data;
    } catch (error) {
      console.error('Error deleting user:', error);
      this.notifyListeners('user_delete_error', error, this.users);
      throw error;
    }
  }

  // Restore a deleted user
  async restoreUser(userId) {
    try {
      const response = await fetch(API_ENDPOINTS.users.undo(userId), {
        method: 'POST',
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to restore user');
      }

      // Update local state by adding the restored user back
      if (data.user) {
        this.users.push(data.user);
        this.saveToLocalStorage();
        this.notifyListeners('user_restored', { userId, restoredUser: data.user }, this.users);
      }
      
      return data;
    } catch (error) {
      console.error('Error restoring user:', error);
      this.notifyListeners('user_restore_error', error, this.users);
      throw error;
    }
  }

  // Permanently delete a user
  async permanentlyDeleteUser(userId) {
    try {
      const response = await fetch(API_ENDPOINTS.users.permanentDelete(userId), {
        method: 'POST',
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to permanently delete user');
      }

      // Update local state
      this.users = this.users.filter(user => user.id !== userId);
      this.saveToLocalStorage();
      this.notifyListeners('user_permanently_deleted', { userId }, this.users);
      
      return data;
    } catch (error) {
      console.error('Error permanently deleting user:', error);
      this.notifyListeners('user_permanent_delete_error', error, this.users);
      throw error;
    }
  }

  // Get all users (with optional force refresh)
  async getUsers(forceRefresh = false) {
    if (!this.initialized || forceRefresh) {
      await this.initialize();
    }
    return this.users;
  }

  // Save users to localStorage
  saveToLocalStorage() {
    try {
      localStorage.setItem('users', JSON.stringify(this.users));
    } catch (error) {
      console.error('Error saving users to localStorage:', error);
    }
  }

  // Load users from localStorage
  loadFromLocalStorage() {
    try {
      const savedUsers = localStorage.getItem('users');
      return savedUsers ? JSON.parse(savedUsers) : null;
    } catch (error) {
      console.error('Error loading users from localStorage:', error);
      return null;
    }
  }

  // Subscribe to user service events
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners of changes
  notifyListeners(eventType, data, currentUsers) {
    this.listeners.forEach(listener => {
      try {
        listener(eventType, data, currentUsers);
      } catch (error) {
        console.error('Error in user service listener:', error);
      }
    });
  }

  // Force sync with backend
  async forceSync() {
    try {
      this.notifyListeners('sync_start', null, this.users);
      
      const response = await fetch(API_ENDPOINTS.users.list);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to sync users');
      }

      this.users = data.users;
      this.saveToLocalStorage();
      this.notifyListeners('sync_complete', null, this.users);
      
      return this.users;
    } catch (error) {
      console.error('Error syncing with backend:', error);
      this.notifyListeners('sync_error', error, this.users);
      throw error;
    }
  }
}

// Export singleton instance
const userService = new UserService();
export default userService; 