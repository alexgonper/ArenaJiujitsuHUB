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
    { name: 'Self-Defense', category: 'Fundamentals' },
    { name: 'Drills & Tática', category: 'BJJ' },
    { name: 'Jiu-Jitsu Meio-Dia', category: 'Fundamentals' },
    { name: 'Defesa Pessoal', category: 'Fundamentals' },
    { name: 'Kids Future Champions', category: 'Kids' }
];

// Horários por período do dia
const weekdayTimeSlots = [
    { start: '06:00', end: '07:30' },
    { start: '07:00', end: '08:30' },
    { start: '08:00', end: '09:30' },
    { start: '09:00', end: '10:30' },
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:30' },
    { start: '12:00', end: '13:30' },
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:30' },
    { start: '16:00', end: '17:00' },
    { start: '17:00', end: '18:30' },
    { start: '18:00', end: '19:30' },
    { start: '19:00', end: '20:30' },
    { start: '19:30', end: '21:00' },
    { start: '20:00', end: '21:30' },
    { start: '21:00', end: '22:30' }
];

// Horários para fins de semana (diferentes - mais Open Mat e Kids)
const weekendTimeSlots = [
    { start: '08:00', end: '09:30' },
    { start: '09:00', end: '10:30' },
    { start: '10:00', end: '12:00' }, // Open Mat
    { start: '11:00', end: '12:30' },
    { start: '14:00', end: '15:30' },
    { start: '15:00', end: '16:00' },
    { start: '16:00', end: '17:30' },
    { start: '17:00', end: '18:30' }
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

async function insertWeeklyClasses() {
    await connectDB();

    try {
        // Pega todas as academias ativas
        const franchises = await Franchise.find({ status: 'active' });
        console.log(`\n📊 Encontradas ${franchises.length} academias ativas\n`);

        if (franchises.length === 0) {
            console.log('❌ Nenhuma academia ativa encontrada!');
            process.exit();
        }

        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        let totalClassesInserted = 0;

        console.log(`${'='.repeat(70)}`);
        console.log(`🗓️  INICIANDO POPULAÇÃO DE AULAS SEMANAIS`);
        console.log(`${'='.repeat(70)}\n`);

        // Para cada academia
        for (const franchise of franchises) {
            console.log(`\n🏢 ${franchise.name}`);
            console.log(`${'─'.repeat(70)}`);

            // Busca professores ativos desta academia
            const teachers = await Teacher.find({ 
                franchiseId: franchise._id,
                active: true 
            });

            if (teachers.length === 0) {
                console.log(`   ⚠️  Nenhum professor ativo - pulando...\n`);
                continue;
            }

            console.log(`   👨‍🏫 Professores: ${teachers.map(t => t.name).join(', ')}\n`);

            // Remove TODAS as aulas existentes desta academia
            const deletedClasses = await Class.deleteMany({
                franchiseId: franchise._id
            });
            console.log(`   🗑️  Removidas ${deletedClasses.deletedCount} aulas antigas\n`);

            let franchiseTotal = 0;

            // Para cada dia da semana (0-6)
            for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const timeSlots = isWeekend ? weekendTimeSlots : weekdayTimeSlots;
                const numClasses = isWeekend ? 15 : 20; // Menos aulas no fim de semana

                // Distribui aulas entre professores
                const classesPerTeacher = distributeClasses(numClasses, teachers);
                const classesToInsert = [];

                // Cria aulas para cada professor
                for (let i = 0; i < teachers.length; i++) {
                    const teacher = teachers[i];
                    const numTeacherClasses = classesPerTeacher[i];

                    for (let j = 0; j < numTeacherClasses; j++) {
                        const classInfo = randomChoice(classNames);
                        const timeSlot = randomChoice(timeSlots);

                        classesToInsert.push({
                            franchiseId: franchise._id,
                            teacherId: teacher._id,
                            name: classInfo.name,
                            category: classInfo.category,
                            dayOfWeek: dayOfWeek,
                            startTime: timeSlot.start,
                            endTime: timeSlot.end,
                            capacity: Math.floor(Math.random() * 20) + 15, // 15-35 alunos
                            active: true
                        });
                    }
                }

                // Insere todas as aulas deste dia
                await Class.insertMany(classesToInsert);
                franchiseTotal += classesToInsert.length;
                totalClassesInserted += classesToInsert.length;

                console.log(`   📅 ${dayNames[dayOfWeek].padEnd(10)} → ${classesToInsert.length} aulas criadas`);
            }

            console.log(`\n   ✅ Total desta academia: ${franchiseTotal} aulas\n`);
        }

        console.log(`\n${'='.repeat(70)}`);
        console.log(`✅ POPULAÇÃO SEMANAL CONCLUÍDA!`);
        console.log(`${'='.repeat(70)}`);
        console.log(`📊 Total de aulas inseridas: ${totalClassesInserted}`);
        console.log(`🏢 Academias processadas: ${franchises.length}`);
        console.log(`📈 Média por academia: ${Math.round(totalClassesInserted / franchises.length)} aulas/semana`);
        console.log(`${'='.repeat(70)}\n`);

        // Mostra resumo por dia da semana
        console.log(`📊 RESUMO POR DIA DA SEMANA:\n`);
        const classesByDay = await Class.aggregate([
            { $group: { _id: '$dayOfWeek', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        classesByDay.forEach(day => {
            console.log(`   ${dayNames[day._id].padEnd(10)}: ${day.count} aulas`);
        });
        console.log('');

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Conexão com MongoDB fechada\n');
        process.exit();
    }
}

insertWeeklyClasses();
