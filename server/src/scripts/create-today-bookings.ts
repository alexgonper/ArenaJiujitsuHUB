import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Class from '../models/Class';
import Student from '../models/Student';
import ClassBooking from '../models/ClassBooking';
import AttendanceService from '../services/attendanceService';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function createTodayBookings() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || '');
        console.log('✅ Connected to database');

        // Get normalized today
        const normalizedToday = AttendanceService.getNormalizedToday();
        const today = normalizedToday.getDay();
        
        console.log('\n📅 Today:', normalizedToday);
        console.log('📅 Day of week:', today);

        // Get all classes for today
        const classesToday = await Class.find({
            dayOfWeek: today,
            active: true
        });

        console.log(`\n🏫 Classes scheduled for today: ${classesToday.length}`);

        let totalBookingsCreated = 0;

        for (const cls of classesToday) {
            console.log(`\n--- Processing: ${cls.name} (${cls.startTime}) ---`);

            // Check if there are already bookings for this class today
            const existingBookings = await ClassBooking.countDocuments({
                classId: cls._id,
                date: normalizedToday
            });

            if (existingBookings > 0) {
                console.log(`  ⏭️  Skipping - already has ${existingBookings} bookings`);
                continue;
            }

            // Get students from the same franchise
            const students = await Student.find({
                franchiseId: cls.franchiseId,
                active: true
            }).limit(15); // Limit to 15 students per class

            console.log(`  👥 Found ${students.length} students`);

            // Create bookings for each student
            for (const student of students) {
                try {
                    await ClassBooking.create({
                        studentId: student._id,
                        classId: cls._id,
                        franchiseId: cls.franchiseId,
                        date: normalizedToday,
                        status: 'reserved'
                    });
                    totalBookingsCreated++;
                } catch (error: any) {
                    // Skip if duplicate
                    if (error.code !== 11000) {
                        console.error(`    ❌ Error creating booking for ${student.name}:`, error.message);
                    }
                }
            }

            console.log(`  ✅ Created ${students.length} bookings`);
        }

        console.log(`\n✅ Total bookings created: ${totalBookingsCreated}`);

        // Verify
        const totalTodayBookings = await ClassBooking.countDocuments({
            date: normalizedToday
        });

        console.log(`📊 Total bookings for today: ${totalTodayBookings}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from database');
    }
}

createTodayBookings();
