const mongoose = require('mongoose');

const degrees = ['Nenhum', '1º Grau', '2º Grau', '3º Grau', '4º Grau'];

const updateAllStudentDegrees = async () => {
    try {
        // Conectar ao banco
        await mongoose.connect('mongodb://localhost:27017/arena-matrix');

        console.log('✅ Conectado ao MongoDB');

        const db = mongoose.connection.db;
        const studentsCollection = db.collection('students');

        // Contar todos os alunos
        const totalCount = await studentsCollection.countDocuments();
        console.log(`📊 Total de alunos na coleção: ${totalCount}`);

        // Buscar todos os alunos
        const allStudents = await studentsCollection.find({}).toArray();
        console.log(`📥 Alunos carregados: ${allStudents.length}`);

        let updated = 0;

        // Atualizar cada aluno com um grau aleatório
        for (const student of allStudents) {
            const randomDegree = degrees[Math.floor(Math.random() * degrees.length)];

            await studentsCollection.updateOne(
                { _id: student._id },
                { $set: { degree: randomDegree } }
            );

            updated++;

            if (updated % 100 === 0) {
                console.log(`   ✅ ${updated} alunos atualizados...`);
            }
        }

        console.log(`\n🎉 ATUALIZAÇÃO CONCLUÍDA!`);
        console.log(`📊 Total de alunos atualizados: ${updated}`);

        // Verificar distribuição
        const stats = await studentsCollection.aggregate([
            {
                $group: {
                    _id: '$degree',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]).toArray();

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
updateAllStudentDegrees();
