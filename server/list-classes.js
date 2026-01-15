const mongoose = require('mongoose');
const Class = require('./models/Class');
require('dotenv').config();

async function listAllClasses() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log('✅ Conectado ao MongoDB');

        const classes = await Class.find({}, 'name dayOfWeek startTime active franchiseId');
        
        console.log('\n📋 LISTA DE TODAS AS AULAS:');
        console.log('------------------------------------------------');
        classes.forEach(c => {
            console.log(`[${c._id}] ${c.name} | Dia: ${c.dayOfWeek} | Hora: ${c.startTime}`);
        });
        console.log('------------------------------------------------');
        console.log(`Total: ${classes.length} aulas.`);

    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await mongoose.disconnect();
    }
}

listAllClasses();
