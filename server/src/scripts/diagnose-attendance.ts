import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Class from '../models/Class';
import ClassBooking from '../models/ClassBooking';
import Attendance from '../models/Attendance';
import AttendanceService from '../services/attendanceService';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function diagnoseAttendance() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || '');
        console.log('✅ Connected to database');

        // Get today's date info
        const normalizedToday = AttendanceService.getNormalizedToday();
        const normalizedEndOfDay = AttendanceService.getNormalizedEndOfDay();
        const queryWindow = AttendanceService.getDailyQueryWindow();
        
        console.log('\n📅 Date Information:');
        console.log('Normalized Today:', normalizedToday);
        console.log('Normalized End of Day:', normalizedEndOfDay);
        console.log('Query Window Start:', queryWindow.start);
        console.log('Query Window End:', queryWindow.end);
        console.log('Current Day of Week:', normalizedToday.getDay());

        // Get all classes for today
        const today = normalizedToday.getDay();
        const classesToday = await Class.find({
            dayOfWeek: today,
            active: true
        });

        console.log(`\n🏫 Classes scheduled for today (day ${today}): ${classesToday.length}`);
        
        for (const cls of classesToday) {
            console.log(`\n--- Class: ${cls.name} (${cls.startTime}) ---`);
            console.log(`ID: ${cls._id}`);

            // Check bookings for this class
            const bookings = await ClassBooking.find({
                classId: cls._id,
                date: { $gte: normalizedToday, $lte: normalizedEndOfDay },
                status: { $in: ['reserved', 'confirmed'] }
            });

            console.log(`📋 Bookings: ${bookings.length}`);
            bookings.forEach((b, i) => {
                console.log(`  ${i + 1}. Student ID: ${b.studentId} - Status: ${b.status} - Date: ${b.date}`);
            });

            // Check attendance records
            const attendanceRecords = await Attendance.aggregate([
                {
                    $match: {
                        "records.classId": cls._id,
                        "records.date": { $gte: queryWindow.start, $lte: queryWindow.end }
                    }
                },
                { $unwind: "$records" },
                {
                    $match: {
                        "records.classId": cls._id,
                        "records.date": { $gte: queryWindow.start, $lte: queryWindow.end }
                    }
                },
                {
                    $lookup: {
                        from: "students",
                        localField: "studentId",
                        foreignField: "_id",
                        as: "studentInfo"
                    }
                },
                { $unwind: "$studentInfo" },
                {
                    $project: {
                        studentName: "$studentInfo.name",
                        checkInTime: "$records.date",
                        status: "$records.status"
                    }
                }
            ]);

            console.log(`✅ Attendance Records: ${attendanceRecords.length}`);
            attendanceRecords.forEach((a, i) => {
                console.log(`  ${i + 1}. ${a.studentName} - Status: ${a.status} - Check-in: ${a.checkInTime}`);
            });

            // Total list
            const totalList = bookings.length + attendanceRecords.length;
            console.log(`📊 Total in list: ${totalList}`);
        }

        // Check if there are any bookings at all in the database
        const allBookings = await ClassBooking.countDocuments();
        console.log(`\n📊 Total bookings in database: ${allBookings}`);

        // Check bookings for today (any class)
        const todayBookings = await ClassBooking.find({
            date: { $gte: normalizedToday, $lte: normalizedEndOfDay }
        });

        console.log(`\n📅 All bookings for today: ${todayBookings.length}`);
        todayBookings.forEach((b, i) => {
            console.log(`  ${i + 1}. Class ID: ${b.classId} - Student ID: ${b.studentId} - Status: ${b.status}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from database');
    }
}

diagnoseAttendance();
