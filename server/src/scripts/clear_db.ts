
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import all models to ensure they are registered and we can clear them
import Attendance from '../models/Attendance';
import Class from '../models/Class';
import ClassBooking from '../models/ClassBooking';
import ClassSession from '../models/ClassSession';
import DailyMetric from '../models/DailyMetric';
import DashboardLayout from '../models/DashboardLayout';
import Directive from '../models/Directive';
import Franchise from '../models/Franchise';
import GraduationRule from '../models/GraduationRule';
import Metric from '../models/Metric';
import Payment from '../models/Payment';
import Student from '../models/Student';
import Teacher from '../models/Teacher';

const clearDatabase = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected.');

        console.log('🧹 Starting full database cleanup...');

        const results = await Promise.all([
            Attendance.deleteMany({}),
            Class.deleteMany({}),
            ClassBooking.deleteMany({}),
            ClassSession.deleteMany({}),
            DailyMetric.deleteMany({}),
            DashboardLayout.deleteMany({}),
            Directive.deleteMany({}),
            Franchise.deleteMany({}),
            GraduationRule.deleteMany({}),
            Metric.deleteMany({}),
            Payment.deleteMany({}),
            Student.deleteMany({}),
            Teacher.deleteMany({})
        ]);

        console.log('✅ All collections cleared.');
        console.log(`- Total operations: ${results.length}`);

        console.log('✅ All data has been deleted successfully.');

    } catch (error) {
        console.error('❌ Error clearing database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
};

clearDatabase();
