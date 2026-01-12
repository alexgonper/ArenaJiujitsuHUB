const mongoose = require('mongoose');
const Student = require('../models/Student');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/arenahub');

async function checkDegrees() {
    try {
        // Contar alunos por grau
        const degreeStats = await Student.aggregate([
            {
                $group: {
                    _id: '$degree',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        console.log('\n=== ESTATÍSTICAS DE GRAUS ===\n');

        degreeStats.forEach(stat => {
            console.log(`${stat._id || 'Não definido'}: ${stat.count} alunos`);
        });

        console.log('\n=== EXEMPLOS DE ALUNOS COM GRAUS ===\n');

        // Mostrar exemplos de alunos com cada grau
        const degrees = ['1º Grau', '2º Grau', '3º Grau', '4º Grau'];

        for (const degree of degrees) {
            const students = await Student.find({ degree }).limit(3);
            if (students.length > 0) {
                console.log(`\n${degree}:`);
                students.forEach(s => {
                    console.log(`  - ${s.name} (${s.belt})`);
                });
            }
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('Erro:', error);
        mongoose.connection.close();
    }
}

checkDegrees();
