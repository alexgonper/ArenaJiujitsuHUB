const mongoose = require('mongoose');
const Student = require('../models/Student');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/arenahub');

async function findSpecificStudents() {
    try {
        const names = ['Ana Ferreira', 'Ana Rodrigues', 'André Alves'];

        console.log('\n=== BUSCANDO ALUNOS ESPECÍFICOS ===\n');

        for (const name of names) {
            const students = await Student.find({
                name: { $regex: name, $options: 'i' }
            });

            if (students.length > 0) {
                students.forEach(s => {
                    console.log(`Nome: ${s.name}`);
                    console.log(`Faixa: ${s.belt}`);
                    console.log(`Grau: ${s.degree}`);
                    console.log(`ID: ${s._id}`);
                    console.log(`Franchise: ${s.franchiseId}`);
                    console.log('---');
                });
            } else {
                console.log(`❌ Não encontrado: ${name}\n`);
            }
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('Erro:', error);
        mongoose.connection.close();
    }
}

findSpecificStudents();
