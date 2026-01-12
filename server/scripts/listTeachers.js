require('dotenv').config();
const mongoose = require('mongoose');
const Franchise = require('../models/Franchise');
const Teacher = require('../models/Teacher');
const { connectDB, closeDB } = require('../config/database');

async function listTeachers() {
    try {
        await connectDB();

        const teachers = await Teacher.find({}).populate('franchiseId', 'name');

        console.log('\n📋 TEACHERS LIST:\n');

        if (teachers.length === 0) {
            console.log('No teachers found.');
        } else {
            console.table(teachers.map(t => ({
                Name: t.name,
                Belt: t.belt,
                Degree: t.degree,
                'Academy': t.franchiseId ? t.franchiseId.name : 'Unknown',
                'Hire Date': t.hireDate.toLocaleDateString('pt-BR'),
                'Age': t.age
            })));
        }

        console.log(`\nTotal: ${teachers.length} teachers found.`);

        await closeDB();
        process.exit(0);
    } catch (error) {
        console.error('Error fetching teachers:', error);
        process.exit(1);
    }
}

listTeachers();
