
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const ClassSchema = new mongoose.Schema({
    active: Boolean
}, { strict: false });

const BookingSchema = new mongoose.Schema({
    classId: mongoose.Schema.Types.ObjectId,
    status: String
}, { strict: false });

const Class = mongoose.model('Class', ClassSchema);
const ClassBooking = mongoose.model('ClassBooking', BookingSchema);

async function cleanOrphans() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI not found');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected. Scanning for orphan bookings...');

        // Get all inactive class IDs
        const inactiveClasses = await Class.find({ active: false }).select('_id');
        const inactiveIds = inactiveClasses.map(c => c._id);
        
        console.log(`Found ${inactiveIds.length} inactive classes.`);

        if (inactiveIds.length === 0) {
            console.log('No inactive classes found. Exiting.');
            process.exit();
        }

        // Count bookings for inactive classes
        const orphans = await ClassBooking.countDocuments({
            classId: { $in: inactiveIds },
            status: { $in: ['reserved', 'confirmed'] }
        });

        console.log(`Found ${orphans} active bookings pointing to INACTIVE classes.`);

        if (orphans > 0) {
            console.log('Deleting orphan bookings...');
            
            // Delete them
             const res = await ClassBooking.deleteMany({
                classId: { $in: inactiveIds },
                status: { $in: ['reserved', 'confirmed'] }
            });
            
            console.log(`Deleted ${res.deletedCount} orphan bookings.`);
        } else {
            console.log('No orphan bookings found to clean.');
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

cleanOrphans();
