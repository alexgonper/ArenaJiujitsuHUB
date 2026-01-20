import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/database'; // No .js

// Import routes
import franchiseRoutes from './routes/franchiseRoutes';
import directiveRoutes from './routes/directiveRoutes';
import studentRoutes from './routes/studentRoutes';
import teacherRoutes from './routes/teacherRoutes';
import aiRoutes from './routes/aiRoutes';
import metricRoutes from './routes/metricRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import paymentRoutes from './routes/paymentRoutes';
import authRoutes from './routes/authRoutes';
import graduationRoutes from './routes/graduationRoutes';
import classRoutes from './routes/classRoutes';
import bookingRoutes from './routes/bookingRoutes';

// Initialize express app
const app = express();

// Connect to database
connectDB();

// ===== SECURITY MIDDLEWARE =====
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
    origin: '*',
    credentials: false,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// ===== PERFORMANCE MIDDLEWARE =====
app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req: Request, res: Response) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== LOGGING MIDDLEWARE =====
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        skip: (req: Request, res: Response) => res.statusCode < 400
    }));
}

// ===== CACHE MIDDLEWARE =====
// ===== CACHE MIDDLEWARE =====
app.use((req: Request, res: Response, next: NextFunction) => {
    // Disable cache for real-time endpoints
    if (req.method === 'GET' && 
        !req.path.includes('/health') && 
        !req.path.includes('/attendance') &&
        !req.path.includes('/dashboard')) {
        res.set('Cache-Control', 'public, max-age=300');
    } else {
        res.set('Cache-Control', 'no-store');
    }
    next();
});

// API prefix
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.status(200).json({
        success: true,
        message: 'Arena Jiu-Jitsu Hub API is running (TypeScript Edition)',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        memory: process.memoryUsage(),
        uptime: process.uptime()
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
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/graduation`, graduationRoutes);
app.use(`${API_PREFIX}/classes`, classRoutes);
app.use(`${API_PREFIX}/bookings`, bookingRoutes);

// Welcome route
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: '🥋 Welcome to Arena Jiu-Jitsu Hub API',
        version: '1.0.0 (TS)',
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
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
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
    console.log('🥋  ARENA JIU-JITSU HUB API SERVER (TS)');
    console.log('='.repeat(60));
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`📡 Listening on port ${PORT}`);
    console.log(`🌐 API Base URL: http://localhost:${PORT}${API_PREFIX}`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log('='.repeat(60) + '\n');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any) => {
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

export default app;
