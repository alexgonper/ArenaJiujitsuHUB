
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Franchise = require('../models/Franchise');
const { connectDB, closeDB } = require('../config/database');

const countBelts = async () => {
    try {
        await connectDB();

        const franchiseCount = await Franchise.countDocuments({});
        console.log(`\nTotal Franchises: ${franchiseCount}`);

        console.log('\n--- Teacher Collection ---');
        const teacherCount = await Teacher.countDocuments({});
        const teacherBelts = await Teacher.distinct('belt');
        console.log(`Total Teachers: ${teacherCount}`);
        console.log(`Unique belts: ${teacherBelts.join(', ') || 'none'}`);

        const coralTeachers = await Teacher.countDocuments({ belt: 'Coral' });
        const vermelhaTeachers = await Teacher.countDocuments({ belt: 'Vermelha' });
        console.log(`Coral Teachers: ${coralTeachers}`);
        console.log(`Vermelha Teachers: ${vermelhaTeachers}`);

        console.log('\n--- Student Collection ---');
        const studentCount = await Student.countDocuments({});
        const studentBelts = await Student.distinct('belt');
        console.log(`Total Students: ${studentCount}`);
        console.log(`Unique belts: ${studentBelts.join(', ') || 'none'}`);

        const coralStudents = await Student.countDocuments({ belt: 'Coral' });
        const vermelhaStudents = await Student.countDocuments({ belt: 'Vermelha' });
        console.log(`Coral Students: ${coralStudents}`);
        console.log(`Vermelha Students: ${vermelhaStudents}`);

        await closeDB();
    } catch (error) {
        console.error('Error counting belts:', error);
        process.exit(1);
    }
};

countBelts();
