import mongoose, { ConnectOptions } from 'mongoose';

/**
 * Connect to MongoDB Database
 * Supports both local MongoDB and MongoDB Atlas
 * Otimizado com connection pooling e caching
 */
export const connectDB = async (): Promise<typeof mongoose | undefined> => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        const options = {
            // ===== OTIMIZAÇÕES DE CONNECTION POOLING =====
            maxPoolSize: 50,        // Máximo de conexões simultâneas
            minPoolSize: 10,        // Mínimo de conexões mantidas
            maxIdleTimeMS: 30000,   // Fecha conexões inativas após 30s
            
            // ===== OTIMIZAÇÕES DE TIMEOUT =====
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            
            // ===== OTIMIZAÇÕES DE PERFORMANCE =====
            retryWrites: true,
            retryReads: true,
            // w: 'majority', 
            // readPreference: 'primaryPreferred',
            
            // ===== COMPRESSÃO =====
            compressors: ['zlib'],
            zlibCompressionLevel: 6,
        };

        const conn = await mongoose.connect(mongoUri, options as ConnectOptions);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
        console.log(`🔧 Connection Pool: 10-50 connections`);

        // ===== OTIMIZAÇÕES DE QUERY =====
        mongoose.set('debug', process.env.NODE_ENV === 'development');
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
    } catch (error: any) {
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
export const closeDB = async (): Promise<void> => {
    try {
        await mongoose.connection.close();
        console.log('🔒 MongoDB connection closed');
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
    }
};
