
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Teacher = require('../models/Teacher');
const Franchise = require('../models/Franchise');
const { connectDB, closeDB } = require('../config/database');

const firstNames = ['Mestre Carlos', 'Grão-Mestre Hélio', 'Mestre Rickson', 'Mestre Renzo', 'Mestre Rolls', 'Mestre Royce', 'Mestre Carlson', 'Mestre Robson', 'Mestre Rilion', 'Mestre Rigan'];
const lastNames = ['Gracie', 'Machado', 'Behring', 'Barreto', 'Duarte', 'Fadda', 'Almeida', 'Silva', 'Santos', 'Oliveira'];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const seedCoralRedTeachers = async () => {
    try {
        await connectDB();

        const franchises = await Franchise.find({});
        if (franchises.length === 0) {
            console.error('No franchises found. Please seed franchises first.');
            process.exit(1);
        }

        const newTeachers = [];

        for (const franchise of franchises) {
            console.log(`   Adding 5 masters for: ${franchise.name}`);

            // Add 5 high-ranking teachers for THIS franchise
            for (let i = 0; i < 5; i++) {
                const isRed = Math.random() > 0.5;
                const belt = isRed ? 'Vermelha' : 'Coral';
                const degree = isRed
                    ? getRandomElement(['9º Grau', '10º Grau'])
                    : getRandomElement(['7º Grau', '8º Grau']);

                const firstName = getRandomElement(firstNames);
                const lastName = getRandomElement(lastNames);

                newTeachers.push({
                    name: `${firstName} ${lastName}`,
                    birthDate: isRed
                        ? new Date(1940 + Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), 1)
                        : new Date(1950 + Math.floor(Math.random() * 25), Math.floor(Math.random() * 12), 1),
                    belt: belt,
                    degree: degree,
                    hireDate: new Date(2000 + Math.floor(Math.random() * 20), 0, 1),
                    franchiseId: franchise._id,
                    active: true
                });
            }

            // Update franchise teacher count
            await Franchise.findByIdAndUpdate(franchise._id, {
                $inc: { teachers: 5 }
            });
        }

        console.log(`\n💾 Inserting ${newTeachers.length} high-ranking teachers...`);
        const result = await Teacher.insertMany(newTeachers);
        console.log(`✅ Successfully added ${result.length} teachers (5 per academy).`);

        await closeDB();
    } catch (error) {
        console.error('Error seeding high-ranking teachers:', error);
        process.exit(1);
    }
};

seedCoralRedTeachers();
