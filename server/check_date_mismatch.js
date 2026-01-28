
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

async function checkMismatch() {
    try {
        if (!process.env.MONGODB_URI) { console.error('No URI'); process.exit(1); }
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('Checking for Booking Date mismatches...');

        const bookings = await ClassBooking.find({ status: { $in: ['reserved', 'confirmed'] } }).populate('classId');
        
        let badCount = 0;

        for (const b of bookings) {
            if (!b.classId) continue;
            
            const cls = b.classId;
            const bDate = new Date(b.date);
            const bDay = bDate.getUTCDay(); // 0-6 (Sun-Sat)
            
            // Note: date is usually UTC 00:00. 
            // If class.dayOfWeek is 1 (Mon), bDay should be 1.
            
            // Adjust for TZ if needed, but usually we store UTC dates aligned.
            // Let's assume strict match for now.
            
            // Check if day matches
            if (bDay !== cls.dayOfWeek) {
                 // Try to be lenient: maybe it's timezone shift?
                 // If bDate is Tue Jan 20, getUTCDay is 2. Class should be 2.
                 
                 console.log(`⚠️ MISMATCH: Booking ${b._id} is on Day ${bDay} (${bDate.toISOString()}), but Class ${cls._id} (${cls.name}) is Day ${cls.dayOfWeek}`);
                 
                 // If mismatch is real (e.g. Day 4 vs Day 1), this is a corruption.
                 // Specifically, we suspect bookings on Thursday (4) pointing to Monday class (1).
                 
                 if (bDay === 4 && cls.dayOfWeek !== 4) {
                     console.log(`   !!! THURSDAY CORRUPTION FOUND !!! Pointing to ${cls.name} (Day ${cls.dayOfWeek})`);
                     
                     // DELETE THIS BAD BOOKING
                     console.log('   -> Deleting bad booking...');
                     await ClassBooking.deleteOne({ _id: b._id });
                     badCount++;
                 }
            }
        }
        
        console.log(`Fixed ${badCount} bookings with date mismatch.`);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkMismatch();
