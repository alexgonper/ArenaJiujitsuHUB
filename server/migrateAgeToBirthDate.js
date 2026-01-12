require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log('✅ Connected to MongoDB');

        // Note: 'age' is no longer in the schema, but it still exists in the documents in MongoDB.
        // We need to access the raw document or assume 'age' was there if we want to perfect the migration.
        // However, Mongoose strict mode might strip it.
        // To be safe, we will fetch with .lean() to get all fields including those not in schema,
        // OR we can just generate new random birthdates for everyone since the previous 'age' was also random.
        // Given the previous step just randomized ages, regenerating birth dates from scratch or from the age is fine.

        // Let's rely on finding docs that don't have birthDate.
        const students = await Student.find({ birthDate: { $exists: false } }).lean();
        console.log(`📍 Found ${students.length} students without birthDate.`);

        let updatedCount = 0;
        for (const s of students) {
            // If the document has an 'age' field (from previous schema), use it.
            // Otherwise generate random age.
            let age = s.age;
            if (!age) {
                // Random age logic if missing
                const r = Math.random();
                if (r < 0.15) age = Math.floor(Math.random() * (12 - 4 + 1)) + 4;
                else if (r < 0.25) age = Math.floor(Math.random() * (17 - 13 + 1)) + 13;
                else if (r < 0.65) age = Math.floor(Math.random() * (35 - 18 + 1)) + 18;
                else if (r < 0.90) age = Math.floor(Math.random() * (50 - 36 + 1)) + 36;
                else age = Math.floor(Math.random() * (70 - 51 + 1)) + 51;
            }

            // Calculate Birth Date: Today minus Age years (plus some random days for realism)
            const today = new Date();
            const birthYear = today.getFullYear() - age;
            // Random month and day
            const birthMonth = Math.floor(Math.random() * 12);
            const birthDay = Math.floor(Math.random() * 28) + 1; // Safe day

            const birthDate = new Date(birthYear, birthMonth, birthDay);

            await Student.updateOne(
                { _id: s._id },
                {
                    $set: { birthDate: birthDate },
                    $unset: { age: 1 } // Remove the old field
                }
            );
            updatedCount++;
            if (updatedCount % 50 === 0) process.stdout.write('.');
        }

        console.log(`\n\n🎉 MIGRATION COMPLETE!`);
        console.log(`📊 Total students updated: ${updatedCount}`);

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration Error:', error);
        process.exit(1);
    }
};

migrate();
