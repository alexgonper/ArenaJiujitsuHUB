const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Franchise = require('../models/Franchise');
const Metric = require('../models/Metric');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected to seed metrics...');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const generateMonthlyMetrics = async () => {
    try {
        await connectDB();

        // Clear existing metrics and base collections for consistency
        await Metric.deleteMany();
        await Student.deleteMany();
        await Teacher.deleteMany();
        console.log('Existing metrics, students and teachers cleared.');

        const franchises = await Franchise.find();
        const baseMonths = 12;
        const now = new Date();

        const studentNames = ["Gabriel", "Lucas", "Mateus", "Vitor", "Pedro", "João", "Enzo", "Guilherme", "Rafael", "Felipe", "Bruno", "Daniel", "Gustavo", "Thiago", "Rodrigo", "André", "Leonardo", "Marcelo", "Arthur", "Mário", "Ana", "Beatriz", "Carla", "Daniela", "Eduarda", "Fernanda", "Gabriela", "Helena", "Isabela", "Júlia", "Kátia", "Larissa", "Mariana", "Natália", "Olívia", "Patrícia", "Renata", "Sofia", "Tatiana", "Vanessa"];
        const lastNames = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Carvalho", "Martins", "Araújo", "Pinto", "Barbosa", "Ribeiro", "Melo", "Cardoso", "Teixeira"];
        const belts = ['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta'];

        for (const franchise of franchises) {
            console.log(`Generating data for: ${franchise.name}`);

            // Random base values for this franchise
            let currentStudents = Math.floor(Math.random() * 40) + 30; // 30 to 70
            let currentTeachers = Math.floor(Math.random() * 4) + 2;   // 2 to 6
            let baseRevenuePerStudent = 180 + Math.random() * 40;
            let expensePercentage = 0.35 + Math.random() * 0.15;

            for (let i = baseMonths; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

                // Add some growth/variation
                let growthRate = 1 + (Math.random() * 0.08 - 0.02); // -2% to +6% growth

                // SIMULATE BAD PERFORMANCE FOR LONDON AND PARIS
                if (franchise.name.includes('London') || franchise.name.includes('Paris')) {
                    growthRate = 1 + (Math.random() * 0.05 - 0.08); // -8% to -3% decline
                    expensePercentage = 0.55 + Math.random() * 0.20; // High expenses
                }

                currentStudents = Math.max(10, Math.floor(currentStudents * growthRate));

                const newStudents = Math.floor(currentStudents * 0.12);
                const churn = Math.floor(currentStudents * 0.04);

                const monthlyRevenue = currentStudents * baseRevenuePerStudent;
                const monthlyExpenses = monthlyRevenue * expensePercentage;

                await Metric.create({
                    franchiseId: franchise._id,
                    period,
                    students: {
                        total: currentStudents,
                        new: newStudents,
                        churn: churn
                    },
                    finance: {
                        revenue: monthlyRevenue,
                        expenses: monthlyExpenses,
                        profit: monthlyRevenue - monthlyExpenses
                    },
                    teachers: {
                        count: currentTeachers
                    }
                });

                // If this is the LATEST month, sync it with Student/Teacher collection
                if (i === 0) {
                    console.log(`  -> Seeding ${currentStudents} students and ${currentTeachers} teachers for consistency...`);

                    // Create Students
                    for (let s = 0; s < currentStudents; s++) {
                        const name = studentNames[Math.floor(Math.random() * studentNames.length)] + " " + lastNames[Math.floor(Math.random() * lastNames.length)];
                        await Student.create({
                            name,
                            gender: Math.random() > 0.5 ? 'Masculino' : 'Feminino',
                            birthDate: new Date(Date.now() - (18 + Math.random() * 30) * 365 * 24 * 60 * 60 * 1000), // 18-48 years old
                            belt: belts[Math.floor(Math.random() * belts.length)],
                            degree: 'Nenhum',
                            amount: baseRevenuePerStudent,
                            paymentStatus: Math.random() > 0.1 ? 'Paga' : 'Atrasada',
                            phone: '+55 11 9' + Math.floor(10000000 + Math.random() * 90000000),
                            franchiseId: franchise._id
                        });
                    }

                    // Create Teachers
                    for (let t = 0; t < currentTeachers; t++) {
                        const name = studentNames[Math.floor(Math.random() * studentNames.length)] + " " + lastNames[Math.floor(Math.random() * lastNames.length)];
                        await Teacher.create({
                            name,
                            gender: Math.random() > 0.5 ? 'Masculino' : 'Feminino',
                            franchiseId: franchise._id,
                            belt: 'Preta',
                            degree: '1º Grau',
                            birthDate: new Date(Date.now() - (30 + Math.random() * 20) * 365 * 24 * 60 * 60 * 1000), // 30-50 years old
                            hireDate: new Date(Date.now() - (1 + Math.random() * 5) * 365 * 24 * 60 * 60 * 1000), // hired 1-5 years ago
                            phone: '+55 11 9' + Math.floor(Math.random() * 100000000),
                            address: 'Rua dos Professores, ' + Math.floor(Math.random() * 1000)
                        });
                    }
                }
            }

            // Final sync of Franchise document
            franchise.students = currentStudents;
            franchise.revenue = Math.floor(currentStudents * baseRevenuePerStudent);
            await franchise.save();
        }

        console.log('✅ Seed complete. All data is now consistent across Metrics, Students and Franchises!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

generateMonthlyMetrics();
