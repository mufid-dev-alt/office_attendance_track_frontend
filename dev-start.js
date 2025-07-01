#!/usr/bin/env node
/**
 * Development server startup script for Office Attendance Frontend
 */
const { spawn } = require('child_process');
const path = require('path');

function startServer() {
    console.log('🚀 Starting Office Attendance Frontend...');
    console.log('📍 Server will be available at: http://localhost:3000');
    console.log('⏹️  Press Ctrl+C to stop the server');
    console.log('-'.repeat(50));

    // Check if we're in the frontend directory
    if (!require('fs').existsSync('package.json')) {
        console.error('❌ Error: package.json not found. Make sure you\'re in the frontend directory.');
        process.exit(1);
    }

    // Start the React development server
    const child = spawn('npm', ['start'], {
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, PORT: '3000' }
    });

    child.on('error', (error) => {
        console.error(`❌ Error starting server: ${error.message}`);
        process.exit(1);
    });

    child.on('close', (code) => {
        console.log(`\n✅ Server stopped with code ${code}`);
    });

    // Handle process termination
    process.on('SIGINT', () => {
        console.log('\n✅ Server stopped successfully!');
        child.kill('SIGINT');
        process.exit(0);
    });
}

if (require.main === module) {
    startServer();
} 