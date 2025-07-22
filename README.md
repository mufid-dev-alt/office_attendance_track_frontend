# Office Attendance Tracker Frontend

React frontend for Office Attendance Tracker application.

## Deployment

This application is configured for deployment on Render.

### Environment Variables

Set the following environment variables in your Render project settings:

```
REACT_APP_API_URL=https://office-attendance-track-backend.onrender.com
NODE_ENV=production
```

### Deployment Instructions

1. Create a new Static Site on Render
2. Connect your GitHub repository
3. Use the following settings:
   - Build Command: `npm install && npm run build`
   - Publish Directory: `build`

## Features

- User management
- Attendance tracking
- Todo management
- Admin dashboard