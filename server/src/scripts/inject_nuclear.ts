
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import ClassBooking from '../models/ClassBooking';
import Class from '../models/Class';
import Student from '../models/Student';
import Teacher from '../models/Teacher';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log('--- INJECT BOOKINGS INTO ALL CLASSES (NUCLEAR OPTION) ---');

        const teacher = await Teacher.findOne({ name: { $regex: 'Ricardo', $options: 'i' } });
        if (!teacher) throw new Error('Teacher Ricardo not found');
        
        console.log(`Teacher Franchise: ${teacher.franchiseId}`);

        // Find ALL active classes for this franchise, ignoring Day of Week
        const classes = await Class.find({ 
            franchiseId: teacher.franchiseId,
            active: true
        });

        console.log(`Found ${classes.length} Total Active Classes.`);

        // Get Students
        let students = await Student.find({ franchiseId: teacher.franchiseId });
        if (students.length < 5) students = await Student.find().limit(50);
        
        // Date: Noon UTC Today
        const now = new Date();
        const bookingDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0));
        
        const rangeStart = new Date(bookingDate); rangeStart.setUTCHours(0,0,0,0);
        const rangeEnd = new Date(bookingDate); rangeEnd.setUTCHours(23,59,59,999);

        let totalInjected = 0;

        for (const cls of classes) {
            // Delete existing for today
            await ClassBooking.deleteMany({
                classId: cls._id,
                date: { $gte: rangeStart, $lte: rangeEnd }
            });

            // Inject 8-12 bookings
            const count = 8 + Math.floor(Math.random() * 5);
            const subset = students.sort(() => 0.5 - Math.random()).slice(0, count);

            for (const s of subset) {
                await ClassBooking.create({
                    franchiseId: cls.franchiseId,
                    classId: cls._id,
                    studentId: s._id,
                    date: bookingDate,
                    status: 'reserved',
                    createdAt: new Date()
                });
            }
            totalInjected += count;
            // console.log(`  -> ${cls.name} (${cls.dayOfWeek}): +${count}`); 
        }

        console.log(`SUCCESS: Injected ${totalInjected} bookings across ${classes.length} classes.`);
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
