require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};

async function forceClassForToday() {
    await connectDB();

    try {
        const email = 'pedro_oliveira1708@outlook.com';
        const teacher = await Teacher.findOne({ email });

        if (!teacher) {
            console.log('Teacher not found');
            process.exit();
        }

        const today = new Date().getDay();
        console.log(`Forcing class for ${teacher.name} on Day ${today}...`);

        // Create a class specifically for today
        const newClass = await Class.create({
            name: 'Jiu-Jitsu Advanced (HOJE)',
            category: 'BJJ',
            teacherId: teacher._id,
            franchiseId: teacher.franchiseId,
            dayOfWeek: today,
            startTime: '19:00', // Evening class
            endTime: '20:30',
            active: true
        });

        console.log(`✅ Created class: ${newClass.name} at ${newClass.startTime}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

forceClassForToday();
