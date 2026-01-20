
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import ClassBooking from '../models/ClassBooking';
import Class from '../models/Class';
import Student from '../models/Student';
import Franchise from '../models/Franchise';
import Teacher from '../models/Teacher';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log('--- FORCE INJECT SPECIFIC CLASS ---');

        const targetClassId = '696ef2d74743599f3e055fd2'; // The ID from the logs
        const cls = await Class.findById(targetClassId);

        if (!cls) {
            console.error(`CRITICAL: Class ${targetClassId} NOT FOUND in Database!`);
            // If it's not found, the frontend is hallucinating or caching old data?
            process.exit(1);
        }

        console.log(`Found Class: ${cls.name}`);
        console.log(`ID: ${cls._id}`);
        console.log(`FranchiseId: ${cls.franchiseId}`);
        console.log(`TeacherId: ${cls.teacherId}`);
        console.log(`Active: ${cls.active}`);
        console.log(`DayOfWeek: ${cls.dayOfWeek}`);

        // Get meaningful names for context
        const franchise = await Franchise.findById(cls.franchiseId);
        console.log(`Franchise Name: ${franchise ? franchise.name : 'UNKNOWN'}`);
        
        const teacher = await Teacher.findById(cls.teacherId);
        console.log(`Teacher Name: ${teacher ? teacher.name : 'UNKNOWN'}`);

        // Get Students (Try from same Franchise first)
        let students = await Student.find({ franchiseId: cls.franchiseId });
        if (students.length < 5) {
            console.log('Fetching random students...');
            students = await Student.find().limit(50);
        }
        
        // Inject Bookings
        const now = new Date();
        const bookingDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0));
        
        // Clear first
        const dStart = new Date(bookingDate); dStart.setUTCHours(0,0,0,0);
        const dEnd = new Date(bookingDate); dEnd.setUTCHours(23,59,59,999);
        
        await ClassBooking.deleteMany({
            classId: cls._id,
            date: { $gte: dStart, $lte: dEnd }
        });

        // Add
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
        console.log(`SUCCESS: Injected ${added} bookings into ${cls.name} (${targetClassId})`);

        process.exit(0);

    } catch (e) {
        console.log(e);
        process.exit(1);
    }
};

run();
