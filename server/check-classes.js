const mongoose = require('mongoose');
const Class = require('./models/Class');
require('dotenv').config();

async function countClasses() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        const count = await Class.countDocuments({});
        console.log(`📊 Total de Aulas no Banco: ${count}`);
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await mongoose.disconnect();
    }
}
countClasses();
