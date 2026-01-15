const mongoose = require('mongoose');
const Class = require('./models/Class');
require('dotenv').config();

async function cleanDuplicates() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log('✅ Conectado ao MongoDB');

        // Buscar TODAS as aulas com esse nome
        const classes = await Class.find({
            name: { $regex: 'No-Gi Competition', $options: 'i' },
            startTime: '07:00'
        });

        console.log(`🔎 Encontradas ${classes.length} aulas com esse nome.`);

        if (classes.length > 0) {
            const result = await Class.deleteMany({
                name: { $regex: 'No-Gi Competition', $options: 'i' },
                startTime: '07:00'
            });
            console.log(`🗑️ Removidas ${result.deletedCount} aulas Duplicadas/Fantasmas.`);
        }

    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado');
    }
}

cleanDuplicates();
