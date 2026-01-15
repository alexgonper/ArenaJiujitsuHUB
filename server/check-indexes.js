const mongoose = require('mongoose');
const ClassBooking = require('./models/ClassBooking');
require('dotenv').config();

async function listIndexes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log('✅ Conectado ao MongoDB');

        const indexes = await ClassBooking.collection.indexes();
        console.log('📊 Índices na coleção ClassBooking:');
        console.dir(indexes, { depth: null });

    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await mongoose.disconnect();
    }
}

listIndexes();
