const mongoose = require('mongoose');
const Class = require('./models/Class');
require('dotenv').config();

async function nukeAllNoGi() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log('✅ Conectado ao MongoDB');

        // Buscar aulas 
        const count = await Class.countDocuments({ name: { $regex: 'No-Gi Competition', $options: 'i' } });
        console.log(`🎯 Encontradas ${count} aulas 'No-Gi Competition' totais.`);

        const result = await Class.deleteMany({
            name: { $regex: 'No-Gi Competition', $options: 'i' }
        });
        
        console.log(`💥 APAGADAS: ${result.deletedCount} aulas.`);

    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await mongoose.disconnect();
    }
}

nukeAllNoGi();
