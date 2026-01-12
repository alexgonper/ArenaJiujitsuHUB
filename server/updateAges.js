require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');

// Distribution logic for realistic ages in a BJJ gym
const getRandomAge = () => {
    const r = Math.random();
    if (r < 0.15) return Math.floor(Math.random() * (12 - 4 + 1)) + 4;  // 15% Kids (4-12)
    if (r < 0.25) return Math.floor(Math.random() * (17 - 13 + 1)) + 13; // 10% Teens (13-17)
    if (r < 0.65) return Math.floor(Math.random() * (35 - 18 + 1)) + 18; // 40% Young Adults (18-35)
    if (r < 0.90) return Math.floor(Math.random() * (50 - 36 + 1)) + 36; // 25% Adults (36-50)
    return Math.floor(Math.random() * (70 - 51 + 1)) + 51;              // 10% Seniors (51+)
};

const updateAges = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Connected to MongoDB');

        const students = await Student.find({});
        console.log(`📍 Found ${students.length} students to update.`);

        let updatedCount = 0;
        for (const student of students) {
            const newAge = getRandomAge();
            student.age = newAge;
            await student.save();
            updatedCount++;
            if (updatedCount % 50 === 0) process.stdout.write('.');
        }

        console.log(`\n\n🎉 UPDATE COMPLETE!`);
        console.log(`📊 Total students updated with ages: ${updatedCount}`);

        await mongoose.connection.close();
        console.log('👋 Connection closed');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error updating ages:', error);
        process.exit(1);
    }
};

updateAges();
