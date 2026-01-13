const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './.env' });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

const populateAttendance = async () => {
    await connectDB();

    try {
        console.log('--- Checking for Teacher Classes today ---');
        // 1. Get a teacher (Fernanda Melo from screenshots)
        const teacher = await Teacher.findOne({ name: { $regex: 'Fernanda', $options: 'i' } });
        if (!teacher) {
            console.log('Teacher Fernanda not found, trying any teacher...');
        }

        const targetTeacher = teacher || await Teacher.findOne();
        if (!targetTeacher) {
            console.log('No teachers found.');
            process.exit();
        }

        console.log(`Target Teacher: ${targetTeacher.name} (${targetTeacher._id})`);

        // 2. Get today's classes
        const today = new Date().getDay();
        const classes = await Class.find({
            teacherId: targetTeacher._id,
            dayOfWeek: today
        });

        console.log(`Found ${classes.length} classes for today (Day ${today}).`);

        if (classes.length === 0) {
            console.log('No classes for today. Creating one for testing...');
            // Create a dummy class for today
            const newClass = await Class.create({
                name: 'Jiu-Jitsu Teste',
                category: 'BJJ',
                teacherId: targetTeacher._id,
                franchiseId: targetTeacher.franchiseId,
                dayOfWeek: today,
                startTime: '08:00',
                endTime: '22:00', // Open all day for checkin
                active: true
            });
            classes.push(newClass);
            console.log('Created test class:', newClass.name);
        }

        const targetClass = classes[0];
        console.log(`Using Class: ${targetClass.name} (${targetClass._id})`);

        // 3. Check existing attendance
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const existingAttendance = await Attendance.find({
            classId: targetClass._id,
            date: { $gte: startOfDay }
        });

        console.log(`Existing Attendance Records: ${existingAttendance.length}`);

        if (existingAttendance.length === 0) {
            console.log('Creating dummy attendance records...');

            // Get some students from the same franchise
            const students = await Student.find({ franchiseId: targetTeacher.franchiseId }).limit(5);

            if (students.length === 0) {
                console.log('No students found in this franchise.');
            } else {
                const records = students.map(s => ({
                    studentId: s._id,
                    classId: targetClass._id,
                    checkedInBy: targetTeacher._id,
                    tenantId: targetTeacher.franchiseId,
                    date: new Date(),
                    status: 'Present'
                }));

                await Attendance.insertMany(records);
                console.log(`Inserted ${records.length} attendance records.`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

populateAttendance();
