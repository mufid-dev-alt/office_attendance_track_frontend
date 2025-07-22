# Login Instructions for Office Attendance Management System

## Login Issue Fixed

The login issue has been fixed by updating the API URL in the development configuration to point to the Render backend instead of localhost.

## Default Login Credentials

### Admin Login
- **Email**: admin@company.com
- **Password**: admin123

### User Login
- **Email**: user1@company.com (or user2@company.com through user5@company.com)
- **Password**: user123

## How to Use

1. Start the frontend application with `npm run start`
2. Open your browser to http://localhost:3000
3. Select either "User Sign In" or "Admin Sign In" based on which credentials you want to use
4. Enter the appropriate email and password
5. Click "Sign In"

## Troubleshooting

If you encounter any issues:

1. Make sure the backend API is running and accessible
2. Check that the API URL in `src/config/config.js` is correctly set to `https://office-attendance-track-backend.onrender.com/api`
3. Verify that your `.env` file has `REACT_APP_API_URL=https://office-attendance-track-backend.onrender.com`
4. Clear your browser cache and cookies
5. Restart the frontend application