import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Franchise from '../models/Franchise';
import Teacher from '../models/Teacher';
import Class from '../models/Class';
import Student from '../models/Student';
import Payment from '../models/Payment';
import ClassBooking from '../models/ClassBooking';
import Attendance from '../models/Attendance';
import GraduationRule from '../models/GraduationRule';
import Metric from '../models/Metric';
import { connectDB } from '../config/database';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

// IBJJF CONSTANTS
const ADULT_BELTS = ['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta'];
const MASTER_BELTS = ['Preta', 'Coral', 'Vermelha'];
const KIDS_BELTS = ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde'];

// Degrees: Adults typically 0-4 degrees. Black belt up to 6 before Coral.
const DEGREES = ['Nenhum', '1º Grau', '2º Grau', '3º Grau', '4º Grau'];

const NAMES = [
    'João', 'Maria', 'Pedro', 'Ana', 'Lucas', 'Julia', 'Marcos', 'Fernanda', 'Gabriel', 'Larissa',
    'Rafael', 'Camila', 'Bruno', 'Amanda', 'Thiago', 'Beatriz', 'Felipe', 'Mariana', 'Gustavo', 'Letícia',
    'Rodrigo', 'Carolina', 'Daniel', 'Natália', 'Eduardo', 'Bianca', 'Leonardo', 'Gabriela', 'Vitor', 'Isabela',
    'Arthur', 'Lorena', 'Heitor', 'Valentina', 'Davi', 'Laura', 'Matheus', 'Sophia', 'Enzo', 'Helena'
];

const LAST_NAMES = [
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
    'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa',
    'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas'
];

function getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomName() {
    return `${getRandomItem(NAMES)} ${getRandomItem(LAST_NAMES)}`;
}

function getRandomDate(start: Date, end: Date) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generatePhone() {
    return `(${Math.floor(Math.random() * 90) + 10}) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`;
}

// Logic to determine valid belt based on age (IBJJF approximation)
function getValidBeltForAge(age: number): { belt: string, degree: string } {
    let pool: string[] = ['Branca'];

    if (age < 16) {
        // KIDS - Min ages (approx)
        if (age >= 4) pool.push('Cinza');
        if (age >= 7) pool.push('Amarela');
        if (age >= 10) pool.push('Laranja');
        if (age >= 13) pool.push('Verde');
    } else {
        // JUVENILE / ADULT
        pool.push('Azul'); // 16+
        if (age >= 16) pool.push('Roxa'); // 16+ (Technically 16 for Purple)
        if (age >= 18) pool.push('Marrom'); // 18+
        if (age >= 19) pool.push('Preta'); // 19+
    }

    const belt = getRandomItem(pool);
    const degree = getRandomItem(DEGREES);
    
    return { belt, degree };
}

async function clearDatabase() {
    console.log('🧹 Clearing database (Advanced Mode)...');
    await Franchise.deleteMany({});
    await Teacher.deleteMany({});
    await Class.deleteMany({});
    await Student.deleteMany({});
    await Payment.deleteMany({});
    await ClassBooking.deleteMany({});
    await Attendance.deleteMany({});
    await GraduationRule.deleteMany({});
    await Metric.deleteMany({});
    console.log('✅ Database cleared.');
}

