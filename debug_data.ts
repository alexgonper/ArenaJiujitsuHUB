import mongoose from 'mongoose';
import Attendance from './server/src/models/Attendance';
import dotenv from 'dotenv';

dotenv.config();

async function checkData() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arenahub');
    console.log('Connected to DB');

    const total = await Attendance.countDocuments();
    console.log('Total Attendance Buckets:', total);

    const sample = await Attendance.findOne();
    console.log('Sample Bucket:', JSON.stringify(sample, null, 2));

    const withTenant = await Attendance.countDocuments({ tenantId: { $exists: true } });
    console.log('Buckets with tenantId:', withTenant);

    process.exit(0);
}

checkData();
