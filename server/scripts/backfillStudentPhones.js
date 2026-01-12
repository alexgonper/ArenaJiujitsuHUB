const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('../models/Student');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

const backfillStudents = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB.');

        const students = await Student.find({
            $or: [
                { phone: { $exists: false } },
                { phone: '' },
                { phone: null }
            ]
        });

        console.log(`Found ${students.length} students to backfill phones.`);

        for (const student of students) {
            const ddd = Math.floor(Math.random() * 89) + 11; // 11-99
            const part1 = Math.floor(Math.random() * 90000) + 10000;
            const part2 = Math.floor(Math.random() * 9000) + 1000;
            student.phone = `+55 ${ddd} 9${part1}-${part2}`;
            await student.save();
        }

        console.log('✅ Backfill complete for students!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during backfill:', error);
        process.exit(1);
    }
};

backfillStudents();
