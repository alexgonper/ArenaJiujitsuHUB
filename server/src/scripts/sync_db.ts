
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Import all models
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

// Load environment variables from .env file for LOCAL connection
dotenv.config({ path: path.join(__dirname, '../../.env') });

const transformData = (docs: any[]) => {
    return docs.map(doc => {
        const obj = doc.toObject();
        delete obj._id; // Let Mongo generate new IDs? No, we want to KEEP IDs to maintain relationships.
        // If we keep IDs, we don't need to delete _id.
        // Mongoose inserts documents with _id if provided.
        // We should just pass the raw objects.
        return obj;
    });
};

const syncDatabase = async () => {
    const LOCAL_URI = process.env.MONGODB_URI;
    const REMOTE_URI = process.env.MONGODB_URI_REMOTE; // User must provide this

    if (!LOCAL_URI) {
        console.error('❌ MONGODB_URI (Local) is missing in .env');
        process.exit(1);
    }

    if (!REMOTE_URI) {
        console.error('❌ MONGODB_URI_REMOTE is missing. Please provide it as an environment variable.');
        console.error('Usage: MONGODB_URI_REMOTE="mongodb+srv://..." npx ts-node src/scripts/sync_db.ts');
        process.exit(1);
    }

    let backupData: any = {};

    try {
        // 1. Connect to LOCAL
        console.log('🔌 Connecting to LOCAL Database:', LOCAL_URI);
        await mongoose.connect(LOCAL_URI);
        console.log('✅ Connected to Local.');

        console.log('📥 Fetching data from Local...');
        
        backupData = {
            Attendance: await Attendance.find({}),
            Class: await Class.find({}),
            ClassBooking: await ClassBooking.find({}),
            ClassSession: await ClassSession.find({}),
            DailyMetric: await DailyMetric.find({}),
            DashboardLayout: await DashboardLayout.find({}),
            Directive: await Directive.find({}),
            Franchise: await Franchise.find({}),
            GraduationRule: await GraduationRule.find({}),
            Metric: await Metric.find({}),
            Payment: await Payment.find({}),
            Student: await Student.find({}),
            Teacher: await Teacher.find({})
        };

        const totalDocs = Object.values(backupData).reduce((acc: number, arr: any) => acc + arr.length, 0);
        console.log(`✅ Fetched ${totalDocs} documents from Local.`);
        
        await mongoose.disconnect();
        console.log('🔌 Disconnected from Local.');

    } catch (error) {
        console.error('❌ Error reading local DB:', error);
        process.exit(1);
    }

    try {
        // 2. Connect to REMOTE
        console.log('------------------------------------------------');
        console.log('🔌 Connecting to REMOTE Database...');
        // Mask the URI in logs
        // console.log('Remote URI:', REMOTE_URI); 
        await mongoose.connect(REMOTE_URI);
        console.log('✅ Connected to Remote.');

        console.log('🧹 Clearing REMOTE Database...');
        await Promise.all([
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
        console.log('✅ Remote Database Cleared.');

        console.log('📤 Uploading Data to Remote...');
        
        // We use insertMany with raw documents (mongoose documents converted to objects usually fine, 
        // but toObject() or lean() is safer if we want exact replica including IDs)
        // Since we fetched Mongoose Documents, we can pass them directly or clean them.
        // Let's rely on Mongoose to handle the _id preservation (it does by default for explicit _id).
        
        await Attendance.insertMany(backupData.Attendance);
        await Class.insertMany(backupData.Class);
        await ClassBooking.insertMany(backupData.ClassBooking);
        await ClassSession.insertMany(backupData.ClassSession);
        await DailyMetric.insertMany(backupData.DailyMetric);
        await DashboardLayout.insertMany(backupData.DashboardLayout);
        await Directive.insertMany(backupData.Directive);
        await Franchise.insertMany(backupData.Franchise);
        await GraduationRule.insertMany(backupData.GraduationRule);
        await Metric.insertMany(backupData.Metric);
        await Payment.insertMany(backupData.Payment);
        await Student.insertMany(backupData.Student);
        await Teacher.insertMany(backupData.Teacher);

        console.log('✅ Sync Complete! All data copied from Local to Remote.');

    } catch (error) {
        console.error('❌ Error writing to remote DB:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected.');
    }
};

syncDatabase();
