
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const ClassSchema = new mongoose.Schema({
    name: String,
    dayOfWeek: Number,
    startTime: String,
    teacherId: mongoose.Schema.Types.ObjectId,
    franchiseId: mongoose.Schema.Types.ObjectId,
    active: Boolean
}, { strict: false });

const BookingSchema = new mongoose.Schema({
    classId: mongoose.Schema.Types.ObjectId,
    status: String,
    date: Date,
    studentId: mongoose.Schema.Types.ObjectId
}, { strict: false });

const Class = mongoose.model('Class', ClassSchema);
const ClassBooking = mongoose.model('ClassBooking', BookingSchema);

async function debugThursday() {
    try {
        if (!process.env.MONGODB_URI) { console.error('No URI'); process.exit(1); }
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('--- DEBUGGING THURSDAY 07:00 ---');

        // 1. Find ACTIVE classes on Day 4 @ 07:00
        const classes = await Class.find({
            dayOfWeek: 4,
            // startTime could be "07:00" or "7:00", checking regex
            startTime: /^0?7:00/,
            active: true
        }).lean();

        console.log(`Found ${classes.length} active classes for Thursday 07:00:`);
        classes.forEach(c => {
            console.log(`   [Class] ID: ${c._id} | Name: ${c.name}`);
        });

        // 2. Check bookings for these classes
        const classIds = classes.map(c => c._id);
        const bookings = await ClassBooking.find({
            classId: { $in: classIds },
            status: { $in: ['reserved', 'confirmed'] }
        }).lean();

        console.log(`\nFound ${bookings.length} bookings for these classes.`);
        bookings.forEach(b => {
             console.log(`   [Booking] ID: ${b._id} | Student: ${b.studentId} | Date: ${b.date} | Class: ${b.classId}`);
        });

        // 3. ANY OTHER BOOKING ON THURSDAY THAT MIGHT CONFLICT?
        // Let's check bookings for this student (assuming we can find student ID from one of the bookings above or we list all)
        // Since I don't know your Student ID, I will list ALL bookings for Thursday 07:00 regardless of class.
        
        // Actually, let's just dump bookings found in step 2 first.
        
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

debugThursday();
