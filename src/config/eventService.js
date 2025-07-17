// Event Service - Centralized event system for real-time updates across components
class EventService {
  constructor() {
    this.sessionId = Date.now().toString();
    console.log('🔄 Event service initialized with session ID:', this.sessionId);
  }

  // Broadcast an event to all components
  broadcast(eventType, data) {
    try {
      localStorage.setItem('appEvent', JSON.stringify({
        type: eventType,
        data,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId
      }));
      console.log(`📢 Broadcasting event: ${eventType}`);
    } catch (error) {
      console.error('Error broadcasting event:', error);
    }
  }

  // Listen for events
  listen(callback) {
    const handleStorageChange = (e) => {
      if (e.key === 'appEvent') {
        try {
          const event = JSON.parse(e.newValue);
          // Only process events from other tabs/components
          if (event && event.sessionId !== this.sessionId) {
            callback(event.type, event.data);
          }
        } catch (error) {
          console.error('Error processing event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }

  // Broadcast user added event
  userAdded(userData) {
    this.broadcast('user_added', userData);
  }

  // Broadcast user deleted event
  userDeleted(userId) {
    this.broadcast('user_deleted', { userId });
  }

  // Broadcast user restored event
  userRestored(userData) {
    this.broadcast('user_restored', userData);
  }

  // Broadcast attendance updated event
  attendanceUpdated(userId, date, status) {
    this.broadcast('attendance_updated', { userId, date, status });
  }

  // Broadcast todo added event
  todoAdded(userId, todoData) {
    this.broadcast('todo_added', { userId, todoData });
  }

  // Broadcast todo updated event
  todoUpdated(userId, todoData) {
    this.broadcast('todo_updated', { userId, todoData });
  }

  // Broadcast todo deleted event
  todoDeleted(userId, todoId) {
    this.broadcast('todo_deleted', { userId, todoId });
  }

  // Broadcast backend reset detected event
  backendResetDetected() {
    this.broadcast('backend_reset_detected', { timestamp: new Date().toISOString() });
  }
}

// Create a singleton instance
const eventService = new EventService();

export default eventService; 