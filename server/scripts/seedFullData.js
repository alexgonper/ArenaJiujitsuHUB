require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Franchise = require('../models/Franchise');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');

/**
 * Script para popular dados realistas para testes e validação:
 * - Grade Completa de Aulas (Agenda)
 * - Histórico de Graduação
 * - Frequência (Presenças) vinculadas a aulas reais
 * - Sequências (Streaks)
 * - Pagamentos (Financeiro)
 */
async function seed() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix';
        console.log(`Connecting to ${mongoUri}...`);

        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // 1. Clean up Classes, Attendance and Payments to avoid duplicates
        await Class.deleteMany({});
        await Attendance.deleteMany({});
        await Payment.deleteMany({});
        console.log('🗑️  Cleaned Classes, Attendance and Payments collections');

        const franchises = await Franchise.find();
        const teachers = await Teacher.find();

        if (franchises.length === 0) {
            console.log('⚠️  No franchises found.');
            process.exit(0);
        }

        const weeklySchedule = [
            // Mon-Fri
            { name: 'Jiu-Jitsu Matinal', cat: 'BJJ', time: '07:00', end: '08:30', days: [1, 2, 3, 4, 5] },
            { name: 'Jiu-Jitsu Meio-Dia', cat: 'BJJ', time: '12:00', end: '13:30', days: [1, 3, 5] },
            { name: 'Jiu-Jitsu Kids', cat: 'Kids', time: '18:00', end: '19:00', days: [1, 2, 3, 4, 5] },
            { name: 'Jiu-Jitsu Iniciante', cat: 'Fundamentals', time: '19:30', end: '21:00', days: [1, 3, 5] },
            { name: 'No-Gi Submission', cat: 'No-Gi', time: '19:30', end: '21:00', days: [2, 4] },
            { name: 'Jiu-Jitsu Avançado', cat: 'BJJ', time: '21:00', end: '22:30', days: [1, 2, 3, 4] },
            // Sat
            { name: 'Treino Livre / Open Mat', cat: 'BJJ', time: '10:00', end: '12:00', days: [6] }
        ];

        for (const franchise of franchises) {
            console.log(`\n📦 Processing Franchise: ${franchise.name} (${franchise._id})`);

            let franchiseTeachers = teachers.filter(t => t.franchiseId && t.franchiseId.toString() === franchise._id.toString());
            if (franchiseTeachers.length === 0) {
                franchiseTeachers = teachers.slice(0, 5);
            }
            const leadTeacher = franchiseTeachers[0];

            // 2. Create Grade Completa de Aulas
            const createdClasses = [];
            for (const item of weeklySchedule) {
                for (const day of item.days) {
                    const newClass = await Class.create({
                        franchiseId: franchise._id,
                        teacherId: franchiseTeachers[createdClasses.length % franchiseTeachers.length]._id,
                        name: item.name,
                        dayOfWeek: day,
                        startTime: item.time,
                        endTime: item.end,
                        category: item.cat,
                        active: true
                    });
                    createdClasses.push(newClass);
                }
            }
            console.log(`   ✅ Created ${createdClasses.length} classes in the weekly schedule`);

            // 3. Update Students
            const students = await Student.find({ franchiseId: franchise._id });
            console.log(`   👥 Processing ${students.length} students...`);

            for (const student of students) {
                const now = new Date();
                const gradDate1 = new Date(); gradDate1.setMonth(now.getMonth() - 8);
                const gradDate2 = new Date(); gradDate2.setMonth(now.getMonth() - 3);

                const history = [];
                if (student.belt !== 'Branca') {
                    history.push({ belt: 'Branca', degree: 'Nenhum', date: gradDate1, promotedBy: leadTeacher._id });
                }
                history.push({ belt: student.belt, degree: student.degree, date: gradDate2, promotedBy: leadTeacher._id });

                await Student.findByIdAndUpdate(student._id, {
                    lastGraduationDate: gradDate2,
                    graduationHistory: history
                });

                // 4. Create Attendance Records linked to REAL classes
                const attendanceRecords = [];

                // Past attendance
                const numPastClasses = Math.floor(Math.random() * 20) + 25;
                for (let j = 0; j < numPastClasses; j++) {
                    const daysAgo = Math.floor(Math.random() * 80) + 7;
                    const attendanceDate = new Date();
                    attendanceDate.setDate(now.getDate() - daysAgo);

                    const dayOfWeek = attendanceDate.getDay();
                    const possibilities = createdClasses.filter(c => c.dayOfWeek === dayOfWeek);

                    if (possibilities.length > 0) {
                        const randomClass = possibilities[Math.floor(Math.random() * possibilities.length)];
                        attendanceRecords.push({
                            tenantId: franchise._id,
                            studentId: student._id,
                            classId: randomClass._id,
                            date: attendanceDate,
                            status: 'Present'
                        });
                    }
                }

                // Recent Streak (matching class schedule)
                const streakLength = Math.floor(Math.random() * 4) + 3;
                for (let s = 0; s < streakLength; s++) {
                    const streakDate = new Date();
                    streakDate.setDate(now.getDate() - s);

                    const dayOfWeek = streakDate.getDay();
                    const possibilities = createdClasses.filter(c => c.dayOfWeek === dayOfWeek);

                    if (possibilities.length > 0) {
                        const randomClass = possibilities[Math.floor(Math.random() * possibilities.length)];
                        attendanceRecords.push({
                            tenantId: franchise._id,
                            studentId: student._id,
                            classId: randomClass._id,
                            date: streakDate,
                            status: 'Present'
                        });
                    }
                }

                if (attendanceRecords.length > 0) {
                    await Attendance.insertMany(attendanceRecords);
                }

                // 5. Payments
                const payments = [];
                const monthlyFee = student.amount || 250;
                for (let m = 0; m < 4; m++) {
                    const payDate = new Date();
                    payDate.setMonth(now.getMonth() - m); payDate.setDate(5);
                    payments.push({
                        franchiseId: franchise._id,
                        studentId: student._id,
                        amount: monthlyFee,
                        type: 'Tuition',
                        status: 'approved',
                        paymentMethod: 'credit_card',
                        paidAt: payDate,
                        split: { matrixAmount: monthlyFee * 0.1, franchiseAmount: monthlyFee * 0.9, matrixRate: 10 }
                    });
                }
                await Payment.insertMany(payments);
            }
            console.log(`   ✅ Success for ${franchise.name}`);
        }

        console.log('\n🎉 ALL DATA SEEDED SUCCESSFULLY WITH FULL SCHEDULE!');
        process.exit(0);
    } catch (err) {
        console.error('❌ ERROR:', err);
        process.exit(1);
    }
}

seed();
