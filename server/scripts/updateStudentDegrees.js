require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');

const degrees = ['Nenhum', '1º Grau', '2º Grau', '3º Grau', '4º Grau'];

const updateStudentDegrees = async () => {
    try {
        // Conectar ao banco
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Conectado ao MongoDB');

        // Buscar todos os alunos
        const students = await Student.find({});
        console.log(`📊 Encontrados ${students.length} alunos`);

        let updated = 0;

        // Atualizar cada aluno com um grau aleatório
        for (const student of students) {
            const randomDegree = degrees[Math.floor(Math.random() * degrees.length)];

            await Student.findByIdAndUpdate(student._id, {
                degree: randomDegree
            });

            updated++;

            if (updated % 100 === 0) {
                console.log(`   ✅ ${updated} alunos atualizados...`);
            }
        }

        console.log(`\n🎉 ATUALIZAÇÃO CONCLUÍDA!`);
        console.log(`📊 Total de alunos atualizados: ${updated}`);

        // Verificar distribuição
        const stats = await Student.aggregate([
            {
                $group: {
                    _id: '$degree',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        console.log('\n📈 Distribuição de graus:');
        stats.forEach(stat => {
            console.log(`   ${stat._id}: ${stat.count} alunos`);
        });

        // Fechar conexão
        await mongoose.connection.close();
        console.log('\n👋 Conexão fechada');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro ao atualizar alunos:', error);
        process.exit(1);
    }
};

// Executar atualização
updateStudentDegrees();
