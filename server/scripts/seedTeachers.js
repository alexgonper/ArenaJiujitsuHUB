require('dotenv').config();
const mongoose = require('mongoose');
const Franchise = require('../models/Franchise');
const Teacher = require('../models/Teacher');
const { connectDB, closeDB } = require('../config/database');

// Data for random generation
const firstNames = ['Carlos', 'Marcelo', 'André', 'Ricardo', 'Fábio', 'Luiz', 'Fernanda', 'Beatriz', 'Juliana', 'Ana', 'Pedro', 'Lucas', 'Marcos', 'Daniel', 'Rodrigo', 'Bruno'];
const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Almeida', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Martins', 'Barbosa', 'Ribeiro'];

const belts = ['Roxa', 'Marrom', 'Preta', 'Coral', 'Vermelha'];
const degrees = ['Nenhum', '1º Grau', '2º Grau', '3º Grau', '4º Grau', '5º Grau', '6º Grau'];

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateEmail(name) {
    const cleanName = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .trim();

    const nameParts = cleanName.split(' ').filter(part => part.length > 0);
    const firstName = nameParts[0] || 'user';
    const lastName = nameParts[nameParts.length - 1] || 'name';

    const domains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com.br', 'icloud.com', 'uol.com.br', 'bol.com.br', 'terra.com.br'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const randomNum = Math.floor(Math.random() * 9999);

    const formats = [
        `${firstName}.${lastName}${randomNum}@${domain}`,
        `${firstName}${lastName}${randomNum}@${domain}`,
        `${firstName}_${lastName}${randomNum}@${domain}`,
        `${firstName}${randomNum}@${domain}`
    ];

    return formats[Math.floor(Math.random() * formats.length)];
}

function generateRandomTeacher(franchiseId, forceBelt = null) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);

    // Age between 22 and 65 (higher for high belts)
    const birthDate = getRandomDate(new Date(1959, 0, 1), new Date(2002, 0, 1));

    // Hire date between 2018 and now
    const hireDate = getRandomDate(new Date(2018, 0, 1), new Date());

    const belt = forceBelt || getRandomElement(belts);

    // Higher belts should have higher degrees
    let degree;
    if (belt === 'Coral' || belt === 'Vermelha') {
        degree = getRandomElement(['5º Grau', '6º Grau']);
    } else if (belt === 'Preta') {
        degree = getRandomElement(['1º Grau', '2º Grau', '3º Grau', '4º Grau']);
    } else {
        degree = getRandomElement(['Nenhum', '1º Grau', '2º Grau']);
    }

    return {
        name: `${firstName} ${lastName}`,
        birthDate: birthDate,
        email: generateEmail(`${firstName} ${lastName}`),
        belt: belt,
        degree: degree,
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

            // Force some specific belts to ensure they appear
            allTeachers.push(generateRandomTeacher(franchise._id, 'Coral'));
            allTeachers.push(generateRandomTeacher(franchise._id, 'Vermelha'));
            allTeachers.push(generateRandomTeacher(franchise._id, 'Preta'));
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
