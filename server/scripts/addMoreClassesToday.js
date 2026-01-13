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

async function addMoreClassesForToday() {
    await connectDB();

    try {
        const email = 'pedro_oliveira1708@outlook.com';
        const teacher = await Teacher.findOne({ email });

        if (!teacher) {
            console.log('Teacher not found');
            process.exit();
        }

        const today = new Date().getDay();
        console.log(`Adding more classes for ${teacher.name} on Day ${today}...`);

        const newClasses = [
            {
                name: 'Jiu-Jitsu Matinal',
                category: 'Fundamentals',
                startTime: '07:00',
                endTime: '08:30'
            },
            {
                name: 'Jiu-Jitsu Kids',
                category: 'Kids',
                startTime: '10:00',
                endTime: '11:00'
            },
            {
                name: 'No-Gi Submission',
                category: 'No-Gi',
                startTime: '18:00',
                endTime: '19:00'
            },
            {
                name: 'Open Mat Noturno',
                category: 'BJJ',
                startTime: '21:00',
                endTime: '22:00'
            }
        ];

        const classesToInsert = newClasses.map(c => ({
            ...c,
            teacherId: teacher._id,
            franchiseId: teacher.franchiseId,
            dayOfWeek: today,
            active: true
        }));

        await Class.insertMany(classesToInsert);
        console.log(`✅ Added ${classesToInsert.length} classes for today.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

addMoreClassesForToday();
