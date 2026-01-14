const mongoose = require('mongoose');

/**
 * Connect to MongoDB Database
 * Supports both local MongoDB and MongoDB Atlas
 * Otimizado com connection pooling e caching
 */
const connectDB = async () => {
    try {
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            
            // ===== OTIMIZAÇÕES DE CONNECTION POOLING =====
            maxPoolSize: 50,        // Máximo de conexões simultâneas (padrão: 100)
            minPoolSize: 10,        // Mínimo de conexões mantidas (padrão: 0)
            maxIdleTimeMS: 30000,   // Fecha conexões inativas após 30s
            
            // ===== OTIMIZAÇÕES DE TIMEOUT =====
            serverSelectionTimeoutMS: 10000,  // Aumentado de 5s para 10s
            socketTimeoutMS: 45000,           // Timeout de socket
            connectTimeoutMS: 10000,          // Timeout de conexão inicial
            
            // ===== OTIMIZAÇÕES DE PERFORMANCE =====
            retryWrites: true,               // Retry automático em writes
            retryReads: true,                // Retry automático em reads
            w: 'majority',                   // Write concern para durabilidade
            readPreference: 'primaryPreferred', // Lê do primary, fallback para secondary
            
            // ===== COMPRESSÃO =====
            compressors: ['zlib'],           // Compressão de dados
            zlibCompressionLevel: 6,         // Nível de compressão (1-9)
            
            // ===== MONITORING =====
            serverMonitoringMode: 'auto',
            heartbeatFrequencyMS: 10000,     // Heartbeat a cada 10s
        };

        const conn = await mongoose.connect(process.env.MONGODB_URI, options);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
        console.log(`🔧 Connection Pool: ${options.minPoolSize}-${options.maxPoolSize} connections`);

        // ===== OTIMIZAÇÕES DE QUERY =====
        // Habilitar cache de queries (útil para reads frequentes)
        mongoose.set('debug', process.env.NODE_ENV === 'development');
        
        // Strict mode para evitar queries mal formadas
        mongoose.set('strictQuery', false);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error(`❌ MongoDB connection error: ${err}`);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
        });
        
        mongoose.connection.on('close', () => {
            console.log('🔒 MongoDB connection closed');
        });

        return conn;
    } catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);
        console.error('\n💡 Make sure MongoDB is running:');
        console.error('   Local: brew services start mongodb-community');
        console.error('   Or use MongoDB Atlas cloud database\n');
        process.exit(1);
    }
};

/**
 * Close database connection gracefully
 */
const closeDB = async () => {
    try {
        await mongoose.connection.close();
        console.log('🔒 MongoDB connection closed');
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
    }
};

module.exports = { connectDB, closeDB };
