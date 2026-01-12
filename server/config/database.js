const mongoose = require('mongoose');

/**
 * Connect to MongoDB Database
 * Supports both local MongoDB and MongoDB Atlas
 */
const connectDB = async () => {
    try {
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        const conn = await mongoose.connect(process.env.MONGODB_URI, options);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);

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
