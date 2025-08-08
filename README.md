# Office Attendance Tracker Frontend

A modern React-based frontend application for tracking office attendance, managing todos, and providing administrative functions. This application provides a user-friendly interface for both regular users and administrators to manage attendance records and daily tasks.

## 🌐 Live Demo

**Frontend:** https://office-attendance-tracker-frontend.onrender.com  
**Backend:** https://office-attendance-tracker-backend.onrender.com

## 🚀 Features

### 👤 User Features
- **Authentication**: Secure login with role-based access control
- **Attendance Management**: Mark daily attendance (present/absent) with notes
- **Attendance History**: View personal attendance records with filtering by month/year
- **Attendance Statistics**: View attendance percentages and trends
- **Todo Management**: Create, edit, and delete personal todos
- **Real-time Updates**: All changes reflect immediately in the database
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 👨‍💼 Admin Features
- **User Management**: View all users, create new users, and manage user accounts
- **Attendance Oversight**: View and edit attendance records for all users
- **Todo Management**: Create, edit, and delete todos for any user
- **User Deletion**: Soft delete users with undo capability and permanent deletion
- **System Statistics**: Access comprehensive attendance and user statistics
- **Force Sync**: Synchronize attendance data across the system

## 🔐 User Credentials

The system comes pre-configured with the following test accounts:

### Admin Account
- **Email:** `admin@company.com`
- **Password:** `admin123`
- **Role:** Administrator
- **Permissions:** Full system access

### User Accounts
- **User 1:** `user1@company.com` / `user123`
- **User 2:** `user2@company.com` / `user123`
- **User 3:** `user3@company.com` / `user123`
- **User 4:** `user4@company.com` / `user123`
- **User 5:** `user5@company.com` / `user123`
- **Role:** Regular User
- **Permissions:** Personal attendance and todo management

## 📊 Data Models

### User Model
```typescript
interface User {
  id: number;
  email: string;
  full_name: string;
  role: "admin" | "user";
  created_at?: string;
}
```

### Attendance Model
```typescript
interface AttendanceRecord {
  id: number;
  user_id: number;
  status: "present" | "absent";
  date: string; // YYYY-MM-DD format
  notes?: string;
}
```

### Todo Model
```typescript
interface Todo {
  id: number;
  user_id: number;
  notes: string;
  date_created: string;
}
```

### Login Request Model
```typescript
interface LoginRequest {
  email: string;
  password: string;
  role: "admin" | "user";
}
```

## 🛠️ Technology Stack

- **Frontend Framework:** React 18
- **State Management:** React Hooks (useState, useEffect)
- **HTTP Client:** Fetch API
- **Styling:** CSS3 with modern design principles
- **Build Tool:** Vite
- **Deployment:** Render (Static Site)
- **Backend Integration:** FastAPI REST API
- **Database:** MongoDB Atlas

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/
│   │   └── Login.js          # Authentication component
│   ├── attendance/
│   │   └── AttendancePage.js # Attendance management
│   ├── todos/
│   │   └── TodoPage.js       # Todo management
│   ├── admin/
│   │   ├── AdminDashboard.js # Admin main dashboard
│   │   ├── ManageUsers.js    # User management
│   │   └── ManageAttendance.js # Attendance oversight
│   └── common/
│       ├── Header.js         # Navigation header
│       └── Loading.js        # Loading component
├── config/
│   ├── api.js               # API configuration
│   └── userService.js       # User management service
├── utils/
│   └── eventService.js      # Event broadcasting service
└── App.js                   # Main application component
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/office-attendance-tracker-frontend.git
   cd office-attendance-tracker-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_BASE_URL=https://office-attendance-tracker-backend.onrender.com
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔧 Configuration

### API Configuration
The application uses a centralized API configuration in `src/config/api.js`:

```javascript
const API_ENDPOINTS = {
  login: '/api/login',
  users: {
    list: '/api/users',
    create: '/api/users',
    delete: (id) => `/api/users/${id}`,
    // ... more endpoints
  },
  attendance: {
    list: '/api/attendance',
    create: '/api/attendance',
    stats: '/api/attendance/stats',
    sync: '/api/attendance/force-sync',
    // ... more endpoints
  },
  todos: {
    list: '/api/todos',
    create: '/api/todos',
    update: (id) => `/api/todos/${id}`,
    delete: (id) => `/api/todos/${id}`,
  }
};
```

### CORS Configuration
The frontend is configured to work with the backend's CORS settings, allowing cross-origin requests between the hosted frontend and backend.

## 📱 User Interface

### Login Page
- **Dual Login Sections**: Separate tabs for user and admin login
- **Pre-filled Credentials**: Test accounts are pre-filled for easy access
- **Role Validation**: Server-side validation prevents cross-role login attempts
- **Error Handling**: Clear error messages for authentication failures

### User Dashboard
- **Attendance Marking**: Simple present/absent toggle with date selection
- **Attendance History**: Calendar view with attendance status indicators
- **Statistics Panel**: Visual representation of attendance percentages
- **Todo List**: Personal todo management with add/edit/delete functionality

### Admin Dashboard
- **User Management**: Complete user lifecycle management
- **Attendance Oversight**: View and edit attendance for all users
- **System Statistics**: Comprehensive analytics and reporting
- **Force Sync**: Data synchronization tools

## 🔒 Security Features

- **Role-based Access Control**: Strict separation between user and admin functions
- **Server-side Validation**: All authentication and authorization handled on the backend
- **CORS Protection**: Properly configured cross-origin resource sharing
- **Input Validation**: Client-side and server-side input validation
- **Session Management**: Secure user session handling

## 🚀 Deployment

### Render Deployment
The application is deployed on Render as a Static Site:

1. **Build Command:** `npm run build`
2. **Publish Directory:** `dist`
3. **Environment Variables:** Configured in Render dashboard

### Environment Variables
- `VITE_API_BASE_URL`: Backend API URL
- `NODE_ENV`: Environment (production/development)

## 🔄 API Integration

The frontend communicates with the backend through RESTful API endpoints:

### Authentication
- `POST /api/login` - User authentication with role validation

### User Management
- `GET /api/users` - Retrieve all users
- `POST /api/users` - Create new user
- `DELETE /api/users/{id}` - Soft delete user
- `POST /api/users/{id}/undo` - Restore deleted user
- `POST /api/users/{id}/permanent-delete` - Permanently delete user

### Attendance Management
- `GET /api/attendance` - Retrieve attendance records
- `POST /api/attendance` - Create attendance record
- `DELETE /api/attendance/{id}` - Delete attendance record
- `GET /api/attendance/stats` - Get attendance statistics
- `POST /api/attendance/force-sync` - Synchronize attendance data

### Todo Management
- `GET /api/todos` - Retrieve todos
- `POST /api/todos` - Create todo
- `PUT /api/todos/{id}` - Update todo
- `DELETE /api/todos/{id}` - Delete todo

## 🐛 Troubleshooting

### Common Issues

1. **Login Fails with 404 Error**
   - Check if backend is running and accessible
   - Verify API base URL configuration
   - Ensure CORS is properly configured

2. **Attendance Not Saving**
   - Check network connectivity
   - Verify user authentication
   - Check browser console for errors

3. **Admin Features Not Available**
   - Ensure you're logged in as admin
   - Check role validation on backend
   - Clear browser cache and try again

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your environment variables.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the backend repository for API documentation

## 🔗 Related Repositories

- **Backend API:** [office-attendance-tracker-backend](https://github.com/your-username/office-attendance-tracker-backend)
- **Database:** MongoDB Atlas Cloud Database

---

**Built with ❤️ using React and FastAPI**