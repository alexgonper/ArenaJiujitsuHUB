require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');

// Realistic BJJ age distribution
const getRandomBirthDate = () => {
    const r = Math.random();
    let age;
    if (r < 0.15) age = Math.floor(Math.random() * (12 - 4 + 1)) + 4;  // Kids
    else if (r < 0.25) age = Math.floor(Math.random() * (17 - 13 + 1)) + 13; // Teens
    else if (r < 0.65) age = Math.floor(Math.random() * (35 - 18 + 1)) + 18; // Young Adults
    else if (r < 0.90) age = Math.floor(Math.random() * (50 - 36 + 1)) + 36; // Adults
    else age = Math.floor(Math.random() * (70 - 51 + 1)) + 51;              // Seniors

    const today = new Date();
    const birthYear = today.getFullYear() - age;
    const birthMonth = Math.floor(Math.random() * 12);
    const birthDay = Math.floor(Math.random() * 28) + 1;
    return new Date(birthYear, birthMonth, birthDay);
};

const randomize = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log('✅ Connected to MongoDB');

        const students = await Student.find({});
        console.log(`📍 Randomizing birth dates for ${students.length} students...`);

        let count = 0;
        for (const student of students) {
            student.birthDate = getRandomBirthDate();
            await student.save();
            count++;
            if (count % 50 === 0) process.stdout.write('.');
        }

        console.log(`\n\n🎉 SUCCESS! Random birth dates applied to ${count} students.`);
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

randomize();
