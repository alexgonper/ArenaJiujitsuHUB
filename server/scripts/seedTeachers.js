require('dotenv').config();
const mongoose = require('mongoose');
const Franchise = require('../models/Franchise');
const Teacher = require('../models/Teacher');
const { connectDB, closeDB } = require('../config/database');

// Data for random generation
const firstNames = ['Carlos', 'Marcelo', 'André', 'Ricardo', 'Fábio', 'Luiz', 'Fernanda', 'Beatriz', 'Juliana', 'Ana', 'Pedro', 'Lucas', 'Marcos', 'Daniel', 'Rodrigo', 'Bruno'];
const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Almeida', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Martins', 'Barbosa', 'Ribeiro'];

const belts = ['Roxa', 'Marrom', 'Preta']; // Teachers usually higher belts
const degrees = ['Nenhum', '1º Grau', '2º Grau', '3º Grau', '4º Grau'];

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateRandomTeacher(franchiseId) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);

    // Age between 22 and 55
    const birthDate = getRandomDate(new Date(1969, 0, 1), new Date(2002, 0, 1));

    // Hire date between 2018 and now
    const hireDate = getRandomDate(new Date(2018, 0, 1), new Date());

    return {
        name: `${firstName} ${lastName}`,
        birthDate: birthDate,
        belt: getRandomElement(belts),
        degree: getRandomElement(degrees),
        hireDate: hireDate,
        franchiseId: franchiseId
    };
}

async function seedTeachers() {
    try {
        console.log('🔌 Connecting to database...');
        await connectDB();

        console.log('🧹 Clearing existing teachers...');
        await Teacher.deleteMany({});

        console.log('🏢 Fetching franchises...');
        const franchises = await Franchise.find({});

        if (franchises.length === 0) {
            console.log('❌ No franchises found to seed teachers for. Run seedDatabase.js first.');
            process.exit(1);
        }

        console.log(`📝 found ${franchises.length} franchises. Generating teachers...`);

        const allTeachers = [];

        for (const franchise of franchises) {
            console.log(`   Generating 3 teachers for: ${franchise.name}`);
            for (let i = 0; i < 3; i++) {
                allTeachers.push(generateRandomTeacher(franchise._id));
            }
        }

        console.log(`💾 Saving ${allTeachers.length} teachers...`);
        await Teacher.insertMany(allTeachers);

        console.log('\n✅ Teachers seeded successfully!');

        await closeDB();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding teachers:', error);
        process.exit(1);
    }
}

seedTeachers();
