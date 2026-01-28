
import mongoose from 'mongoose';
import ClassBooking from '../models/ClassBooking';
import Class from '../models/Class';
import dotenv from 'dotenv';
import path from 'path';

// Load env from root
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const checkBookings = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix';
        console.log('Connecting to:', uri);
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        console.log('\n--- MONDAY CLASSES (dayOfWeek: 1) ---');
        const mondayClasses = await Class.find({ dayOfWeek: 1, active: true });
        
        if (mondayClasses.length === 0) {
            console.log('No Monday classes found.');
        } else {
            for (const cls of mondayClasses) {
                console.log(`Class: ${cls.name} (${cls._id}) Time: ${cls.startTime}-${cls.endTime}`);
                
                // Find bookings for this class
                const bookings = await ClassBooking.find({ classId: cls._id }).sort({ date: -1 });
                if (bookings.length > 0) {
                    console.log(`  Found ${bookings.length} bookings:`);
                    bookings.forEach(b => {
                        console.log(`    - Date: ${b.date.toISOString()} | Status: ${b.status} | ID: ${b._id}`);
                    });
                } else {
                    console.log(`  No bookings.`);
                }
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Done');
    }
};

checkBookings();
