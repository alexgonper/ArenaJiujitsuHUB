require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');

const fixStatuses = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log('✅ Connected to MongoDB');

        // Update all 'Pendente' to 'Atrasada'
        const result = await Student.updateMany(
            { paymentStatus: 'Pendente' },
            { $set: { paymentStatus: 'Atrasada' } }
        );

        console.log(`✅ Fixed ${result.modifiedCount} students with 'Pendente' status.`);
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

fixStatuses();
