require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const Franchise = require('../models/Franchise');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');

// Database connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};

// Utils
const startTimes = ['06:00', '07:00', '08:00', '09:00', '10:00', '12:00', '14:00', '16:00', '17:00', '18:00', '18:30', '19:00', '19:30', '20:00', '21:00'];
const classTypes = [
    { name: 'Jiu-Jitsu Fundamentals', category: 'Fundamentals' },
    { name: 'Jiu-Jitsu Avançado', category: 'BJJ' },
    { name: 'No-Gi Submission', category: 'No-Gi' },
    { name: 'Kids Future Champions', category: 'Kids' },
    { name: 'Competição', category: 'BJJ' },
    { name: 'Defesa Pessoal', category: 'Fundamentals' },
    { name: 'Drills & Tática', category: 'BJJ' },
    { name: 'Open Mat', category: 'BJJ' }
];

async function addTime(timeStr, minutesToAdd) {
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    date.setMinutes(date.getMinutes() + minutesToAdd);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

async function seed() {
    await connectDB();

    try {
        console.log('\n📅 PART 1: Ensuring ALL teachers have at least 5 classes...');

        const teachers = await Teacher.find({});
        console.log(`Found ${teachers.length} total teachers.`);

        let totalClassesCreated = 0;

        for (const teacher of teachers) {
            // Count existing classes for this teacher
            const existingCount = await Class.countDocuments({ teacherId: teacher._id });

            // We want every teacher to have at least 5 classes
            const classesNeeded = Math.max(0, 5 - existingCount);

            if (classesNeeded > 0) {
                console.log(`   Generating ${classesNeeded} additional classes for: ${teacher.name} (${teacher.franchiseId})`);

                const newClasses = [];
                for (let i = 0; i < classesNeeded; i++) {
                    const randomType = classTypes[Math.floor(Math.random() * classTypes.length)];
                    const randomDay = Math.floor(Math.random() * 7); // 0-6
                    const startTime = startTimes[Math.floor(Math.random() * startTimes.length)];
                    const endTime = await addTime(startTime, 90);

                    newClasses.push({
                        name: randomType.name,
                        category: randomType.category,
                        teacherId: teacher._id,
                        franchiseId: teacher.franchiseId,
                        dayOfWeek: randomDay,
                        startTime: startTime,
                        endTime: endTime,
                        active: true,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }

                await Class.insertMany(newClasses);
                totalClassesCreated += newClasses.length;
            }
        }
        console.log(`✅ Created ${totalClassesCreated} new classes to fill gaps.`);


        console.log('\n🛠 PART 2: Fixing Data Integrity...');

        // Ensure all existing classes have a valid teacherId (if missing/null, assign random from franchise)
        const orphanClasses = await Class.find({ $or: [{ teacherId: null }, { teacherId: { $exists: false } }] });
        console.log(`Found ${orphanClasses.length} orphan classes (no teacher). Fixng...`);

        for (const cls of orphanClasses) {
            const randomTeacher = await Teacher.findOne({ franchiseId: cls.franchiseId });
            if (randomTeacher) {
                cls.teacherId = randomTeacher._id;
                await cls.save();
            } else {
                // If no teacher in franchise, delete class
                await Class.deleteOne({ _id: cls._id });
            }
        }
        if (orphanClasses.length > 0) console.log('✅ Orphan classes fixed.');

    } catch (error) {
        console.error('Script Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

seed();
