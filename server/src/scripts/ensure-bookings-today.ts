import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Class from '../models/Class';
import Student from '../models/Student';
import ClassBooking from '../models/ClassBooking';
import AttendanceService from '../services/attendanceService';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function ensureBookingsForToday() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || '');
        console.log('✅ Connected to database');

        const today = AttendanceService.getNormalizedToday();
        const dayOfWeek = today.getDay();
        
        console.log('\n📅 Today:', today);
        console.log('📅 Day of week:', dayOfWeek);

        // Get all classes for today
        const classesToday = await Class.find({
            dayOfWeek: dayOfWeek
        });

        console.log(`\n🏫 Found ${classesToday.length} classes scheduled for today`);

        let totalCreated = 0;

        for (const cls of classesToday) {
            // Check existing bookings
            const existingCount = await ClassBooking.countDocuments({
                classId: cls._id,
                date: today
            });

            if (existingCount >= 5) {
                console.log(`✓ ${cls.name} (${cls.startTime}) - already has ${existingCount} bookings`);
                continue;
            }

            console.log(`\n⚠️  ${cls.name} (${cls.startTime}) - only ${existingCount} bookings, adding more...`);

            // Get students from the same franchise
            const students = await Student.find({
                franchiseId: cls.franchiseId
            }).limit(10);

            if (students.length === 0) {
                console.log(`  ❌ No students found for franchise ${cls.franchiseId}`);
                continue;
            }

            let created = 0;
            for (const student of students) {
                try {
                    await ClassBooking.create({
                        studentId: student._id,
                        classId: cls._id,
                        franchiseId: cls.franchiseId,
                        date: today,
                        status: 'reserved'
                    });
                    created++;
                } catch (error: any) {
                    // Skip duplicates
                    if (error.code !== 11000) {
                        console.error(`    Error: ${error.message}`);
                    }
                }
            }

            console.log(`  ✅ Created ${created} new bookings (total now: ${existingCount + created})`);
            totalCreated += created;
        }

        console.log(`\n✅ Total new bookings created: ${totalCreated}`);

        // Final stats
        const totalBookingsToday = await ClassBooking.countDocuments({
            date: today
        });

        console.log(`📊 Total bookings for today: ${totalBookingsToday}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from database');
    }
}

ensureBookingsForToday();
