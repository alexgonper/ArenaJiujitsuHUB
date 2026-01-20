import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import { connectDB, closeDB } from '../config/database';
import Student from '../models/Student';
import Class from '../models/Class';
import ClassSession from '../models/ClassSession';
import Attendance from '../models/Attendance';
import ClassBooking from '../models/ClassBooking';
import Franchise from '../models/Franchise';
import Teacher from '../models/Teacher';
import DailyMetric from '../models/DailyMetric';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const getRandomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomSubset = <T>(array: T[], size: number): T[] => {
    const shuffled = array.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, size);
};

const getMonthString = (date: Date): string => {
    return date.toISOString().slice(0, 7); // "YYYY-MM"
};

const seedAttendanceAndBookings = async () => {
    try {
        await connectDB();
        console.log('🚀 Starting seed process...');

        // 1. Get Franchise
        const franchises = await Franchise.find();
        if (franchises.length === 0) {
            console.error('❌ No franchises found. Please seed basic data first.');
            return;
        }
        const franchise = franchises[0];
        console.log(`🏢 Using Franchise: ${franchise.name}`);

        // 2. Get Basic Data
        const students = await Student.find({ franchiseId: franchise._id });
        const classes = await Class.find({ franchiseId: franchise._id });
        const teachers = await Teacher.find({ franchiseId: franchise._id });

        if (students.length === 0 || classes.length === 0) {
            console.error('❌ Missing students or classes.');
            return;
        }
        console.log(`👥 Found ${students.length} students, ${classes.length} classes, ${teachers.length} teachers.`);

        const START_DAYS_AGO = 30;
        const END_DAYS_AHEAD = 14;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let totalSessionsCreated = 0;
        let totalAttendances = 0;
        let totalBookings = 0;
        let totalDailyMetrics = 0;

        // 3. Iterate Dates
        for (let i = -START_DAYS_AGO; i <= END_DAYS_AHEAD; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            const dayOfWeek = date.getDay(); // 0-6

            // Find classes for this day
            const activeClassesForDay = classes.filter(c => 
                c.dayOfWeek === dayOfWeek && c.active
            );

            for (const cls of activeClassesForDay) {
                // Determine teacher (use class teacher or random fallback)
                const teacherId = cls.teacherId || (teachers.length > 0 ? teachers[0]._id : null);
                if (!teacherId) continue;

                const teacher = teachers.find(t => t._id.toString() === teacherId.toString()) || teachers[0];

                // Create/Find Session
                // Check uniqueness on date + classId
                const sessionDate = new Date(date);
                // Keep time clean
                sessionDate.setHours(0,0,0,0);

                let session = await ClassSession.findOne({
                    classId: cls._id,
                    date: sessionDate
                });

                if (!session) {
                    session = new ClassSession({
                        classId: cls._id,
                        franchiseId: franchise._id,
                        date: sessionDate,
                        startTime: cls.startTime,
                        endTime: cls.endTime,
                        teacherId: teacher._id,
                        capacity: cls.capacity,
                        status: date < today ? 'completed' : 'scheduled'
                    });
                    totalSessionsCreated++;
                }

                // If Past: Generate Attendance
                if (date < today) {
                    if (session.status !== 'completed' && date < today) {
                        session.status = 'completed';
                    }

                    // Randomly select attendees
                    const attendanceCount = getRandomInt(3, Math.min(students.length, Math.floor(cls.capacity * 0.9)));
                    const attendees = getRandomSubset(students, attendanceCount);

                    for (const student of attendees) {
                        const month = getMonthString(date);
                        
                        // Find/Create Attendance Doc
                        let attendanceDoc = await Attendance.findOne({
                            studentId: student._id,
                            tenantId: franchise._id,
                            month: month
                        });

                        if (!attendanceDoc) {
                            attendanceDoc = new Attendance({
                                studentId: student._id,
                                tenantId: franchise._id,
                                month: month,
                                records: [],
                                totalPresent: 0
                            });
                        }

                        // Check if record exists
                        const alreadyExists = attendanceDoc.records.some(r => 
                            r.classId?.toString() === cls._id.toString() &&
                            new Date(r.date).toDateString() === sessionDate.toDateString()
                        );

                        if (!alreadyExists) {
                            attendanceDoc.records.push({
                                date: sessionDate,
                                classId: cls._id,
                                sessionId: session._id as mongoose.Types.ObjectId,
                                status: 'Present',
                                checkInMethod: 'App',
                                snapshot: {
                                    className: cls.name,
                                    teacherName: teacher.name,
                                    startTime: cls.startTime,
                                    category: cls.category
                                }
                            });
                            attendanceDoc.totalPresent += 1;
                            await attendanceDoc.save();
                            totalAttendances++;
                            
                            // Update session
                            session.checkedInCount++;
                        }
                    }
                }
                // If Future (or Today): Generate Bookings
                else {
                    // Randomly select bookers
                    const bookingCount = getRandomInt(2, Math.min(students.length, cls.capacity));
                    const bookers = getRandomSubset(students, bookingCount);

                    for (const student of bookers) {
                        const existingBooking = await ClassBooking.findOne({
                            studentId: student._id,
                            classId: cls._id,
                            date: sessionDate
                        });

                        if (!existingBooking) {
                            await ClassBooking.create({
                                franchiseId: franchise._id,
                                classId: cls._id,
                                studentId: student._id,
                                date: sessionDate,
                                status: 'reserved'
                            });
                            totalBookings++;
                            session.bookedCount++;
                        }
                    }
                }
                
                await session.save();
            }

            // === DAILY METRIC AGGREGATION ===
            if (activeClassesForDay.length > 0) {
                 const startOfDay = new Date(date);
                 startOfDay.setHours(0,0,0,0);
                 const endOfDay = new Date(date);
                 endOfDay.setHours(23,59,59,999);

                 // Re-fetch sessions to get accurate counts (since we saved them)
                 const sessions = await ClassSession.find({
                    franchiseId: franchise._id,
                    date: {
                        $gte: startOfDay,
                        $lte: endOfDay
                    }
                 });

                 const realCheckedIn = sessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
                 
                 // Update DailyMetric
                 await DailyMetric.findOneAndUpdate(
                    { 
                        franchiseId: franchise._id, 
                        date: startOfDay 
                    },
                    {
                        totalRevenue: 0, 
                        totalExpenses: 0,
                        activeStudents: students.length,
                        newStudents: 0,
                        dropoutStudents: 0,
                        classAttendanceCount: realCheckedIn
                    },
                    { upsert: true, new: true }
                 );
                 totalDailyMetrics++;
            }
        }

        console.log(`✅ Seeding Complete!`);
        console.log(`   - Created/Updated Sessions: ${totalSessionsCreated}`);
        console.log(`   - Created Attendance Records: ${totalAttendances}`);
        console.log(`   - Created Future Bookings: ${totalBookings}`);
        console.log(`   - Created/Updated Daily Metrics: ${totalDailyMetrics}`);

    } catch (error) {
        console.error('❌ Error seeding data:', error);
    } finally {
        await closeDB();
    }
};

seedAttendanceAndBookings();
