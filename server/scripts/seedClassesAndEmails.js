require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Franchise = require('../models/Franchise');
const Class = require('../models/Class');

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

function generateEmail(name) {
    const cleanName = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .trim();

    const nameParts = cleanName.split(' ').filter(part => part.length > 0);
    const firstName = nameParts[0] || 'user';
    const lastName = nameParts[nameParts.length - 1] || 'name';
    const randomNum = Math.floor(Math.random() * 9999);

    // Use a mix of domains
    const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'arena.com'];
    const domain = domains[Math.floor(Math.random() * domains.length)];

    return `${firstName}.${lastName}${randomNum}@${domain}`;
}

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
        // --- 1. Populate Missing Emails ---
        console.log('\n📧 PART 1: Backfilling Emails...');

        // Teachers
        const teachersWithoutEmail = await Teacher.find({ $or: [{ email: { $exists: false } }, { email: null }, { email: '' }] });
        console.log(`Found ${teachersWithoutEmail.length} teachers without email.`);

        for (const t of teachersWithoutEmail) {
            t.email = generateEmail(t.name);
            await t.save();
        }
        if (teachersWithoutEmail.length > 0) console.log('✅ Teachers updated.');

        // Students
        const studentsWithoutEmail = await Student.find({ $or: [{ email: { $exists: false } }, { email: null }, { email: '' }] });
        console.log(`Found ${studentsWithoutEmail.length} students without email.`);

        for (const s of studentsWithoutEmail) {
            s.email = generateEmail(s.name);
            await s.save();
        }
        if (studentsWithoutEmail.length > 0) console.log('✅ Students updated.');


        // --- 2. Seed Random Classes ---
        console.log('\n📅 PART 2: Seeding Classes for All Academies...');

        const franchises = await Franchise.find({});
        let totalClassesCreated = 0;

        for (const franchise of franchises) {
            // Find teachers for this franchise
            const teachers = await Teacher.find({ franchiseId: franchise._id });

            if (teachers.length === 0) {
                console.log(`⚠️  Skipping ${franchise.name} (No teachers found)`);
                continue;
            }

            console.log(`   Generating 10 classes for: ${franchise.name} (${teachers.length} teachers available)`);

            const newClasses = [];
            for (let i = 0; i < 10; i++) {
                const randomTeacher = teachers[Math.floor(Math.random() * teachers.length)];
                const randomType = classTypes[Math.floor(Math.random() * classTypes.length)];
                const randomDay = Math.floor(Math.random() * 7); // 0-6
                const startTime = startTimes[Math.floor(Math.random() * startTimes.length)];
                const endTime = await addTime(startTime, 90); // 1.5h duration

                newClasses.push({
                    name: randomType.name,
                    category: randomType.category,
                    teacherId: randomTeacher._id,
                    franchiseId: franchise._id,
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

        console.log(`\n✅ Created ${totalClassesCreated} new classes across ${franchises.length} franchises.`);

    } catch (error) {
        console.error('Script Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

seed();
