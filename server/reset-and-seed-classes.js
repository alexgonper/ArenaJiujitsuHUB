const mongoose = require('mongoose');
const Class = require('./models/Class');
const ClassBooking = require('./models/ClassBooking');
const Attendance = require('./models/Attendance');
const Franchise = require('./models/Franchise');
const Teacher = require('./models/Teacher');
require('dotenv').config();

const CLASS_NAMES = [
    'Jiu-Jitsu Avançado', 'Jiu-Jitsu Iniciante', 'Jiu-Jitsu Fundamentals', 'Jiu-Jitsu All Levels',
    'No-Gi Submission', 'No-Gi Competition', 'No-Gi Open Mat', 'Wrestling Basics', 'Wrestling Takedowns',
    'Kids Fundamentals', 'Kids Advanced', 'Kids Future Champions', 'Self-Defense', 'Defesa Pessoal',
    'Técnicas de Guarda', 'Técnicas de Passagem', 'Drills & Tática', 'Sparring Avançado', 'Treino Livre (Open Mat)',
    'Jiu-Jitsu Matinal', 'Jiu-Jitsu Meio-Dia', 'Jiu-Jitsu Noturno'
];

const TIMES = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '19:30', '20:00', '21:00'
];

async function getRandomTeacher(franchiseId) {
    const teachers = await Teacher.find({ franchiseId });
    if (teachers.length === 0) return null;
    return teachers[Math.floor(Math.random() * teachers.length)];
}

function addMinutes(time, mins) {
    const [h, m] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + mins);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

async function resetAndSeedClasses() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log('✅ Conectado ao MongoDB');

        // 1. CLEAR DATA
        console.log('🗑️ Apagando dados de aulas antigos...');
        await Class.deleteMany({});
        await ClassBooking.deleteMany({});
        await Attendance.deleteMany({});
        console.log('✅ Dados antigos removidos.');

        // 2. FETCH FRANCHISES
        const franchises = await Franchise.find({});
        console.log(`🏢 Encontradas ${franchises.length} franquias.`);

        // 3. SEED CLASSES PER FRANCHISE
        for (const franchise of franchises) {
            console.log(`\n🔹 Gerando aulas para: ${franchise.name}...`);
            
            const teacherList = await Teacher.find({ franchiseId: franchise._id });
            if (teacherList.length === 0) {
                console.warn(`⚠️ Aviso: Franquia ${franchise.name} não tem professores cadastrados. Pulando.`);
                continue;
            }

            const classesToCreate = [];
            
            // Create 30 classes
            for (let i = 0; i < 30; i++) {
                const randomName = CLASS_NAMES[Math.floor(Math.random() * CLASS_NAMES.length)];
                const randomDay = Math.floor(Math.random() * 7); // 0-6
                const randomTime = TIMES[Math.floor(Math.random() * TIMES.length)];
                const randomTeacher = teacherList[Math.floor(Math.random() * teacherList.length)];
                const duration = Math.random() > 0.5 ? 60 : 90;
                
                classesToCreate.push({
                    name: randomName,
                    franchiseId: franchise._id,
                    teacherId: randomTeacher._id,
                    dayOfWeek: randomDay, // 0=Sun, 6=Sat
                    startTime: randomTime,
                    endTime: addMinutes(randomTime, duration),
                    capacity: Math.random() > 0.5 ? 20 : 30,
                    active: true,
                    description: `Aula de ${randomName} com professor ${randomTeacher.name}`
                });
            }

            await Class.insertMany(classesToCreate);
            console.log(`✅ ${classesToCreate.length} aulas criadas para ${franchise.name}.`);
        }

        console.log('\n✨ Processo concluído com sucesso!');

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado');
    }
}

resetAndSeedClasses();
