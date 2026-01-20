
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import ClassBooking from '../models/ClassBooking';
import Class from '../models/Class';
import Student from '../models/Student';
import Teacher from '../models/Teacher';
import Franchise from '../models/Franchise';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

const inject = async () => {
    await connectDB();
    console.log('--- INJECTING TODAY BOOKINGS ---');

    // 1. Determine "Today" (Tuesday Jan 20 2026)
    // Local time is 2026-01-20.
    // In JS getDay(): Sunday=0, Monday=1, Tuesday=2.
    const now = new Date(); // Systems seems to be set to 2026-01-20
    const dayOfWeek = 2; // Fixed for Tuesday as per metadata
    
    // 2. Get All Franchises (to simulate real flow)
    const franchises = await Franchise.find({});
    
    for(const franchise of franchises) {
        console.log(`Processing Franchise: ${franchise.name}`);
        
        // Get Classes for Today (Tuesday)
        const classes = await Class.find({
            franchiseId: franchise._id,
            dayOfWeek: dayOfWeek,
            active: true
        });
        
        console.log(`Found ${classes.length} classes for Tuesday.`);
        
        // Get Students
        const students = await Student.find({ franchiseId: franchise._id }).limit(50);
        if(students.length === 0) continue;

        for(const cls of classes) {
            // Construct the exact Date object for this booking
            // Class Start Time is like "06:00" or "18:00"
            const [hours, mins] = cls.startTime.split(':').map(Number);
            
            // We need a Date object that corresponds to this time TODAY (SP Time)
            // Strategy: Create UTC date relative to SP Midnight
            // SP Midnight today is 2026-01-20T03:00:00Z
            
            // Let's rely on string construction to be safe with timezone
            const dateStr = `2026-01-20T${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:00.000-03:00`;
            const bookingDate = new Date(dateStr);
            
            // Randomly select 5-15 students
            const studentCount = Math.floor(Math.random() * 10) + 5;
            const shuffled = students.sort(() => 0.5 - Math.random()).slice(0, studentCount);
            
            let added = 0;
            for(const student of shuffled) {
                try {
                    await ClassBooking.create({
                        franchiseId: franchise._id,
                        classId: cls._id,
                        studentId: student._id,
                        date: bookingDate,
                        status: 'reserved' // or 'confirmed'
                    });
                    added++;
                } catch(e) {
                    // Ignore dupes
                }
            }
            console.log(`  -> Class ${cls.name} (${cls.startTime}): Added ${added} bookings.`);
        }
    }

    console.log('Injection Complete.');
    process.exit();
};

inject();
