const mongoose = require('mongoose');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const GraduationRule = require('../models/GraduationRule');
const Franchise = require('../models/Franchise');
require('dotenv').config({ path: '../.env' });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
};

const seedCandidates = async () => {
    await connectDB();

    console.log('🌱 Seeding graduation candidates...');

    try {
        // 1. Ensure Rule Exists
        // Rule: Branca (Nenhum) -> Branca (1º Grau)
        // Req: 30 classes, 60 days
        const ruleQuery = { fromBelt: 'Branca', fromDegree: 'Nenhum' };
        const ruleUpdate = {
            toBelt: 'Branca',
            toDegree: '1º Grau',
            classesRequired: 30,
            minDaysRequired: 60,
            examFee: 0,
            isActive: true
        };

        const rule = await GraduationRule.findOneAndUpdate(ruleQuery, ruleUpdate, {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
        });

        console.log(`✅ Rule ensured: ${rule.fromBelt} -> ${rule.toDegree} (Req: ${rule.classesRequired} classes, ${rule.minDaysRequired} days)`);

        // 2. Find a Target Franchise
        const franchise = await Franchise.findOne();
        if (!franchise) {
            console.error('❌ No franchise found. Please seed franchises first.');
            process.exit(1);
        }
        console.log(`🏢 Target Franchise: ${franchise.name} (${franchise._id})`);

        // 3. Find Candidates
        const candidates = await Student.find({
            franchiseId: franchise._id,
            belt: 'Branca',
            $or: [{ degree: 'Nenhum' }, { degree: null }]
        }).limit(3);

        if (candidates.length === 0) {
            console.log('⚠️ No existing White Belt students found. Creating 3 dummy candidates...');

            for (let i = 1; i <= 3; i++) {
                const newStudent = await Student.create({
                    name: `Aluno Teste ${i}`,
                    franchiseId: franchise._id,
                    belt: 'Branca',
                    degree: 'Nenhum',
                    email: `teste${i}@example.com`,
                    phone: '11999999999',
                    active: true,
                    enrollmentDate: new Date('2025-01-01'),
                    birthDate: new Date('2000-01-01'),
                    paymentStatus: 'Paga'
                });
                candidates.push(newStudent);
            }
        }

        console.log(`🎯 Preparing ${candidates.length} students for graduation...`);

        const today = new Date();
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(today.getDate() - 90);

        for (const student of candidates) {
            // Update Student Date
            student.lastGraduationDate = ninetyDaysAgo;
            // Ensure belt/degree matches rule input
            student.belt = 'Branca';
            student.degree = 'Nenhum';
            await student.save();

            // Clear old attendance
            await Attendance.deleteMany({ studentId: student._id });

            // Add 35 Attendance records over the last 70 days
            // Every 2 days
            const attendanceDocs = [];
            for (let i = 0; i < 35; i++) {
                const date = new Date();
                date.setDate(today.getDate() - (i * 2));

                attendanceDocs.push({
                    studentId: student._id,
                    tenantId: franchise._id, // Schema uses tenantId
                    classId: new mongoose.Types.ObjectId(), // Fake class ID
                    date: date,
                    status: 'Present', // Enum: Present, Absent, etc.
                    checkInTime: new Date(date.setHours(18, 0, 0)),
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }

            await Attendance.insertMany(attendanceDocs);
            console.log(`  ✅ Student prepared: ${student.name} (ID: ${student._id})`);
            console.log(`     - Set lastGraduationDate to 90 days ago`);
            console.log(`     - Added 35 classes`);
        }

        console.log('\n✨ DONE! Verify the widget in the Matrix dashboard.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding candidates:', error);
        process.exit(1);
    }
};

seedCandidates();
