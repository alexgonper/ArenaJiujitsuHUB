
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

const debugRicardo = async () => {
    await connectDB();
    console.log('--- DEBUG RICARDO MACHADO ---');

    // 1. Find Ricardo
    const teacher = await Teacher.findOne({ name: { $regex: 'Ricardo', $options: 'i' } });
    if (!teacher) {
        console.log('Ricardo not found!');
        // List all teachers
        const teachers = await Teacher.find({}, 'name');
        console.log('Available teachers:', teachers.map(t => t.name));
        process.exit();
    }
    console.log(`Found Teacher: ${teacher.name} (${teacher._id})`);
    console.log(`Franchise: ${teacher.franchiseId}`);

    // 2. Find his 15:00 class today (Tuesday = 2)
    // Note: The UI shows it's Tuesday (Ter).
    const cls = await Class.findOne({
        teacherId: teacher._id,
        startTime: '15:00',
        dayOfWeek: 2
    });

    if (!cls) {
        console.log('No 15:00 class found for Ricardo on Tuesday!');
        // List his classes
        const classes = await Class.find({ teacherId: teacher._id, dayOfWeek: 2 });
        console.log('His classes on Tuesday:', classes.map(c => `${c.name} (${c.startTime})`));
        process.exit();
    }
    console.log(`Found Class: ${cls.name} (${cls._id})`);

    // 3. Check Bookings for this class
    // We need to match the "Today" window used by the Controller
    // Controller uses:
    /*
        const startOfDay = AttendanceService.getNormalizedToday();
        const endOfDay = AttendanceService.getNormalizedEndOfDay();
    */
    // We need to replicate that logic to see if it matches.
    const now = new Date(); // This should be 2026-01-20
    console.log(`System Time: ${now.toISOString()}`);

    // Replicating AttendanceService.getNormalizedToday() logic roughly
    const formatter = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
    });
    const parts = formatter.formatToParts(now);
    const findPart = (type: string) => parts.find(p => p.type === type)?.value;
    const day = parseInt(findPart('day') || '1');
    const month = parseInt(findPart('month') || '1');
    const year = parseInt(findPart('year') || '2024');
    
    // Create Date in UTC
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCHours(23, 59, 59, 999);

    console.log(`Query Window: ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`);

    const bookings = await ClassBooking.find({
        classId: cls._id,
        date: { $gte: startOfDay, $lte: endOfDay }
    });

    console.log(`Bookings found: ${bookings.length}`);
    if (bookings.length > 0) {
        console.log('Sample Booking Date:', bookings[0].date.toISOString());
    } else {
         // Check if there are ANY bookings for this class
         const anyBooking = await ClassBooking.findOne({ classId: cls._id });
         if(anyBooking) {
             console.log('Found bookings for other dates:', anyBooking.date.toISOString());
         } else {
             console.log('No bookings at all for this class.');
         }
    }

    process.exit();
};

debugRicardo();
