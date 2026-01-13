const mongoose = require('mongoose');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const GraduationRule = require('../models/GraduationRule');
const Franchise = require('../models/Franchise');
require('dotenv').config({ path: '../.env' });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-hub', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
};

const checkEligibility = async () => {
    await connectDB();

    try {
        const franchise = await Franchise.findOne({ name: 'Arena Papanduva' });
        if (!franchise) {
            console.log('Franchise "Arena Papanduva" not found.');
            process.exit(0);
        }
        console.log(`Checking franchise: ${franchise.name} (${franchise._id})`);

        const students = await Student.find({ franchiseId: franchise._id });
        console.log(`Found ${students.length} students in franchise.`);

        const whiteBelts = students.filter(s => s.belt === 'Branca' && s.degree === 'Nenhum');
        console.log(`Found ${whiteBelts.length} "White Belt - None" students.`);

        for (const student of whiteBelts) {
            console.log(`\nChecking student: ${student.name} (${student._id})`);

            const rule = await GraduationRule.findOne({
                fromBelt: student.belt,
                fromDegree: student.degree
            });

            if (!rule) {
                console.log('  ❌ No graduation rule found.');
                continue;
            }
            console.log(`  ✅ Rule found: Need ${rule.classesRequired} classes, ${rule.minDaysRequired} days.`);

            const attendanceCount = await Attendance.countDocuments({
                studentId: student._id,
                date: { $gte: student.lastGraduationDate }
            });
            console.log(`  📊 Attendance found: ${attendanceCount}`);

            const daysSince = Math.floor((new Date() - student.lastGraduationDate) / (1000 * 60 * 60 * 24));
            console.log(`  ⏱️ Days since last grad: ${daysSince}`);

            if (attendanceCount >= rule.classesRequired && daysSince >= rule.minDaysRequired) {
                console.log('  🎉 ELIGIBLE!');
            } else {
                console.log('  🚫 NOT ELIGIBLE.');
            }
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkEligibility();
