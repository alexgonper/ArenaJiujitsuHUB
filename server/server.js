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
const paymentRoutes = require('./routes/paymentRoutes');
const authRoutes = require('./routes/authRoutes');
const graduationRoutes = require('./routes/graduationRoutes');
const classRoutes = require('./routes/classRoutes');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// ===== SECURITY MIDDLEWARE =====
// Helmet adiciona headers de segurança
app.use(helmet({
    contentSecurityPolicy: false, // Desabilitar se causar problemas com CORS
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

// Compression - comprime respostas (economiza banda)
app.use(compression({
    level: 6, // Nível de compressão (1-9)
    threshold: 1024, // Apenas para respostas > 1KB
    filter: (req, res) => {
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
// Logging otimizado (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    // Em produção, log apenas erros
    app.use(morgan('combined', {
        skip: (req, res) => res.statusCode < 400
    }));
}

// ===== CACHE MIDDLEWARE =====
// Adiciona headers de cache para rotas estáticas e de leitura
app.use((req, res, next) => {
    // Cache para GET requests (exceto /health)
    if (req.method === 'GET' && !req.path.includes('/health')) {
        res.set('Cache-Control', 'public, max-age=300'); // 5 minutos
    } else {
        res.set('Cache-Control', 'no-store');
    }
    next();
});

// API prefix
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// Health check endpoint (sem cache)
app.get('/health', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.status(200).json({
        success: true,
        message: 'Arena Jiu-Jitsu Hub API is running',
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
app.use(`${API_PREFIX}/bookings`, require('./routes/bookingRoutes'));


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
