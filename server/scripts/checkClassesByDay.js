require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Class = require('../models/Class');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log('✅ MongoDB Connected\n');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};

async function checkClasses() {
    await connectDB();

    try {
        const classesByDay = await Class.aggregate([
            { $group: { _id: '$dayOfWeek', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        console.log('📊 Distribuição de aulas por dia da semana:\n');
        
        classesByDay.forEach(day => {
            console.log(`   ${dayNames[day._id]} (${day._id}): ${day.count} aulas`);
        });

        const today = new Date().getDay();
        console.log(`\n📅 Hoje é: ${dayNames[today]} (dia ${today})`);

        // Pega algumas aulas de exemplo de diferentes dias
        console.log('\n📝 Exemplos de aulas por dia:\n');
        for (let i = 0; i < 7; i++) {
            const sample = await Class.findOne({ dayOfWeek: i }).limit(1);
            if (sample) {
                console.log(`   ${dayNames[i]}: ${sample.name} (${sample.startTime}-${sample.endTime})`);
            } else {
                console.log(`   ${dayNames[i]}: Nenhuma aula`);
            }
        }

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexão fechada');
        process.exit();
    }
}

checkClasses();
