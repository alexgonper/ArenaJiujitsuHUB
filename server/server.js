require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/database');

// Import routes
const franchiseRoutes = require('./routes/franchiseRoutes');
const directiveRoutes = require('./routes/directiveRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const aiRoutes = require('./routes/aiRoutes');
const metricRoutes = require('./routes/metricRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Security middleware
// app.use(helmet());

// CORS configuration
const corsOptions = {
    origin: '*',
    credentials: false, // Credentials cannot be true when origin is *
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
/*
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);
*/

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression
// app.use(compression());

// Logging (only in development)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// API prefix
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Arena Jiu-Jitsu Hub API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// API routes
app.use(`${API_PREFIX}/franchises`, franchiseRoutes);
app.use(`${API_PREFIX}/directives`, directiveRoutes);
app.use(`${API_PREFIX}/students`, studentRoutes);
app.use(`${API_PREFIX}/teachers`, teacherRoutes);
app.use(`${API_PREFIX}/ai`, aiRoutes);
app.use(`${API_PREFIX}/metrics`, metricRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);


// Welcome route
app.get('/', (req, res) => {
    res.json({
        message: '🥋 Welcome to Arena Jiu-Jitsu Hub API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            franchises: `${API_PREFIX}/franchises`,
            directives: `${API_PREFIX}/directives`,
            students: `${API_PREFIX}/students`,
            teachers: `${API_PREFIX}/teachers`,
            docs: 'See README.md for complete API documentation'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);

    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🥋  ARENA JIU-JITSU HUB API SERVER');
    console.log('='.repeat(60));
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`📡 Listening on port ${PORT}`);
    console.log(`🌐 API Base URL: http://localhost:${PORT}${API_PREFIX}`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log('='.repeat(60) + '\n');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

module.exports = app;
