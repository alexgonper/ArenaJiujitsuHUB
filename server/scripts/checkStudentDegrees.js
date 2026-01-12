const mongoose = require('mongoose');
const Student = require('../models/Student');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/arenahub', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function checkStudents() {
    try {
        const students = await Student.find().limit(10);

        console.log('\n=== Verificando Alunos ===\n');
        console.log(`Total de alunos encontrados: ${students.length}\n`);

        students.forEach((student, index) => {
            console.log(`${index + 1}. ${student.name}`);
            console.log(`   Faixa: ${student.belt}`);
            console.log(`   Grau: ${student.degree || 'NÃO DEFINIDO'}`);
            console.log(`   Franchise ID: ${student.franchiseId}`);
            console.log('');
        });

        // Verificar quantos alunos não têm grau definido
        const withoutDegree = await Student.countDocuments({
            $or: [
                { degree: { $exists: false } },
                { degree: null },
                { degree: '' }
            ]
        });

        console.log(`\nAlunos sem grau definido: ${withoutDegree}`);

        mongoose.connection.close();
    } catch (error) {
        console.error('Erro:', error);
        mongoose.connection.close();
    }
}

checkStudents();
