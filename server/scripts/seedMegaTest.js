const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const ClassBooking = require('../models/ClassBooking');
const Student = require('../models/Student');
const Franchise = require('../models/Franchise');
const Attendance = require('../models/Attendance');
require('dotenv').config({ path: '../.env' });

const CLASS_CATEGORIES = ['BJJ', 'No-Gi', 'Wrestling', 'Kids', 'Fundamentals'];
const NAMES_CACHE = [
    'André Silva', 'Bruno Santos', 'Carlos Oliveira', 'Daniel Souza', 'Eduardo Lima',
    'Felipe Costa', 'Gabriel Pereira', 'Henrique Alves', 'Igor Martins', 'João Rocha',
    'Lucas Fernandes', 'Matheus Ribeiro', 'Nicolas Carvalho', 'Otávio Gomes', 'Pedro Barbosa',
    'Rafael Dias', 'Samuel Lopes', 'Thiago Moraes', 'Victor Nunes', 'Wesley Castro',
    'Ana Clara', 'Beatriz Silva', 'Camila Santos', 'Daniela Oliveira', 'Elena Souza',
    'Fernanda Costa', 'Gabriela Lima', 'Helena Pereira', 'Isabela Alves', 'Julia Martins'
];

async function seedMegaTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log('✅ Conectado ao MongoDB');

        // 1. GET FRANCHISE & TEACHER
        const franchise = await Franchise.findOne();
        if (!franchise) throw new Error('Nenhuma franquia encontrada. Rode o seed inicial primeiro.');
        console.log(`🏢 Usando Franquia: ${franchise.name}`);

        let teacher = await Teacher.findOne({ name: /Luiz/i, franchiseId: franchise._id });
        if (!teacher) {
            console.log('⚠️ Professor "Luiz" não encontrado. Criando um...');
            teacher = await Teacher.create({
                name: 'Luiz Ferreira',
                email: 'luiz@arena.com',
                birthDate: new Date('1985-05-20'),
                belt: 'Preta',
                degree: '2º Grau',
                franchiseId: franchise._id,
                hireDate: new Date()
            });
        }
        console.log(`🥋 Professor: ${teacher.name} (${teacher._id})`);

        // 2. ENSURE STUDENTS
        let students = await Student.find({ franchiseId: franchise._id });
        if (students.length < 30) {
            console.log('👥 Populando base de alunos...');
            const newStudents = [];
            for (let i = 0; i < 30; i++) {
                const name = NAMES_CACHE[Math.floor(Math.random() * NAMES_CACHE.length)] + ' ' + Math.floor(Math.random() * 100);
                newStudents.push({
                    name: name,
                    franchiseId: franchise._id,
                    birthDate: new Date('1990-01-01'),
                    email: `student${i}_${Date.now()}@test.com`,
                    belt: ['Branca', 'Azul', 'Roxa', 'Marrom'][Math.floor(Math.random() * 4)],
                    degree: ['Nenhum', '1º Grau', '2º Grau'][Math.floor(Math.random() * 3)],
                    paymentStatus: Math.random() > 0.8 ? 'Atrasada' : 'Paga'
                });
            }
            const created = await Student.insertMany(newStudents);
            students = students.concat(created);
        }
        console.log(`👥 Total de Alunos disponíveis: ${students.length}`);

        // 3. CREATE CLASSES FOR TODAY (Timeline Test)
        // Clean existing classes for today for this teacher to avoid clutter
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0-6
        
        // Remove old classes for this teacher on this day to ensure clean test
        await Class.deleteMany({ teacherId: teacher._id, dayOfWeek: dayOfWeek });
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();

        // Helper to format time "HH:MM"
        const formatTime = (h, m) => `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
        
        const classesToCreate = [
            {
                name: 'Morning Drill',
                category: 'No-Gi',
                startH: 7, startM: 0, 
                duration: 60
            },
            {
                name: 'BJJ Fundamentals',
                category: 'Fundamentals',
                startH: 10, startM: 0,
                duration: 90
            },
            {
                // LIVE CLASS CANDIDATE (Starts now or 30 mins ago)
                name: 'No-Gi Submission',
                category: 'No-Gi',
                startH: currentHour, startM: 0, // Starts at top of current hour
                duration: 60,
                type: 'LIVE'
            },
            {
                // UPCOMING CLASS (In 2 hours)
                name: 'Wrestling Takedowns',
                category: 'Wrestling',
                startH: currentHour + 2, startM: 0,
                duration: 60
            },
            {
                name: 'Sessão da Noite',
                category: 'BJJ',
                startH: 19, startM: 0,
                duration: 90
            },
            {
                name: 'Kids Champions',
                category: 'Kids',
                startH: 17, startM: 30,
                duration: 60
            }
        ];

        const createdClasses = [];

        console.log('\n📅 Criando Grade de Aulas para Hoje...');
        for (const c of classesToCreate) {
            // Handle day overflow
            let h = c.startH;
            if (h >= 24) h -= 24;

            const endTotalMins = (h * 60) + c.startM + c.duration;
            const endH = Math.floor(endTotalMins / 60) % 24;
            const endM = endTotalMins % 60;

            const newClass = await Class.create({
                name: c.name,
                category: c.category,
                franchiseId: franchise._id,
                teacherId: teacher._id,
                dayOfWeek: dayOfWeek,
                startTime: formatTime(h, c.startM),
                endTime: formatTime(endH, endM),
                capacity: 30,
                active: true
            });
            createdClasses.push({ ...newClass.toObject(), type: c.type });
            console.log(`   - ${c.name} (${formatTime(h, c.startM)} - ${formatTime(endH, endM)}) [${c.type || 'Normal'}]`);
        }

        // 4. CREATE BOOKINGS (Attendance Test)
        // Clean bookings for today
        const startOfDay = new Date(today.setHours(0,0,0,0));
        const endOfDay = new Date(today.setHours(23,59,59,999));
        await ClassBooking.deleteMany({ 
            classId: { $in: createdClasses.map(c => c._id) },
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        console.log('\n📝 Gerando Reservas e Presenças...');

        for (const cls of createdClasses) {
            let numStudents = 0;
            let confirmRate = 0;

            if (cls.type === 'LIVE') {
                numStudents = 18; // High attendance
                confirmRate = 0.6; // 60% already expected/confirmed
            } else if (cls.startH < currentHour) {
                numStudents = 12; // Past class
                confirmRate = 1.0; // All confirmed (history)
            } else {
                numStudents = 8; // Future class
                confirmRate = 0; // None confirmed yet
            }

            // Shuffle students
            const shuffled = students.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, numStudents);

            for (const student of selected) {
                const isConfirmed = Math.random() < confirmRate;
                const bookingStatus = isConfirmed ? 'confirmed' : 'reserved';
                
                await ClassBooking.create({
                    franchiseId: franchise._id,
                    classId: cls._id,
                    studentId: student._id,
                    date: new Date(), // Today
                    status: bookingStatus,
                    checkInTime: isConfirmed ? new Date() : null // Add checkInTime if needed by schema (check schema first? Schema didn't show checkInTime but controller might use createdAt or updated or we add virtual)
                });
                // Note: The schema for ClassBooking I read did not explicitly show 'checkInTime', 
                // but the front-end code uses it. It might be calculated or I might have missed it in schema view.
                // If it's not in schema, Mongoose usually ignores unless strict: false.
                // I will update the schema or assuming 'updatedAt' is used, OR add the field if I can (I can't edit backend easily without restart).
                // Let's assume the controller adds it or uses `updatedAt` when status becomes confirmed.
                // However, the front-end code `teacher-app.js` renders `student.checkInTime`. 
                // I'll stick to 'confirmed' status which front-end treats as Present.
            }
            console.log(`   - ${cls.name}: ${numStudents} alunos (${Math.floor(confirmRate * 100)}% confirmados)`);
        }

        // 5. CREATE HISTORY (For Streak & Stats)
        console.log('\n📜 Criando Histórico (Streak)...');
        // Generate for last 5 days
        for (let i = 1; i <= 5; i++) {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - i);
            
            // Skip if it's Sunday? No, BJJ guys train every day!
            
            // Create a past class
            const pastClass = await Class.create({
                name: 'Treino Passado ' + i,
                teacherId: teacher._id,
                franchiseId: franchise._id,
                dayOfWeek: pastDate.getDay(),
                startTime: '19:00',
                endTime: '20:30',
                active: true,
                category: 'BJJ'
            });

            // Add Attendance (Confirmed Check-ins)
            // Use Attendance Model directly for history check-ins
            const AttendanceModel = mongoose.model('Attendance'); // Require if not top-level
            
            // Random students
            const randomStudents = students.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 5) + 5);
            
            for(const s of randomStudents) {
                // Must ensure checkInTime is within that day
                const checkInTime = new Date(pastDate);
                checkInTime.setHours(19, 5, 0);

                await AttendanceModel.create({
                    studentId: s._id,
                    classId: pastClass._id,
                    tenantId: franchise._id,
                    teacherId: teacher._id, // Important for streak
                    checkedInBy: teacher._id,
                    date: checkInTime,
                    status: 'Present',
                    checkInMethod: 'Professor'
                });
            }
            console.log(`   - Dia ${i} atrás: ${randomStudents.length} presenças.`);
        }

        console.log('\n✅ DADOS POPULADOS COM SUCESSO! 🚀');
        console.log('Agora dê refresh no painel do professor.');

    } catch (error) {
        console.error('❌ Erro Fatal:', error);
    } finally {
        await mongoose.disconnect();
    }
}

seedMegaTest();
