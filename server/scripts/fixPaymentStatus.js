const mongoose = require('mongoose');
const Student = require('../models/Student');
require('dotenv').config({ path: '../.env' });

async function fixPayments() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log('✅ Connected');
        
        const res = await Student.updateMany({}, { $set: { paymentStatus: 'Paga' } });
        console.log(`✅ Updated ${res.modifiedCount} students to "Paga" status.`);
        
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

fixPayments();
