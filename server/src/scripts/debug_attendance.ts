
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import ClassBooking from '../models/ClassBooking';
import Class from '../models/Class';
import Attendance from '../models/Attendance';
import Student from '../models/Student';
import Teacher from '../models/Teacher';

// Load env vars
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

const debug = async () => {
    await connectDB();

    console.log('\n--- DEBUGGING ATTENDANCE ---\n');

    // 1. Get a teacher
    const teacher = await Teacher.findOne();
    if (!teacher) {
        console.log('No teachers found!');
        process.exit();
    }
    console.log(`Teacher: ${teacher.name} (${teacher._id})`);

    // 2. Get Today's Classes for this teacher
    // We need to replicate the controller logic for "Today"
    const now = new Date();
    // Simple UTC bounds for "Now" as local day might be tricky, let's just look for *any* class today
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date();
    endOfDay.setHours(23,59,59,999);
    
    console.log(`Querying for date range: ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`);

    const classes = await Class.find({
       // teacherId: teacher._id 
       // Just find *any* class to be safe
    });
    
    console.log(`Total Classes in DB: ${classes.length}`);
    
    // Filter for today manually to see what's up
    const todayClasses = classes.filter(c => {
        // This is tricky without dayOfWeek logic, but let's check bookings
        return true;
    });

    // 3. Check Bookings
    const bookings = await ClassBooking.find({});
    console.log(`Total Bookings in DB: ${bookings.length}`);
    
    // Check Bookings for today
    const bookingsToday = await ClassBooking.find({
        date: { $gte: startOfDay, $lte: endOfDay }
    });
    console.log(`Bookings strictly for TODAY (${startOfDay.toISOString()} to ${endOfDay.toISOString()}): ${bookingsToday.length}`);
    
    if(bookingsToday.length > 0) {
        console.log('Sample Booking:', JSON.stringify(bookingsToday[0], null, 2));
    } else {
        // Check surrounding days
        const yesterday = new Date(startOfDay); yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(startOfDay); tomorrow.setDate(tomorrow.getDate() + 1);
        
        const nearby = await ClassBooking.find({
            date: { $gte: yesterday, $lte: tomorrow }
        });
        console.log(`Bookings Yesterday/Tomorrow: ${nearby.length}`);
        if(nearby.length > 0) console.log('Nearby Sample:', nearby[0].date);
        
        // Maybe the Seed script puts them 1 week out?
        const all = await ClassBooking.find().sort({date: 1}).limit(1);
        const allLast = await ClassBooking.find().sort({date: -1}).limit(1);
        if(all.length) console.log(`First Booking Date: ${all[0].date}`);
        if(allLast.length) console.log(`Last Booking Date: ${allLast[0].date}`);
    }

    // 4. Check Attendance
    const att = await Attendance.find({});
    console.log(`Total Attendance Buckets: ${att.length}`);

    process.exit();
};

debug();
