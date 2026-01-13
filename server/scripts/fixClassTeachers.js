
const mongoose = require('mongoose');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Franchise = require('../models/Franchise');

require('dotenv').config({ path: '../.env' });

const fixTeachers = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        // 1. Get all franchises
        const franchises = await Franchise.find({});
        console.log(`🏢 Found ${franchises.length} franchises.`);

        let updatedCount = 0;

        for (const franchise of franchises) {
            const franchiseId = franchise._id;

            // 2. Get teachers for this franchise
            const teachers = await Teacher.find({ franchiseId });

            if (teachers.length === 0) {
                console.warn(`⚠️ No teachers found for franchise ${franchise.name} (${franchiseId}). Skipping...`);
                continue;
            }

            // 3. Get classes without teacher or with invalid teacher for this franchise
            // We'll just fetch ALL classes for the franchise and check via JS to be safe, 
            // or we can query { $or: [{ teacherId: null }, { teacherId: { $exists: false } }] }
            const classesWithoutTeacher = await Class.find({
                franchiseId,
                $or: [{ teacherId: null }, { teacherId: { $exists: false } }]
            });

            if (classesWithoutTeacher.length > 0) {
                console.log(`Fixing ${classesWithoutTeacher.length} classes for ${franchise.name}...`);

                for (const cls of classesWithoutTeacher) {
                    // Assign a random teacher
                    const randomTeacher = teachers[Math.floor(Math.random() * teachers.length)];

                    cls.teacherId = randomTeacher._id;
                    await cls.save();
                    updatedCount++;
                }
            }

            // Also check for classes where teacherId might be valid ObjectId but not in DB (orphaned)? 
            // For now, let's assume "Sem Professor" means null/missing. 
            // However, the UI might show "Sem Professor" if the populate fails (null result).
            // Let's iterate all classes and force re-assignment if we suspect issues, 
            // but the user specific request implies they see "Sem Professor".

            // NOTE: Existing logic covers explicit nulls. 
            // If the user's issue is broken IDs, we might need a broader sweep. 
            // Let's double check if we have classes with IDs that don't match any teacher.

            const allClasses = await Class.find({ franchiseId }).populate('teacherId');
            for (const cls of allClasses) {
                if (!cls.teacherId) {
                    // This catches failed population (orphan IDs)
                    const randomTeacher = teachers[Math.floor(Math.random() * teachers.length)];
                    // We need to update the raw document, not the populated one
                    await Class.updateOne({ _id: cls._id }, { teacherId: randomTeacher._id });
                    updatedCount++;
                    console.log(`  -> Fixed orphaned class: ${cls.name}`);
                }
            }
        }

        console.log(`✨ Total classes updated: ${updatedCount}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Done.');
    }
};

fixTeachers();
