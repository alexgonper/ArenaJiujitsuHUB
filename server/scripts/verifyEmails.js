const mongoose = require('mongoose');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix';

async function verifyEmails() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado ao MongoDB!\n');

        // Verifica alguns alunos
        console.log('📚 EXEMPLOS DE ALUNOS COM EMAIL:');
        console.log('═══════════════════════════════════════');
        const students = await Student.find({ email: { $exists: true, $ne: '' } }).limit(5);
        students.forEach((student, index) => {
            console.log(`${index + 1}. ${student.name}`);
            console.log(`   📧 Email: ${student.email}`);
            console.log(`   🥋 Faixa: ${student.belt}`);
            console.log('');
        });

        // Verifica alguns professores
        console.log('👨‍🏫 EXEMPLOS DE PROFESSORES COM EMAIL:');
        console.log('═══════════════════════════════════════');
        const teachers = await Teacher.find({ email: { $exists: true, $ne: '' } }).limit(5);
        teachers.forEach((teacher, index) => {
            console.log(`${index + 1}. ${teacher.name}`);
            console.log(`   📧 Email: ${teacher.email}`);
            console.log(`   🥋 Faixa: ${teacher.belt} - ${teacher.degree}`);
            console.log('');
        });

        // Estatísticas
        const totalStudents = await Student.countDocuments();
        const studentsWithEmail = await Student.countDocuments({ email: { $exists: true, $ne: '' } });
        const totalTeachers = await Teacher.countDocuments();
        const teachersWithEmail = await Teacher.countDocuments({ email: { $exists: true, $ne: '' } });

        console.log('📊 ESTATÍSTICAS:');
        console.log('═══════════════════════════════════════');
        console.log(`Alunos com email: ${studentsWithEmail}/${totalStudents}`);
        console.log(`Professores com email: ${teachersWithEmail}/${totalTeachers}`);
        console.log('═══════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

verifyEmails();
