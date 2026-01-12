const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Teacher = require('../models/Teacher');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arenahub';

const backfill = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        const teachers = await Teacher.find({
            $or: [
                { phone: { $exists: false } },
                { phone: '' },
                { address: { $exists: false } },
                { address: '' },
                { gender: { $exists: false } }
            ]
        });

        console.log(`Found ${teachers.length} teachers to backfill.`);

        const genders = ['Masculino', 'Feminino'];
        const streets = ['Rua das Flores', 'Av. Brasil', 'Rua São Paulo', 'Rua Amazonas', 'Av. Getúlio Vargas'];
        const cities = ['São Paulo', 'Rio de Janeiro', 'Curitiba', 'Florianópolis', 'Belo Horizonte'];

        for (const teacher of teachers) {
            if (!teacher.gender) {
                teacher.gender = genders[Math.floor(Math.random() * genders.length)];
            }
            if (!teacher.phone) {
                teacher.phone = `+55 11 9${Math.floor(10000000 + Math.random() * 90000000)}`;
            }
            if (!teacher.address) {
                const street = streets[Math.floor(Math.random() * streets.length)];
                const city = cities[Math.floor(Math.random() * cities.length)];
                teacher.address = `${street}, ${Math.floor(Math.random() * 1000)} - ${city}`;
            }
            await teacher.save();
        }

        console.log('✅ Backfill complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during backfill:', error);
        process.exit(1);
    }
};

backfill();