async function createIBJJFGraduationRules() {
    console.log('📏 Creating IBJJF Graduation Rules...');
    const rules = [];

    // --- KIDS PATH (4-15) ---
    const kidsPath = ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde'];
    
    for (let i = 0; i < kidsPath.length - 1; i++) {
        const current = kidsPath[i];
        const next = kidsPath[i + 1];

        // Degrees within belt
        for (let j = 0; j < DEGREES.length - 1; j++) {
            rules.push({
                fromBelt: current,
                fromDegree: DEGREES[j],
                toBelt: current,
                toDegree: DEGREES[j + 1],
                classesRequired: 30, 
                minDaysRequired: 30, 
                examFee: 0
            });
        }
        // Belt Promotion
        rules.push({
            fromBelt: current,
            fromDegree: DEGREES[DEGREES.length - 1], // 4º Grau
            toBelt: next,
            toDegree: 'Nenhum',
            classesRequired: 50,
            minDaysRequired: 180, 
            examFee: 80
        });
    }

    // --- ADULT PATH (16+) ---
    rules.push({
        fromBelt: 'Verde',
        fromDegree: '4º Grau',
        toBelt: 'Azul',
        toDegree: 'Nenhum',
        classesRequired: 1, 
        minDaysRequired: 0,
        examFee: 100
    });

    const fullLadder = ['Azul', 'Roxa', 'Marrom', 'Preta']; 

    // Adult Belts Logic
    for (let i = 0; i < fullLadder.length - 1; i++) {
        const current = fullLadder[i];
        const next = fullLadder[i + 1];

        const beltClasses = current === 'Azul' ? 20 : (current === 'Roxa' ? 30 : 40);
        const beltMinDays = current === 'Azul' ? 120 : (current === 'Roxa' ? 180 : 270);

        // Degrees
        for (let j = 0; j < DEGREES.length - 1; j++) {
            rules.push({
                fromBelt: current,
                fromDegree: DEGREES[j],
                toBelt: current,
                toDegree: DEGREES[j + 1],
                classesRequired: beltClasses, 
                minDaysRequired: beltMinDays,
                examFee: 0
            });
        }
        // Belt Promotion
        rules.push({
            fromBelt: current,
            fromDegree: DEGREES[DEGREES.length - 1], // 4º Grau
            toBelt: next,
            toDegree: 'Nenhum',
            classesRequired: beltClasses * 1.5, // Promotion slightly harder
            minDaysRequired: 365 * (i + 1), 
            examFee: 200 + (i * 50)
        });
    }

    try {
        await GraduationRule.insertMany(rules, { ordered: false });
        console.log(`✅ Created ${rules.length} graduation rules.`);
    } catch (e) {
        console.log('ℹ️ Rules created (some duplicates skipped).');
    }
}

