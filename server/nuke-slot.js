const mongoose = require('mongoose');
const Class = require('./models/Class');
require('dotenv').config();

async function checkSpecificSlot() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log('✅ Conectado ao MongoDB');

        // Buscar aulas na Quinta (4) às 07:00
        const classes = await Class.find({
            dayOfWeek: 4,
            startTime: '07:00'
        });

        console.log(`\n🔎 Aulas encontradas no Dia 4 (Quinta) às 07:00: ${classes.length}`);
        
        classes.forEach(c => {
            console.log(`ID: ${c._id} | Nome: '${c.name}' | Teacher: ${c.teacherId} | Franchise: ${c.franchiseId}`);
        });

        if (classes.length > 0) {
            console.log('\n⚠️ Detectadas aulas nesse horário.');
            
            // Pergunta de segurança (simulado) - Vamos deletar todas
            const result = await Class.deleteMany({
                dayOfWeek: 4,
                startTime: '07:00'
            });
            console.log(`🗑️ REMOVIDO TUDO nesse slot: ${result.deletedCount} aulas.`);
        } else {
            console.log('✅ Nenhuma aula encontrada neste horário (O que é estranho se ela aparece na tela!)');
        }

    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkSpecificSlot();
