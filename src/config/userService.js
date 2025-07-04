import API_ENDPOINTS from './api';
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
        this.notifyListeners('init_from_local');
      }

      // Then fetch from server
      const serverUsers = await this.fetchFromServer();
      
      // If server has fewer users than localStorage and only default users,
      // it likely means the server has reset, so we'll use localStorage data
      if (serverUsers && serverUsers.length <= 5 && savedUsers && savedUsers.length > serverUsers.length) {
        console.log('⚠️ Server reset detected! Using localStorage backup');
        this.backendResetDetected = true;
        // Broadcast backend reset detected event
        eventService.backendResetDetected();
        // Push our saved users to the server
        this.syncToServer(savedUsers);
      } else if (serverUsers) {
        // Otherwise use server data and update localStorage
        this.users = serverUsers;
        this.saveToLocalStorage(serverUsers);
        this.backendResetDetected = false;
      }
      
      this.initialized = true;
      this.notifyListeners('init_complete');
      return this.users;
    } catch (error) {
      console.error('Error initializing user service:', error);
      // Fall back to localStorage if server fails
      const savedUsers = this.loadFromLocalStorage();
      if (savedUsers) {
        this.users = savedUsers;
        this.notifyListeners('init_fallback');
        return savedUsers;
      }
      return [];
    }
  }

  // Fetch users from server
  async fetchFromServer() {
    const response = await fetch(API_ENDPOINTS.users.list);
    if (response.ok) {
      const data = await response.json();
      const nonAdminUsers = data.filter(user => user.role !== 'admin');
      return nonAdminUsers;
    }
    throw new Error('Failed to fetch users from server');
  }

  // Sync local users to server (for when server resets)
  async syncToServer(usersList) {
    console.log('🔄 Syncing users to server:', usersList.length);
    
    // For each user that doesn't exist on server, recreate them
    for (const user of usersList) {
      try {
        // Check if user exists on server
        const checkResponse = await fetch(API_ENDPOINTS.users.get(user.id));
        if (!checkResponse.ok) {
          // User doesn't exist, recreate them
          await fetch(API_ENDPOINTS.users.create, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              password: 'password123', // Default password
              full_name: user.full_name,
              role: user.role || 'user'
            })
          });
          console.log(`✅ Recreated user: ${user.full_name}`);
        }
      } catch (error) {
        console.error(`Error syncing user ${user.id}:`, error);
      }
    }
    
    // Refresh users from server after sync
    this.users = await this.fetchFromServer();
    this.notifyListeners('sync_complete');
    return this.users;
  }

  // Load users from localStorage
  loadFromLocalStorage() {
    try {
      const savedUsers = localStorage.getItem('persistentUsers');
      if (savedUsers) {
        const parsedUsers = JSON.parse(savedUsers);
        console.log(`📂 Loaded ${parsedUsers.length} users from localStorage`);
        return parsedUsers;
      }
    } catch (error) {
      console.error('Error loading users from localStorage:', error);
    }
    return null;
  }

  // Save users to localStorage
  saveToLocalStorage(usersList) {
    try {
      localStorage.setItem('persistentUsers', JSON.stringify(usersList));
      console.log(`💾 Saved ${usersList.length} users to localStorage`);
    } catch (error) {
      console.error('Error saving users to localStorage:', error);
    }
  }

  // Get all users (initializes if needed)
  async getUsers() {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.users;
  }

  // Add a new user
  async addUser(userData) {
    try {
      const response = await fetch(API_ENDPOINTS.users.create, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const newUser = await response.json();
        this.users = [...this.users, newUser];
        this.saveToLocalStorage(this.users);
        this.notifyListeners('user_added', newUser);
        return newUser;
      } else {
        throw new Error('Failed to add user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  }

  // Delete a user
  async deleteUser(userId) {
    try {
      const response = await fetch(API_ENDPOINTS.users.delete(userId), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        const deletedUser = this.users.find(u => u.id === userId);
        this.users = this.users.filter(user => user.id !== userId);
        this.saveToLocalStorage(this.users);
        this.notifyListeners('user_deleted', deletedUser);
        return result;
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Restore a deleted user
  async restoreUser(userId) {
    try {
      const response = await fetch(API_ENDPOINTS.users.undo(userId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        const restoredUser = result.restored_user;
        this.users = [...this.users, restoredUser];
        this.saveToLocalStorage(this.users);
        this.notifyListeners('user_restored', restoredUser);
        return result;
      } else {
        throw new Error('Failed to restore user');
      }
    } catch (error) {
      console.error('Error restoring user:', error);
      throw error;
    }
  }

  // Subscribe to user changes
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners of changes
  notifyListeners(eventType, data) {
    this.listeners.forEach(listener => {
      try {
        listener(eventType, data, this.users);
      } catch (error) {
        console.error('Error in user service listener:', error);
      }
    });
    
    // Also broadcast via localStorage for cross-tab communication
    localStorage.setItem('userServiceUpdate', JSON.stringify({
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    }));
    
    // Broadcast via eventService for real-time updates
    switch (eventType) {
      case 'user_added':
        eventService.userAdded(data);
        break;
      case 'user_deleted':
        eventService.userDeleted(data?.id);
        break;
      case 'user_restored':
        eventService.userRestored(data);
        break;
      case 'sync_complete':
        eventService.broadcast('users_synced', { count: this.users.length });
        break;
      default:
        break;
    }
  }
  
  // Check if backend reset was detected
  isBackendResetDetected() {
    return this.backendResetDetected;
  }
}

// Create a singleton instance
const userService = new UserService();

export default userService; 