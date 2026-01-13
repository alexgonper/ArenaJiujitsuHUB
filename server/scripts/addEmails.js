const mongoose = require('mongoose');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// Conectar ao MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix';

/**
 * Gera um email aleatório baseado no nome
 */
function generateRandomEmail(name) {
    // Remove acentos e caracteres especiais
    const cleanName = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .trim();

    // Pega o primeiro e último nome
    const nameParts = cleanName.split(' ').filter(part => part.length > 0);
    const firstName = nameParts[0] || 'user';
    const lastName = nameParts[nameParts.length - 1] || 'name';

    // Domínios de email comuns
    const domains = [
        'gmail.com',
        'hotmail.com',
        'outlook.com',
        'yahoo.com.br',
        'icloud.com',
        'uol.com.br',
        'bol.com.br',
        'terra.com.br'
    ];

    // Escolhe um domínio aleatório
    const domain = domains[Math.floor(Math.random() * domains.length)];

    // Adiciona um número aleatório para evitar duplicatas
    const randomNum = Math.floor(Math.random() * 9999);

    // Formatos possíveis de email
    const formats = [
        `${firstName}.${lastName}${randomNum}@${domain}`,
        `${firstName}${lastName}${randomNum}@${domain}`,
        `${firstName}_${lastName}${randomNum}@${domain}`,
        `${firstName}${randomNum}@${domain}`
    ];

    return formats[Math.floor(Math.random() * formats.length)];
}

/**
 * Adiciona emails aos alunos
 */
async function addEmailsToStudents() {
    try {
        console.log('🔍 Buscando alunos sem email...');
        const students = await Student.find({
            $or: [
                { email: { $exists: false } },
                { email: null },
                { email: '' }
            ]
        });

        console.log(`📧 Encontrados ${students.length} alunos sem email`);

        let updated = 0;
        for (const student of students) {
            const email = generateRandomEmail(student.name);
            student.email = email;
            await student.save();
            updated++;

            if (updated % 50 === 0) {
                console.log(`   ✓ ${updated}/${students.length} alunos atualizados...`);
            }
        }

        console.log(`✅ ${updated} alunos atualizados com emails!`);
        return updated;
    } catch (error) {
        console.error('❌ Erro ao adicionar emails aos alunos:', error);
        throw error;
    }
}

/**
 * Adiciona emails aos professores
 */
async function addEmailsToTeachers() {
    try {
        console.log('🔍 Buscando professores sem email...');
        const teachers = await Teacher.find({
            $or: [
                { email: { $exists: false } },
                { email: null },
                { email: '' }
            ]
        });

        console.log(`📧 Encontrados ${teachers.length} professores sem email`);

        let updated = 0;
        for (const teacher of teachers) {
            const email = generateRandomEmail(teacher.name);
            teacher.email = email;
            await teacher.save();
            updated++;

            if (updated % 20 === 0) {
                console.log(`   ✓ ${updated}/${teachers.length} professores atualizados...`);
            }
        }

        console.log(`✅ ${updated} professores atualizados com emails!`);
        return updated;
    } catch (error) {
        console.error('❌ Erro ao adicionar emails aos professores:', error);
        throw error;
    }
}

/**
 * Função principal
 */
async function main() {
    try {
        console.log('🚀 Iniciando migração de emails...\n');
        console.log(`📡 Conectando ao MongoDB: ${MONGODB_URI}\n`);

        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Conectado ao MongoDB!\n');

        // Adiciona emails aos alunos
        const studentsUpdated = await addEmailsToStudents();
        console.log('');

        // Adiciona emails aos professores
        const teachersUpdated = await addEmailsToTeachers();
        console.log('');

        console.log('═══════════════════════════════════════');
        console.log('📊 RESUMO DA MIGRAÇÃO');
        console.log('═══════════════════════════════════════');
        console.log(`   Alunos atualizados: ${studentsUpdated}`);
        console.log(`   Professores atualizados: ${teachersUpdated}`);
        console.log(`   Total: ${studentsUpdated + teachersUpdated}`);
        console.log('═══════════════════════════════════════\n');

        console.log('✅ Migração concluída com sucesso!');

    } catch (error) {
        console.error('❌ Erro durante a migração:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Conexão com MongoDB fechada');
        process.exit(0);
    }
}

// Executar script
main();
