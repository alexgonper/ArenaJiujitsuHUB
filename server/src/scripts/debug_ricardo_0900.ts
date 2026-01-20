
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import ClassBooking from '../models/ClassBooking';
import Class from '../models/Class';
import Teacher from '../models/Teacher';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log(`MongoDB Connected`);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

const debugRicardo0900 = async () => {
    await connectDB();
    console.log('--- DEBUG RICARDO - 09:00 CLASS ---');

    const teacher = await Teacher.findOne({ name: { $regex: 'Ricardo', $options: 'i' } });
    if (!teacher) process.exit();
    console.log(`Teacher: ${teacher.name}`);

    // Find 09:00 class Today (Tuesday)
    const cls = await Class.findOne({
        teacherId: teacher._id,
        startTime: '09:00',
        dayOfWeek: 2
    });

    if (!cls) {
        console.log('No 09:00 class found!');
        process.exit();
    }
    console.log(`Class: ${cls.name} (${cls._id})`);

    // Check Bookings
    const startOfDay = new Date('2026-01-20T00:00:00.000Z');
    const endOfDay = new Date('2026-01-20T23:59:59.999Z');

    const bookings = await ClassBooking.find({
        classId: cls._id,
        date: { $gte: startOfDay, $lte: endOfDay }
    });
    
    console.log(`Bookings for 09:00: ${bookings.length}`);
    process.exit();
};

debugRicardo0900();
