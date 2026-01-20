
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Class from '../models/Class';
import Teacher from '../models/Teacher';
import Student from '../models/Student';
import ClassBooking from '../models/ClassBooking';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log('--- RESET ATTENDANCE DATA & FIX LIST ---');

        const teacher = await Teacher.findOne({ name: { $regex: 'Ricardo', $options: 'i' } });
        if (!teacher) throw new Error('Teacher Ricardo not found');
        console.log(`Teacher: ${teacher.name} | Franchise: ${teacher.franchiseId}`);

        // System Day (should be 2 for Tuesday)
        const dayOfWeek = (new Date()).getDay();
        console.log(`System DayOfWeek: ${dayOfWeek}`);

        // Find ALL Active Classes for today (Handling duplicates)
        const query = {
            franchiseId: teacher.franchiseId,
            dayOfWeek: dayOfWeek,
            active: true
        };
        
        const classes = await Class.find(query);
        console.log(`Found ${classes.length} Active Classes for Today.`);

        if (classes.length === 0) {
            console.log('No classes found for today? Checking all active...');
            const all = await Class.find({ franchiseId: teacher.franchiseId, active: true });
            console.log(`Fallback: Found ${all.length} total active classes (any day).`);
        }

        let students = await Student.find({ franchiseId: teacher.franchiseId });
        if (students.length < 5) {
            console.log('Few students in franchise, fetching randoms...');
            students = await Student.find().limit(50);
        }
        console.log(`Student Pool: ${students.length}`);

        // Set Date to Noon UTC Today (Safe for local/UTC conversion)
        const now = new Date();
        const bookingDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0));

        for (const cls of classes) {
            console.log(`Processing Class: ${cls.name} (${cls.startTime}) [${cls._id}]`);
            
            // 1. Delete Existing Bookings for Today (Clean Slate)
            const dStart = new Date(bookingDate); dStart.setUTCHours(0,0,0,0);
            const dEnd = new Date(bookingDate); dEnd.setUTCHours(23,59,59,999);
            
            await ClassBooking.deleteMany({
                classId: cls._id,
                date: { $gte: dStart, $lte: dEnd }
            });
            
            // 2. Inject 10 Bookings
            const count = 10;
            const subset = students.sort(() => 0.5 - Math.random()).slice(0, count);
            
            let added = 0;
            for (const s of subset) {
                await ClassBooking.create({
                    franchiseId: cls.franchiseId,
                    classId: cls._id,
                    studentId: s._id,
                    date: bookingDate,
                    status: 'reserved',
                    createdAt: new Date()
                });
                added++;
            }
            console.log(`   -> Injected ${added} bookings.`);
        }

        console.log('--- SUCCESS: List should now be visible ---');
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
