
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
    studentId: mongoose.Schema.Types.ObjectId
}, { strict: false });

const StudentSchema = new mongoose.Schema({
    name: String
}, { strict: false });

const Class = mongoose.model('Class', ClassSchema);
const ClassBooking = mongoose.model('ClassBooking', BookingSchema);
const Student = mongoose.model('Student', StudentSchema);

async function debugTarget() {
    try {
        if (!process.env.MONGODB_URI) { console.error('No URI'); process.exit(1); }
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('--- DEBUG JIU JITSU GERAL 08:00 ---');

        // Check Wednesday (3) and Thursday (4)
        for (const day of [3, 4]) {
            console.log(`\nChecking Day ${day}...`);
            const classes = await Class.find({
                dayOfWeek: day,
                startTime: /^0?8:00/,
                name: /Geral/i,
                active: true
            }).lean();

            console.log(`Found ${classes.length} active classes.`);
            
            for (const cls of classes) {
                console.log(`   [Class] ${cls._id} (${cls.name})`);
                
                const bookings = await ClassBooking.find({
                    classId: cls._id,
                    status: { $in: ['reserved', 'confirmed'] }
                });
                
                console.log(`   Bookings found: ${bookings.length}`);
                
                let nullStudentCount = 0;
                let validCount = 0;
                
                for (const b of bookings) {
                    const student = await Student.findById(b.studentId);
                    if (!student) {
                        // console.log(`      ⚠️ ORPHAN BOOKING! Student ${b.studentId} not found.`);
                        nullStudentCount++;
                    } else {
                        validCount++;
                    }
                }
                
                console.log(`      Valid Students: ${validCount}`);
                console.log(`      Orphan Bookings: ${nullStudentCount}`);
            }
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

debugTarget();
