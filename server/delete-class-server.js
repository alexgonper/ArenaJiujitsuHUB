const mongoose = require('mongoose');
const Class = require('./models/Class');
require('dotenv').config();

async function deleteClass() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log('✅ Conectado ao MongoDB');

        // Buscar a aula específica
        const classToDelete = await Class.findOne({
            name: { $regex: 'No-Gi Competition', $options: 'i' },
            startTime: '07:00'
        });

        if (classToDelete) {
            console.log(`📌 Aula encontrada: ${classToDelete.name} (${classToDelete._id})`);
            await Class.deleteOne({ _id: classToDelete._id });
            console.log('🗑️ Aula removida com sucesso!');
        } else {
            console.log('❌ Aula não encontrada com esses critérios.');
        }

    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado');
    }
}

deleteClass();
