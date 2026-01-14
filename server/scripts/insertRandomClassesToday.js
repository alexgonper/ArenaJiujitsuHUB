require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Franchise = require('../models/Franchise');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};

// Opções de nomes de aulas
const classNames = [
    { name: 'Jiu-Jitsu Fundamentals', category: 'Fundamentals' },
    { name: 'Jiu-Jitsu Avançado', category: 'BJJ' },
    { name: 'No-Gi Competition', category: 'No-Gi' },
    { name: 'No-Gi Submission', category: 'No-Gi' },
    { name: 'Wrestling Basics', category: 'Wrestling' },
    { name: 'Wrestling Takedowns', category: 'Wrestling' },
    { name: 'Kids Jiu-Jitsu', category: 'Kids' },
    { name: 'Kids Fundamentals', category: 'Kids' },
    { name: 'Jiu-Jitsu Iniciante', category: 'Fundamentals' },
    { name: 'Jiu-Jitsu Matinal', category: 'Fundamentals' },
    { name: 'Treino Livre (Open Mat)', category: 'BJJ' },
    { name: 'Técnicas de Guarda', category: 'BJJ' },
    { name: 'Técnicas de Passagem', category: 'BJJ' },
    { name: 'Jiu-Jitsu Noturno', category: 'BJJ' },
    { name: 'Sparring Avançado', category: 'BJJ' },
    { name: 'No-Gi Open Mat', category: 'No-Gi' },
    { name: 'Kids Advanced', category: 'Kids' },
    { name: 'Self-Defense', category: 'Fundamentals' }
];

// Horários possíveis
const timeSlots = [
    { start: '06:00', end: '07:30' },
    { start: '07:00', end: '08:30' },
    { start: '08:00', end: '09:30' },
    { start: '09:00', end: '10:30' },
    { start: '10:00', end: '11:00' }, // Kids
    { start: '11:00', end: '12:30' },
    { start: '12:00', end: '13:30' },
    { start: '14:00', end: '15:00' }, // Kids
    { start: '15:00', end: '16:30' },
    { start: '16:00', end: '17:00' }, // Kids
    { start: '17:00', end: '18:30' },
    { start: '18:00', end: '19:30' },
    { start: '19:00', end: '20:30' },
    { start: '20:00', end: '21:30' },
    { start: '21:00', end: '22:00' }
];

// Função para escolher aleatoriamente de um array
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Função para distribuir aulas entre professores
const distributeClasses = (numClasses, teachers) => {
    const distribution = new Array(teachers.length).fill(0);
    
    // Primeiro, garante que cada professor tenha pelo menos 1 aula
    for (let i = 0; i < teachers.length; i++) {
        distribution[i] = 1;
    }
    
    // Distribui as aulas restantes aleatoriamente
    let remaining = numClasses - teachers.length;
    while (remaining > 0) {
        const randomIndex = Math.floor(Math.random() * teachers.length);
        distribution[randomIndex]++;
        remaining--;
    }
    
    return distribution;
};

async function insertRandomClassesToday() {
    await connectDB();

    try {
        // Pega todas as academias ativas
        const franchises = await Franchise.find({ status: 'active' });
        console.log(`\n📊 Encontradas ${franchises.length} academias ativas\n`);

        if (franchises.length === 0) {
            console.log('❌ Nenhuma academia ativa encontrada!');
            process.exit();
        }

        const today = new Date().getDay(); // 0-6 (Domingo-Sábado)
        const todayDate = new Date().toLocaleDateString('pt-BR');
        console.log(`📅 Dia de hoje: ${today} (${todayDate})\n`);

        let totalClassesInserted = 0;

        // Para cada academia
        for (const franchise of franchises) {
            console.log(`\n🏢 Processando: ${franchise.name}`);

            // Busca professores ativos desta academia
            const teachers = await Teacher.find({ 
                franchiseId: franchise._id,
                active: true 
            });

            if (teachers.length === 0) {
                console.log(`   ⚠️  Nenhum professor ativo encontrado - pulando...`);
                continue;
            }

            console.log(`   👨‍🏫 Professores encontrados: ${teachers.length}`);
            teachers.forEach(t => console.log(`      - ${t.name} (${t.belt})`));

            // Remove aulas existentes para hoje (para evitar duplicados)
            const deletedClasses = await Class.deleteMany({
                franchiseId: franchise._id,
                dayOfWeek: today
            });
            console.log(`   🗑️  Removidas ${deletedClasses.deletedCount} aulas existentes para hoje`);

            // Distribui 20 aulas entre os professores
            const classesPerTeacher = distributeClasses(20, teachers);
            console.log(`   📊 Distribuição de aulas:`, classesPerTeacher);

            const classesToInsert = [];

            // Cria aulas para cada professor
            for (let i = 0; i < teachers.length; i++) {
                const teacher = teachers[i];
                const numClasses = classesPerTeacher[i];

                console.log(`   📝 Criando ${numClasses} aulas para ${teacher.name}`);

                for (let j = 0; j < numClasses; j++) {
                    const classInfo = randomChoice(classNames);
                    const timeSlot = randomChoice(timeSlots);

                    classesToInsert.push({
                        franchiseId: franchise._id,
                        teacherId: teacher._id,
                        name: classInfo.name,
                        category: classInfo.category,
                        dayOfWeek: today,
                        startTime: timeSlot.start,
                        endTime: timeSlot.end,
                        capacity: Math.floor(Math.random() * 20) + 15, // 15-35 alunos
                        active: true
                    });
                }
            }

            // Insere todas as aulas
            await Class.insertMany(classesToInsert);
            totalClassesInserted += classesToInsert.length;

            console.log(`   ✅ ${classesToInsert.length} aulas inseridas com sucesso!`);
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log(`✅ PROCESSO CONCLUÍDO!`);
        console.log(`📊 Total de aulas inseridas: ${totalClassesInserted}`);
        console.log(`🏢 Academias processadas: ${franchises.length}`);
        console.log(`${'='.repeat(60)}\n`);

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexão com MongoDB fechada');
        process.exit();
    }
}

insertRandomClassesToday();
