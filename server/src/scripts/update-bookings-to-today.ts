import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import ClassBooking from '../models/ClassBooking';
import AttendanceService from '../services/attendanceService';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function updateBookingsToToday() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || '');
        console.log('✅ Connected to database');

        // Get normalized today
        const normalizedToday = AttendanceService.getNormalizedToday();
        const normalizedEndOfDay = AttendanceService.getNormalizedEndOfDay();
        console.log('\n📅 Normalized Today:', normalizedToday);
        console.log('📅 Normalized End of Day:', normalizedEndOfDay);

        // Find all bookings for today
        const todayBookings = await ClassBooking.find({
            date: { $gte: normalizedToday, $lte: normalizedEndOfDay }
        });

        console.log(`\n📋 Current bookings for today: ${todayBookings.length}`);

        // Find all bookings that are before today
        const oldBookings = await ClassBooking.find({
            date: { $lt: normalizedToday }
        });

        console.log(`📋 Found ${oldBookings.length} old bookings (before today)`);

        if (oldBookings.length === 0) {
            console.log('✅ No old bookings to clean up.');
            return;
        }

        // Show some examples
        console.log('\nExample old bookings:');
        oldBookings.slice(0, 5).forEach((b, i) => {
            console.log(`  ${i + 1}. Date: ${b.date} - Class: ${b.classId} - Student: ${b.studentId}`);
        });

        // Delete all old bookings
        const deleteResult = await ClassBooking.deleteMany({
            date: { $lt: normalizedToday }
        });

        console.log(`\n✅ Deleted ${deleteResult.deletedCount} old bookings`);

        // Verify
        const updatedTodayBookings = await ClassBooking.find({
            date: normalizedToday
        });

        console.log(`\n📊 Total bookings for today now: ${updatedTodayBookings.length}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from database');
    }
}

updateBookingsToToday();
