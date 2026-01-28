
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const ClassSchema = new mongoose.Schema({
    name: String,
    dayOfWeek: Number,
    startTime: String,
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

async function deepScan() {
    try {
        if (!process.env.MONGODB_URI) { console.error('No URI'); process.exit(1); }
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('--- DEEP SCAN THURSDAY 07:00 ---');

        // The Official Class ID for Thursday 07:00 (from previous step)
        const officialId = '696ef2d74743599f3e056034';
        
        // Find bookings that have this CLASS ID
        const validBookings = await ClassBooking.countDocuments({ classId: officialId });
        console.log(`Official Class (${officialId}) has ${validBookings} bookings.`);

        // Find bookings that overlap in time but have DIFFERENT class ID
        // But bookings store DATE, not Time. We need to look up the class of every booking.
        
        // Let's iterate ALL bookings and check their class
        const allBookings = await ClassBooking.find({ status: { $in: ['reserved', 'confirmed'] } }).populate('classId');
        
        let conflictCount = 0;
        
        for (const b of allBookings) {
            if (!b.classId) continue; // Orphan with no class doc at all (should be impossible in mongoose populate unless strict)
            
            const cls = b.classId;
            if (cls.dayOfWeek === 4 && cls.startTime.startsWith('07:00')) {
                // It is a Thursday 07:00 booking.
                
                if (String(cls._id) !== officialId) {
                    console.log(`❌ CONFLICT FOUND! Booking ${b._id} is for Class ${cls._id} (${cls.name}) [Active: ${cls.active}]`);
                    conflictCount++;
                    
                    // IF IT IS AN INACTIVE CLASS, WE SHOULD DELETE IT (AGAIN?)
                    if (cls.active === false) {
                        console.log(`   -> Deleting booking ${b._id} for INACTIVE class...`);
                        await ClassBooking.deleteOne({ _id: b._id });
                    }
                }
            }
        }
        
        if (conflictCount === 0) {
            console.log('No conflicting bookings found for other classes on Thursday 07:00.');
        } else {
            console.log(`Cleaned up ${conflictCount} bad bookings.`);
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

deepScan();
