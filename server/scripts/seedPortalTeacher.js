const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Franchise = require('../models/Franchise');

const MONGODB_URI = 'mongodb://localhost:27017/arena-matrix';

async function seedTeacherPortal() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find a teacher
        const teacher = await Teacher.findOne();
        if (!teacher) {
            console.log('No teachers found. Please seed teachers first.');
            process.exit(0);
        }

        console.log(`Setting up portal for teacher: ${teacher.name} (${teacher.email})`);

        // Update teacher email to something we know for testing if it's empty
        if (!teacher.email) {
            teacher.email = 'mestre@arenajj.com';
            await teacher.save();
            console.log(`Updated teacher email to: ${teacher.email}`);
        }

        // Create some classes for today
        const today = new Date().getDay();

        await Class.deleteMany({ teacherId: teacher._id });

        const classes = [
            {
                name: 'Jiu-Jitsu Iniciante',
                teacherId: teacher._id,
                franchiseId: teacher.franchiseId,
                dayOfWeek: today,
                startTime: '07:00',
                endTime: '08:30',
                category: 'BJJ',
                capacity: 20
            },
            {
                name: 'Submission / No-Gi',
                teacherId: teacher._id,
                franchiseId: teacher.franchiseId,
                dayOfWeek: today,
                startTime: '12:00',
                endTime: '13:30',
                category: 'No-Gi',
                capacity: 25
            },
            {
                name: 'Jiu-Jitsu Avançado',
                teacherId: teacher._id,
                franchiseId: teacher.franchiseId,
                dayOfWeek: today,
                startTime: '19:00',
                endTime: '20:30',
                category: 'BJJ',
                capacity: 30
            }
        ];

        await Class.insertMany(classes);
        console.log('Classes seeded successfully for today!');

        // Also add classes for tomorrow just in case
        const tomorrow = (today + 1) % 7;
        const tomorrowClasses = classes.map(c => ({ ...c, dayOfWeek: tomorrow }));
        await Class.insertMany(tomorrowClasses);
        console.log('Classes seeded successfully for tomorrow!');

        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding teacher portal:', error);
        process.exit(1);
    }
}

seedTeacherPortal();
