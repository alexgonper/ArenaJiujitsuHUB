const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Franchise = require('../models/Franchise');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');

// Helper to format time as HH:MM
function formatTime(date) {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// Function to add minutes to a date
function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
}

const TORONTO_ID = '695f95a98a4111bb0489de28';

async function seedClasses() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Verify Franchise
        const franchise = await Franchise.findById(TORONTO_ID);
        if (!franchise) {
            console.error('❌ Franchise Arena Toronto not found!');
            process.exit(1);
        }
        console.log(`📍 Found Franchise: ${franchise.name}`);

        // 2. Find a Teacher
        const teacher = await Teacher.findOne({ franchiseId: TORONTO_ID });
        if (!teacher) {
            console.error('❌ No teacher found for Toronto. Please create one first.');
            process.exit(1);
        }
        console.log(`🥋 Found Teacher: ${teacher.name}`);

        // 3. Clear today's classes for this teacher (optional, but cleaner)
        const today = new Date().getDay();
        const deleteResult = await Class.deleteMany({
            franchiseId: TORONTO_ID,
            dayOfWeek: today
        });
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing classes for today.`);

        // 4. Create Scheduling Scenarios
        // We want to test the 15-minute rule.
        // Current time is roughly "Now".
        const now = new Date();

        const scenarios = [
            {
                name: 'Jiu-Jitsu Matinal (Passada)',
                offsetStart: -120, // 2 hours ago
                duration: 60,
                category: 'BJJ',
                desc: 'Should be closed/invalid'
            },
            {
                name: 'Jiu-Jitsu Almoço (Em Andamento)',
                offsetStart: -30, // Started 30 mins ago
                duration: 90,
                category: 'No-Gi',
                desc: 'Should be open/valid'
            },
            {
                name: 'Kids Class (Começa em 10min)',
                offsetStart: 10, // Starts in 10 mins (within 15 min window)
                duration: 60,
                category: 'Kids',
                desc: 'Should be open/valid (Check-in opens -15min)'
            },
            {
                name: 'Competição (Começa em 30min)',
                offsetStart: 30, // Starts in 30 mins (outside 15 min window)
                duration: 90,
                category: 'BJJ',
                desc: 'Should be closed'
            },
            {
                name: 'Fundamentals (Noite)',
                offsetStart: 180, // Starts in 3 hours
                duration: 60,
                category: 'Fundamentals',
                desc: 'Should be closed'
            }
        ];

        const classesToInsert = scenarios.map(scenario => {
            const start = addMinutes(now, scenario.offsetStart);
            const end = addMinutes(start, scenario.duration);

            return {
                franchiseId: TORONTO_ID,
                teacherId: teacher._id,
                name: scenario.name,
                dayOfWeek: today,
                startTime: formatTime(start),
                endTime: formatTime(end),
                capacity: 30,
                category: scenario.category,
                active: true
            };
        });

        const createdClasses = await Class.insertMany(classesToInsert);

        console.log('\n📚 Classes Created:');
        createdClasses.forEach((cls, i) => {
            console.log(`   - [${cls.startTime} - ${cls.endTime}] ${cls.name} (${scenarios[i].desc})`);
        });

        console.log('\n✅ Seed completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding classes:', error);
        process.exit(1);
    }
}

seedClasses();
