const mongoose = require('mongoose');
const Student = require('../models/Student');
const Franchise = require('../models/Franchise');
const Attendance = require('../models/Attendance');
const GraduationRule = require('../models/GraduationRule');
require('dotenv').config({ path: '../.env' });

const connectDB = async () => {
    try {
        // Ensuring we connect to the CORRECT database
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
};

const BELT_ORDER = ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Roxa', 'Marrom', 'Preta'];
const DEGREE_ORDER = ['Nenhum', '1º Grau', '2º Grau', '3º Grau', '4º Grau'];

// Helper to get random integer
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to get random element
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateHistory = async () => {
    await connectDB();
    console.log('📜 Generating random history for ALL students...');

    try {
        const students = await Student.find({});
        console.log(`Found ${students.length} students.`);

        // 1. Ensure basic rules exist for all white belt degrees so logic doesn't break
        console.log('🛠 Ensuring basic rules exist...');
        const baseRules = [
            { f: 'Nenhum', t: '1º Grau' },
            { f: '1º Grau', t: '2º Grau' },
            { f: '2º Grau', t: '3º Grau' },
            { f: '3º Grau', t: '4º Grau' }
        ];

        for (const r of baseRules) {
            await GraduationRule.findOneAndUpdate(
                { fromBelt: 'Branca', fromDegree: r.f },
                {
                    toBelt: 'Branca',
                    toDegree: r.t,
                    classesRequired: 30,
                    minDaysRequired: 60,
                    isActive: true
                },
                { upsert: true }
            );
        }

        let updatedCount = 0;

        for (const student of students) {
            // Randomly decide if student is "ready to graduate" (30%) or "in progress" (70%)
            const isReady = Math.random() < 0.3;

            // Random Base Date (enrollment) 1-2 years ago
            const enrollmentDate = new Date();
            enrollmentDate.setFullYear(enrollmentDate.getFullYear() - getRandomInt(1, 2));
            student.enrollmentDate = enrollmentDate;

            // Random Belt (mostly White/Blue for realism)
            const belt = Math.random() < 0.7 ? 'Branca' : (Math.random() < 0.9 ? 'Azul' : getRandom(BELT_ORDER));
            student.belt = belt;

            // Random Degree
            const degree = getRandom(DEGREE_ORDER);
            student.degree = degree;

            // Set last graduation date (random between 30 and 120 days ago)
            const daysAgo = getRandomInt(30, 150);
            const lastGrad = new Date();
            lastGrad.setDate(lastGrad.getDate() - daysAgo);
            student.lastGraduationDate = lastGrad;

            await student.save();

            // --- ATTENDANCE GENERATION ---
            // Cleaning old attendance for this student
            await Attendance.deleteMany({ studentId: student._id });

            // If "Ready", we ensure > 30 classes and > 60 days (which daysAgo already covers mostly)
            // If "In Progress", we ensure < 30 classes

            let classesToGenerate = 0;
            if (isReady && daysAgo > 60) {
                // Make them eligible
                classesToGenerate = getRandomInt(32, 50);
            } else {
                // Make them NOT eligible
                classesToGenerate = getRandomInt(5, 25);
            }

            const attendanceDocs = [];
            // Spread classes over the period since last graduation
            for (let i = 0; i < classesToGenerate; i++) {
                const classDate = new Date(lastGrad);
                // Distribute evenly-ish
                const offset = Math.floor((daysAgo / classesToGenerate) * i);
                classDate.setDate(classDate.getDate() + offset + 1); // +1 to be after grad date

                // Don't generate future dates
                if (classDate > new Date()) continue;

                attendanceDocs.push({
                    tenantId: student.franchiseId,
                    studentId: student._id,
                    classId: new mongoose.Types.ObjectId(),
                    date: classDate,
                    status: 'Present',
                    checkInTime: new Date(classDate.setHours(19, 0, 0)),
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }

            if (attendanceDocs.length > 0) {
                await Attendance.insertMany(attendanceDocs);
            }

            updatedCount++;
            if (updatedCount % 50 === 0) process.stdout.write('.');
        }

        console.log(`\n✅ Successfully updated history for ${updatedCount} students.`);
        console.log('✨ Check the Matrix Graduations Widget - expect mixed results!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error generating history:', error);
        process.exit(1);
    }
};

generateHistory();
