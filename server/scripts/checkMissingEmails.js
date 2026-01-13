const mongoose = require('mongoose');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix';

async function checkMissingEmails() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado ao MongoDB!\n');

        // Contar alunos
        const totalStudents = await Student.countDocuments();
        const studentsWithEmail = await Student.countDocuments({
            email: { $exists: true, $ne: '', $ne: null }
        });
        const studentsWithoutEmail = await Student.countDocuments({
            $or: [
                { email: { $exists: false } },
                { email: null },
                { email: '' }
            ]
        });

        // Contar professores
        const totalTeachers = await Teacher.countDocuments();
        const teachersWithEmail = await Teacher.countDocuments({
            email: { $exists: true, $ne: '', $ne: null }
        });
        const teachersWithoutEmail = await Teacher.countDocuments({
            $or: [
                { email: { $exists: false } },
                { email: null },
                { email: '' }
            ]
        });

        console.log('═══════════════════════════════════════');
        console.log('📊 RELATÓRIO DE EMAILS NO BANCO DE DADOS');
        console.log('═══════════════════════════════════════\n');

        console.log('📚 ALUNOS:');
        console.log(`   Total de alunos: ${totalStudents}`);
        console.log(`   ✅ Com email: ${studentsWithEmail}`);
        console.log(`   ❌ Sem email: ${studentsWithoutEmail}`);
        console.log(`   📊 Percentual com email: ${((studentsWithEmail / totalStudents) * 100).toFixed(1)}%\n`);

        console.log('👨‍🏫 PROFESSORES:');
        console.log(`   Total de professores: ${totalTeachers}`);
        console.log(`   ✅ Com email: ${teachersWithEmail}`);
        console.log(`   ❌ Sem email: ${teachersWithoutEmail}`);
        console.log(`   📊 Percentual com email: ${((teachersWithEmail / totalTeachers) * 100).toFixed(1)}%\n`);

        console.log('═══════════════════════════════════════');
        console.log('📈 TOTAL GERAL:');
        console.log(`   Total de registros: ${totalStudents + totalTeachers}`);
        console.log(`   ✅ Com email: ${studentsWithEmail + teachersWithEmail}`);
        console.log(`   ❌ Sem email: ${studentsWithoutEmail + teachersWithoutEmail}`);
        console.log('═══════════════════════════════════════\n');

        // Se houver registros sem email, mostrar alguns exemplos
        if (studentsWithoutEmail > 0) {
            console.log('⚠️  EXEMPLOS DE ALUNOS SEM EMAIL:');
            const studentsNoEmail = await Student.find({
                $or: [
                    { email: { $exists: false } },
                    { email: null },
                    { email: '' }
                ]
            }).limit(5);
            studentsNoEmail.forEach((student, index) => {
                console.log(`   ${index + 1}. ${student.name} (ID: ${student._id})`);
            });
            console.log('');
        }

        if (teachersWithoutEmail > 0) {
            console.log('⚠️  EXEMPLOS DE PROFESSORES SEM EMAIL:');
            const teachersNoEmail = await Teacher.find({
                $or: [
                    { email: { $exists: false } },
                    { email: null },
                    { email: '' }
                ]
            }).limit(5);
            teachersNoEmail.forEach((teacher, index) => {
                console.log(`   ${index + 1}. ${teacher.name} (ID: ${teacher._id})`);
            });
            console.log('');
        }

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

checkMissingEmails();
