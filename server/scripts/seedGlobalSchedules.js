const mongoose = require('mongoose');
const Franchise = require('../models/Franchise');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
require('dotenv').config();

const seedAllSchedules = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix';
        await mongoose.connect(uri);
        console.log('Connected to DB for Global Seeding...');

        // 1. Clear existing classes to avoid duplicates during seed
        await Class.deleteMany({});
        console.log('Cleared existing classes.');

        const franchises = await Franchise.find({});
        console.log(`Found ${franchises.length} franchises.`);

        const categories = ['BJJ', 'No-Gi', 'Wrestling', 'Kids', 'Fundamentals'];
        const classNames = {
            'BJJ': ['Jiu-Jitsu Iniciante', 'Jiu-Jitsu Avançado', 'Técnica & Sparring', 'Open Mat'],
            'No-Gi': ['No-Gi Submission', 'Grappling Drill', 'Luta Livre'],
            'Wrestling': ['Wrestling for BJJ', 'Takedown Class'],
            'Kids': ['Arena Kids - Nível 1', 'Kids Competition', 'Jiu-Jitsu Infantil'],
            'Fundamentals': ['Fundamentos Básicos', 'Defesa Pessoal']
        };

        const timeSlots = [
            { start: '07:00', end: '08:30' },
            { start: '10:00', end: '11:30' },
            { start: '12:00', end: '13:00' },
            { start: '18:00', end: '19:30' },
            { start: '19:30', end: '21:00' }
        ];

        let totalCreated = 0;

        for (const franchise of franchises) {
            const teachers = await Teacher.find({ franchiseId: franchise._id });

            if (teachers.length === 0) {
                console.log(`Skipping ${franchise.name}: No teachers found.`);
                continue;
            }

            const classesToInsert = [];

            // Seed classes for each day of the week (0-6)
            for (let day = 0; day < 7; day++) {
                // Randomly decide how many classes this day (2-4)
                const numClasses = Math.floor(Math.random() * 3) + 2;

                // Shuffle timeSlots for variety
                const shuffledSlots = [...timeSlots].sort(() => 0.5 - Math.random());

                for (let i = 0; i < numClasses; i++) {
                    const slot = shuffledSlots[i];
                    const category = categories[Math.floor(Math.random() * categories.length)];
                    const name = classNames[category][Math.floor(Math.random() * classNames[category].length)];
                    const teacher = teachers[Math.floor(Math.random() * teachers.length)];

                    classesToInsert.push({
                        franchiseId: franchise._id,
                        teacherId: teacher._id,
                        name: name,
                        dayOfWeek: day,
                        startTime: slot.start,
                        endTime: slot.end,
                        category: category,
                        capacity: 20 + (Math.floor(Math.random() * 2) * 10), // 20 or 30
                        active: true
                    });
                }
            }

            if (classesToInsert.length > 0) {
                await Class.insertMany(classesToInsert);
                totalCreated += classesToInsert.length;
                console.log(`Added ${classesToInsert.length} classes for: ${franchise.name}`);
            }
        }

        console.log(`\nDONE! Created a total of ${totalCreated} classes across the global network.`);
        process.exit(0);
    } catch (error) {
        console.error('Seed script failed:', error);
        process.exit(1);
    }
};

seedAllSchedules();
