import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Class from '../models/Class';
import Student from '../models/Student';
import ClassBooking from '../models/ClassBooking';
import AttendanceService from '../services/attendanceService';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const CLASS_ID = '696ef2d74743599f3e055f32'; // Jiu Jitsu Despertar 06:00

async function createBookingsForClass() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || '');
        console.log('✅ Connected to database');

        const today = AttendanceService.getNormalizedToday();
        console.log('📅 Today:', today);

        const cls = await Class.findById(CLASS_ID);
        if (!cls) {
            console.log('❌ Class not found');
            return;
        }

        console.log(`\n🏫 Class: ${cls.name} (${cls.startTime})`);

        const students = await Student.find({
            franchiseId: cls.franchiseId
        }).limit(10);

        console.log(`👥 Found ${students.length} students`);

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
                console.log(`  ✅ Created booking for ${student.name}`);
                created++;
            } catch (error: any) {
                if (error.code !== 11000) {
                    console.error(`  ❌ Error for ${student.name}:`, error.message);
                }
            }
        }

        console.log(`\n✅ Created ${created} bookings`);

        const count = await ClassBooking.countDocuments({
            classId: cls._id,
            date: today
        });
        console.log(`📊 Total bookings for this class today: ${count}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from database');
    }
}

createBookingsForClass();