async function seed() {
    try {
        await connectDB();
        await clearDatabase();
        await createIBJJFGraduationRules();

        console.log('🌱 Starting Advanced Seed...');

        const gyms = [];

        const CITY_NAMES = [
            'São Paulo', 'Rio de Janeiro', 'Curitiba', 'Florianópolis', 'Belo Horizonte',
            'Porto Alegre', 'Brasília', 'Salvador', 'Recife', 'Manaus',
            'New York', 'Los Angeles', 'Miami', 'London', 'Paris',
            'Tokyo', 'Dubai', 'Sydney', 'Barcelona', 'Lisbon'
        ];

        // 1. Create 20 Gyms
        for (let i = 0; i < 20; i++) {
            const cityName = CITY_NAMES[i];
            const gym = await Franchise.create({
                name: `Arena ${cityName}`,
                owner: getRandomName(),
                address: `Rua Central da Arena ${i + 1}, Bairro ${cityName}, ${['New York', 'Los Angeles', 'Miami'].includes(cityName) ? 'USA' : 'Brasil'}`,
                phone: generatePhone(),
                email: `unit${i + 1}@arenabjj.com`,
                students: 0,
                teachers: 0,
                revenue: 0,
                expenses: Math.floor(Math.random() * 5000) + 2000,
                royaltyPercent: 10,
                location: {
                    type: 'Point',
                    coordinates: [-46.633308 + (Math.random() - 0.5), -23.550520 + (Math.random() - 0.5)]
                },
                status: 'active',
                plan: 'Master',
                metrics: {
                    retention: 0,
                    satisfaction: 0,
                    growth: 0
                },
                branding: {
                    brandName: 'Arena JiuJitsu',
                    primaryColor: '#FF6B00',
                    secondaryColor: '#000000'
                }
            });
            gyms.push(gym);
            console.log(`Created Gym: ${gym.name}`);

            // --- GENERATE HISTORICAL METRICS (Fluctuation) ---
            const today = new Date();
            for (let m = 12; m > 0; m--) {
                const pastDate = new Date(today.getFullYear(), today.getMonth() - m, 1);
                const monthStr = pastDate.toISOString().slice(0, 7); // YYYY-MM
                
                // Fluctuation logic: Alternate positive/negative randomly
                const baseStudents = 20 + Math.floor(Math.random() * 20);
                const trend = Math.random() > 0.5 ? 1 : -1;
                const change = Math.floor(Math.random() * 5) * trend;
                const totalStudents = Math.max(10, baseStudents + change);
                const revenue = totalStudents * (200 + Math.floor(Math.random() * 50));

                await Metric.create({
                    franchiseId: gym._id,
                    period: monthStr,
                    students: {
                        total: totalStudents,
                        active: Math.floor(totalStudents * 0.9),
                        inactive: Math.floor(totalStudents * 0.1),
                        new: Math.max(0, change + 2), // Some new
                        churn: Math.max(0, 2 - change) // Some dropped
                    },
                    finance: {
                        revenue: revenue,
                        expenses: 2500,
                        profit: revenue - 2500
                    }
                });
            }
        }

        for (const gym of gyms) {
            // 2. Create 3 Professors per Gym (Including Coral/Red Belts)
            const teachers = [];
            for (let j = 0; j < 3; j++) {
                // 10% Chance for Master (Coral/Vermelha) - Only one per gym max ideally, but let's random
                const isMaster = Math.random() < 0.1;
                let belt = 'Preta';
                let degree = getRandomItem(DEGREES);
                let birthMin = 1975;
                let birthMax = 1995;

                if (isMaster) {
                    belt = Math.random() > 0.5 ? 'Coral' : 'Vermelha';
                    degree = 'Nenhum'; // Usually just Coral/Red belt
                    birthMin = 1950;
                    birthMax = 1965;
                }

                const teacher = await Teacher.create({
                    name: isMaster ? `Mestre ${getRandomName()}` : `Prof. ${getRandomName()}`,
                    birthDate: getRandomDate(new Date(birthMin, 0, 1), new Date(birthMax, 0, 1)),
                    gender: Math.random() > 0.8 ? 'Feminino' : 'Masculino', // More male teachers typically
                    phone: generatePhone(),
                    email: `prof${j}_gym${gym._id}@arenabjj.com`,
                    belt: belt, 
                    degree: degree,
                    hireDate: getRandomDate(new Date(2010, 0, 1), new Date()),
                    franchiseId: gym._id,
                    active: true
                });
                teachers.push(teacher);
            }
            gym.teachers = teachers.length;
            await gym.save();

            // 3. Create 50 Classes per Gym
            const classes = [];
            const days = [0, 1, 2, 3, 4, 5, 6]; 
            const times = ['06:00', '07:00', '12:00', '16:00', '18:00', '19:00', '20:30'];
            
            for (let k = 0; k < 50; k++) {
                // Determine Category
                const catRoll = Math.random();
                let category = 'BJJ'; // Default
                if (catRoll < 0.3) category = 'Kids';
                else if (catRoll < 0.5) category = 'No-Gi';
                else if (catRoll < 0.6) category = 'Fundamentals';
                else if (catRoll < 0.7) category = 'Wrestling';

                // Teacher assignment: Masters teach less frequent or 'Advanced'
                let teacher = teachers[k % teachers.length];
                
                const cls = await Class.create({
                    franchiseId: gym._id,
                    teacherId: teacher._id,
                    name: `${category} ${getRandomItem(['Morning', 'Evening', 'Night', 'Advanced', 'Drills'])}`,
                    dayOfWeek: getRandomItem(days),
                    startTime: getRandomItem(times),
                    endTime: '22:00', 
                    capacity: Math.floor(Math.random() * 20) + 10, 
                    category: category,
                    active: true
                });
                classes.push(cls);
            }

            // 4. Create 50 Students per Gym
            let totalRevenue = 0;
            const students = [];

            for (let m = 0; m < 50; m++) {
                const registrationDate = getRandomDate(new Date(2023, 0, 1), new Date()); 
                
                // AGE MIX
                const isKid = Math.random() < 0.35; // 35% Kids
                let birthDate;
                if (isKid) {
                    birthDate = getRandomDate(new Date(2012, 0, 1), new Date(2020, 0, 1)); // 6-14
                } else {
                    birthDate = getRandomDate(new Date(1975, 0, 1), new Date(2007, 0, 1)); // 18-50
                }
                
                const ageDifMs = Date.now() - birthDate.getTime();
                const ageDate = new Date(ageDifMs);
                const age = Math.abs(ageDate.getUTCFullYear() - 1970);

                const { belt, degree } = getValidBeltForAge(age);

                // Eligibility Setup
                const forceEligible = Math.random() < 0.4; // 40% Chance to be eligible
                let lastGradDate;
                
                if (forceEligible) {
                    const sixMonthsAgo = new Date();
                    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 8);
                    lastGradDate = getRandomDate(new Date(2023, 0, 1), sixMonthsAgo);
                } else {
                    const recent = new Date();
                    recent.setMonth(recent.getMonth() - 1);
                    lastGradDate = recent;
                }

                const gradHistory = [{
                    belt: belt,
                    degree: degree,
                    date: lastGradDate,
                    promotedBy: teachers[0]._id
                }];

                // Add previous belts to history (Retro-filling)
                // If Blue belt, allow White belt history
                if (belt === 'Azul') {
                    gradHistory.unshift({
                        belt: 'Branca',
                        degree: '4º Grau',
                        date: new Date(lastGradDate.getTime() - (1000 * 60 * 60 * 24 * 365)), // 1 yr ago
                        promotedBy: teachers[0]._id
                    });
                }

                const student = await Student.create({
                    name: getRandomName(),
                    gender: Math.random() > 0.6 ? 'Feminino' : 'Masculino',
                    birthDate: birthDate,
                    phone: generatePhone(),
                    email: `student${m}_gym${gym._id}@mail.com`,
                    belt: belt,
                    degree: degree,
                    amount: isKid ? 180 : 250,
                    registrationDate: registrationDate,
                    paymentStatus: Math.random() > 0.85 ? 'Atrasada' : 'Paga',
                    franchiseId: gym._id,
                    lastGraduationDate: lastGradDate,
                    graduationHistory: gradHistory
                });
                students.push(student);

                // 5. Payment History (12-24 Months)
                let payDate = new Date(registrationDate);
                const now = new Date();
                
                while (payDate < now) {
                    // Simulate random amount fluctuation (Ex: annual increase)
                    const currentAmount = student.amount; 
                    
                    await Payment.create({
                        franchiseId: gym._id,
                        studentId: student._id,
                        type: 'Tuition',
                        description: `Mensalidade ${payDate.getMonth() + 1}/${payDate.getFullYear()}`,
                        amount: currentAmount,
                        status: 'approved',
                        paymentMethod: 'credit_card',
                        paidAt: new Date(payDate),
                        split: {
                            matrixAmount: currentAmount * 0.1,
                            franchiseAmount: currentAmount * 0.9,
                            matrixRate: 10
                        }
                    });
                    totalRevenue += currentAmount;
                    payDate.setMonth(payDate.getMonth() + 1);
                }

                // 6. Attendance (Intelligent Matching)
                const suitableClasses = classes.filter(c => {
                    if (isKid) return c.category === 'Kids';
                    return c.category !== 'Kids';
                });

                if (suitableClasses.length > 0) {
                    const attendanceCount = forceEligible ? 65 : Math.floor(Math.random() * 15);
                    
                    for (let a = 0; a < attendanceCount; a++) {
                        const cls = suitableClasses[Math.floor(Math.random() * suitableClasses.length)];
                        const attendDate = getRandomDate(lastGradDate, new Date());
                        const month = attendDate.toISOString().substring(0, 7); // YYYY-MM
                        
                        await Attendance.updateOne(
                            { studentId: student._id, month: month },
                            {
                                $setOnInsert: { 
                                    tenantId: gym._id,
                                    // totalPresent will be incremented by $inc
                                },
                                $push: {
                                    records: {
                                        date: attendDate,
                                        classId: cls._id,
                                        status: 'Present',
                                        checkInMethod: 'App',
                                        snapshot: {
                                            className: cls.name,
                                            teacherName: teachers.find(t => t._id.toString() === cls.teacherId.toString())?.name || 'Unknown',
                                            startTime: cls.startTime,
                                            category: cls.category
                                        }
                                    }
                                },
                                $inc: { totalPresent: 1 }
                            },
                            { upsert: true }
                        );
                    }
                }
            }

            // Final Gym Updates
            gym.students = students.length;
            gym.revenue = totalRevenue; 
            
            // Calculate growth metric based on last month
            // (Simplified for this script - using random realistic value)
            gym.metrics.growth = Math.floor(Math.random() * 10) * (Math.random() > 0.3 ? 1 : -1);
            
            await gym.save();
            console.log(`Updated Gym Stats: ${gym.name} - Students: ${gym.students}, Growth: ${gym.metrics.growth}%`);
        }

        console.log('🏁 Advanced Seed completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seed();
