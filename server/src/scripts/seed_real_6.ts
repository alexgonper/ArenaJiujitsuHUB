
import mongoose, { Types } from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Franchise from '../models/Franchise';
import Student from '../models/Student';
import Teacher from '../models/Teacher';
import Class from '../models/Class';
import ClassSession from '../models/ClassSession';
import Attendance from '../models/Attendance';
import Payment from '../models/Payment';
import Metric from '../models/Metric';
import DailyMetric from '../models/DailyMetric';
import GraduationRule from '../models/GraduationRule';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// --- CONSTANTS & CONFIG ---

const REAL_GYMS = [
    { 
        name: "Arena Rio de Janeiro", 
        city: "Rio de Janeiro",
        address: "Av. Atlântica, 1702 - Copacabana, Rio de Janeiro - RJ, 22021-001, Brasil", 
        lat: -22.9694, 
        lng: -43.1785,
        timezone: "America/Sao_Paulo"
    },
    { 
        name: "Arena São Paulo", 
        city: "São Paulo",
        address: "Av. Paulista, 1578 - Bela Vista, São Paulo - SP, 01310-200, Brasil", 
        lat: -23.5614, 
        lng: -46.6559,
        timezone: "America/Sao_Paulo"
    },
    { 
        name: "Arena New York", 
        city: "New York",
        address: "350 5th Ave, New York, NY 10118, USA", 
        lat: 40.7488, 
        lng: -73.9857,
        timezone: "America/New_York"
    },
    { 
        name: "Arena Los Angeles", 
        city: "Los Angeles",
        address: "401 N Rodeo Dr, Beverly Hills, CA 90210, USA", 
        lat: 34.0694, 
        lng: -118.4042,
        timezone: "America/Los_Angeles"
    },
    { 
        name: "Arena London", 
        city: "London",
        address: "221B Baker St, London NW1 6XE, UK", 
        lat: 51.5238, 
        lng: -0.1583,
        timezone: "Europe/London"
    },
    { 
        name: "Arena Tokyo", 
        city: "Tokyo",
        address: "1 Chome-1-2 Oshiage, Sumida City, Tokyo 131-0045, Japan", 
        lat: 35.7101, 
        lng: 139.8107,
        timezone: "Asia/Tokyo"
    }
];

const NAMES_FIRST_MASC = ['Carlos', 'João', 'Pedro', 'Lucas', 'Marcos', 'Rafael', 'Bruno', 'André', 'Luiz', 'Gabriel', 'Rodrigo', 'Thiago', 'Felipe', 'Gustavo', 'Marcelo', 'Ricardo', 'Fernando', 'Eduardo', 'Paulo', 'Antonio'];
const NAMES_FIRST_FEM = ['Ana', 'Maria', 'Julia', 'Fernanda', 'Laura', 'Beatriz', 'Mariana', 'Camila', 'Larissa', 'Sofia', 'Isabella', 'Heloisa', 'Alice', 'Manuela', 'Valentina', 'Leticia', 'Carla', 'Patrícia', 'Gabriela', 'Bárbara'];
const NAMES_LAST = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Gracie', 'Machado', 'Ribeiro', 'Martins', 'Carvalho', 'Costa', 'Almeida', 'Nascimento', 'Araujo', 'Mendes'];

const BELT_ORDER_ADULT = ['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta', 'Coral', 'Vermelha'];
const BELT_ORDER_KIDS = ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde'];

// IBJJF Minimum months (simplified for seeding)
const MIN_MONTHS: Record<string, number> = {
    'Branca': 12, 'Cinza': 12, 'Amarela': 12, 'Laranja': 12, 'Verde': 12,
    'Azul': 24, 'Roxa': 18, 'Marrom': 12, 'Preta': 36
};

// --- HELPER FUNCTIONS ---

function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateName(gender: 'Masculino' | 'Feminino'): string {
    const first = gender === 'Feminino' ? getRandomElement(NAMES_FIRST_FEM) : getRandomElement(NAMES_FIRST_MASC);
    return `${first} ${getRandomElement(NAMES_LAST)}`;
}

// Generates a realistic history aiming for the target belt/degree
// Returns the full history array and the calculated final state
function generateIBJJFHistory(
    targetBelt: string, 
    targetDegree: string, 
    isKid: boolean, 
    teacherId: any,
    startDate: Date,
    forceReadyToGraduate: boolean = false
): { history: any[], finalBelt: string, finalDegree: string, lastDate: Date } {
    const history = [];
    const beltOrder = isKid ? BELT_ORDER_KIDS : BELT_ORDER_ADULT;
    
    let currentBeltIdx = 0; // Starts at White
    let currentDegree = 0; 
    let currentDate = new Date(startDate);
    const now = new Date();

    const targetBeltIdx = beltOrder.indexOf(targetBelt);
    let targetDegreeNum = targetDegree === 'Nenhum' ? 0 : parseInt(targetDegree.charAt(0));
    
    // If forcing graduation readiness, we stop slightly before the "next" step or make sure time has passed
    // For simplicity, we just generate up to target, and the ready-to-graduate logic will be handled by ensuring "Last Graduation" was long enough ago.
    
    while (currentDate <= now) {
        const currentBeltName = beltOrder[currentBeltIdx];
        
        // Add promotion record
        history.push({
            belt: currentBeltName,
            degree: currentDegree === 0 ? 'Nenhum' : `${currentDegree}º Grau`,
            date: new Date(currentDate),
            promotedBy: teacherId,
            notes: "Graduação oficial seguindo critérios IBJJF"
        });

        // Check if we reached target
        if (currentBeltIdx === targetBeltIdx && currentDegree === targetDegreeNum) {
            break;
        }

        // Calculate time to next promotion
        // Standard Stripe: ~4-6 months (adjusting to min months logic)
        // Black Belt Degrees: 3 years+
        
        let monthsToAdd = 0;
        
        if (currentBeltName === 'Preta' || currentBeltName === 'Coral' || currentBeltName === 'Vermelha') {
             // Degrees for black belt take years
             // Black -> 1st: 3 years
             monthsToAdd = 36;
             if (currentBeltIdx > beltOrder.indexOf('Preta')) monthsToAdd = 60; // Coral/Red take longer
        } else {
            // Color belts
            const beltMinMonths = MIN_MONTHS[currentBeltName] || 12;
            monthsToAdd = Math.ceil(beltMinMonths / 4); // Roughly per stripe
        }
        
        // Add randomness
        const daysToAdd = (monthsToAdd * 30) + getRandomInt(-15, 30);
        currentDate.setDate(currentDate.getDate() + daysToAdd);

        if (currentDate > now) break;

        // Advance Rank
        if (currentBeltName === 'Preta' || currentBeltName === 'Coral' || currentBeltName === 'Vermelha') {
            // Black belt degrees logic... simplified for seeding
            currentDegree++;
            // Logic to switch belt color (Preta -> Coral) simplified:
             if (currentBeltName === 'Preta' && currentDegree >= 7) {
                 currentBeltIdx++; currentDegree = 1;
             }
        } else {
            if (currentDegree < 4) {
                currentDegree++;
            } else {
                currentDegree = 0;
                currentBeltIdx++;
                if (currentBeltIdx >= beltOrder.length) break;
            }
        }
        
        // Don't overshoot target
        if (currentBeltIdx > targetBeltIdx) break;
        if (currentBeltIdx == targetBeltIdx && currentDegree > targetDegreeNum) break; // Should not happen if loop logic is right
    }
    
    const lastEntry = history[history.length - 1];
    
    // If we need them ready to graduate, we ensure the 'lastDate' was long enough ago.
    // We can artificially backtrack the last date if needed, but let's trust the 'startDate' was set correctly by the caller to allow enough time.

    return {
        history,
        finalBelt: lastEntry.belt,
        finalDegree: lastEntry.degree,
        lastDate: lastEntry.date
    };
}

// --- MAIN SEED FUNCTION ---

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-hub');
        console.log('MongoDB Connected');

        // CLEAR DB
        console.log('Clearing database...');
        await Promise.all([
            Franchise.deleteMany({}),
            Student.deleteMany({}),
            Teacher.deleteMany({}),
            Class.deleteMany({}),
            ClassSession.deleteMany({}),
            Attendance.deleteMany({}),
            Payment.deleteMany({}),
            Metric.deleteMany({}),
            DailyMetric.deleteMany({}),
            GraduationRule.deleteMany({})
        ]);
        console.log('Database cleared.');

        const allFranchises = [];
        const allTeachers = [];
        const allStudents = [];
        const allClasses = [];

        // 1. CREATE FRANCHISES
        console.log(`Creating 6 Real Franchises...`);
        for (const gym of REAL_GYMS) {
            const franchise = new Franchise({
                name: gym.name,
                owner: generateName('Masculino'),
                address: gym.address,
                phone: gym.city === 'Tokyo' ? '+81 3-1234-5678' : (gym.city === 'London' ? '+44 20 7123 4567' : (gym.city === 'New York' || gym.city === 'Los Angeles' ? '+1 212-555-0199' : `+55 (11) 9${getRandomInt(7000, 9999)}-${getRandomInt(1000, 9999)}`)),
                email: `contato@${gym.name.toLowerCase().replace(/\s/g, '')}.com`,
                status: 'active',
                location: {
                    type: 'Point',
                    coordinates: [gym.lng, gym.lat]
                },
                plan: 'Master',
                students: 60, // Initial count
                teachers: 3,
                active: true,
                settings: {
                    timezone: gym.timezone,
                    currency: gym.city === 'Tokyo' ? 'JPY' : (gym.city === 'London' ? 'GBP' : (gym.city === 'New York' || gym.city === 'Los Angeles' ? 'USD' : 'BRL'))
                },
                branding: {
                    primaryColor: '#000000',
                    secondaryColor: '#FFD700', // Gold/Yellow ish
                    logoUrl: 'https://via.placeholder.com/150',
                    supportEmail: `suporte@${gym.name.toLowerCase().replace(/\s/g, '')}.com`,
                    supportPhone: `+55 (11) 9${getRandomInt(8888, 9999)}-0000` // WhatsApp Support
                }
            });
            await franchise.save();
            allFranchises.push(franchise);

            // 1.1 FRANCHISE HISTOPRICAL METRICS (Last 12 months)
            const today = new Date();
            for (let i = 12; i >= 0; i--) {
                const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const period = date.toISOString().slice(0, 7);
                
                // Variating Data
                const baseStudents = 50;
                const trend = (i % 2 === 0) ? 1 : -1; // Oscillate
                const studentCount = baseStudents + (i * 2) + (trend * getRandomInt(1, 5));
                const revenue = studentCount * 300; // Augment based on currency later if needed, sticking to generic "units"

                await Metric.create({
                    franchiseId: franchise._id,
                    period,
                    students: {
                        total: studentCount,
                        new: getRandomInt(2, 8),
                        churn: getRandomInt(0, 3),
                        active: studentCount,
                        inactive: 0
                    },
                    finance: {
                        revenue: revenue,
                        expenses: revenue * 0.6,
                        profit: revenue * 0.4
                    },
                    classes: {
                        total: 100,
                        avgAttendance: 15
                    }
                });
            }
        }

        // 2. CREATE TEACHERS
        console.log('Creating Teachers (3 per gym)...');
        for (const franchise of allFranchises) {
            for (let i = 0; i < 3; i++) {
                // Determine rank: 1 Head (Red/Coral/Black), 2 Instructors (Black)
                let belt = 'Preta';
                let degree = `${getRandomInt(0, 4)}º Grau`;
                let age = getRandomInt(30, 45);

                if (i === 0) {
                    // Head Instructor
                    const r = Math.random();
                    if (r > 0.7) { belt = 'Vermelha'; degree = '9º Grau'; age = 75; }
                    else if (r > 0.4) { belt = 'Coral'; degree = '7º Grau'; age = 60; }
                    else { belt = 'Preta'; degree = '5º Grau'; age = 50; }
                }

                const gender = 'Masculino'; // Majority
                const birthDate = new Date();
                birthDate.setFullYear(birthDate.getFullYear() - age);
                const startDate = new Date(birthDate);
                startDate.setFullYear(startDate.getFullYear() + 15); // Started at 15

                // Generate valid history
                const hist = generateIBJJFHistory(belt, degree, false, "Carlos Gracie Jr", startDate);

                const franchiseCity = franchise.name.replace('Arena ', '').toLowerCase().replace(/\s/g, '');
                const teacherEmail = `prof.${franchiseCity}.${i}@arena.com`;

                const teacher = new Teacher({
                    name: generateName(gender),
                    email: teacherEmail,
                    password: 'password123', // standardized for testing
                    franchiseId: franchise._id,
                    role: 'teacher',
                    belt: hist.finalBelt,
                    degree: hist.finalDegree,
                    gender,
                    birthDate,
                    phone: franchise.branding.supportPhone,
                    address: franchise.address, // Lives close
                    active: true,
                    hireDate: new Date(2020, 0, 1),
                    graduationHistory: hist.history,
                    bio: "Apaixonado pelo Jiu-Jitsu e pelo ensino." 
                });
                await teacher.save();
                allTeachers.push(teacher);
            }
        }

        // 3. CREATE STUDENTS
        console.log('Creating Students (60 per gym)...');
        const today = new Date();
        for (const franchise of allFranchises) {
            const gymTeachers = allTeachers.filter(t => t.franchiseId.equals(franchise._id));
            const headTeacher = gymTeachers[0];

            for (let i = 0; i < 60; i++) {
                const isKid = i < 10; // 10 kids
                const gender = Math.random() > 0.2 ? 'Masculino' : 'Feminino';
                
                let age = isKid ? getRandomInt(6, 15) : getRandomInt(18, 50);
                let birthDate = new Date();
                birthDate.setFullYear(birthDate.getFullYear() - age);

                // Determine Target Grade
                let targetBelt = 'Branca';
                let targetDegree = 'Nenhum';

                if (isKid) {
                    targetBelt = getRandomElement(BELT_ORDER_KIDS);
                    targetDegree = getRandomElement(['Nenhum', '1º Grau', '2º Grau', '3º Grau']);
                } else {
                    const r = Math.random();
                     // Mix: 40% White, 30% Blue, 15% Purple, 10% Brown, 5% Black
                    if (r > 0.95) targetBelt = 'Preta';
                    else if (r > 0.85) targetBelt = 'Marrom';
                    else if (r > 0.70) targetBelt = 'Roxa';
                    else if (r > 0.40) targetBelt = 'Azul';
                    
                    if (targetBelt !== 'Branca') {
                        targetDegree = getRandomElement(['Nenhum', '1º Grau', '2º Grau', '3º Grau', '4º Grau']);
                    } else {
                        targetDegree = getRandomElement(['Nenhum', '1º Grau', '2º Grau']);
                    }
                }

                // Set "Start Date" based on target belt to allow history generation
                // Rough estimate: 2 years per belt
                let yearsTraining = 0;
                if (!isKid) {
                    const beltIdx = BELT_ORDER_ADULT.indexOf(targetBelt);
                    yearsTraining = beltIdx * 2.5; 
                } else {
                    yearsTraining = getRandomInt(1, 4);
                }
                if (yearsTraining === 0) yearsTraining = 0.5; // at least 6 months

                const startDate = new Date();
                startDate.setFullYear(startDate.getFullYear() - yearsTraining);
                if (startDate < birthDate) startDate.setFullYear(birthDate.getFullYear() + 4); // Sanity check

                // For some students (last 5 of each gym), make them "Ready to Graduate"
                // Usually means they have been at current grade for a long time.
                const forceGraduate = i >= 55;
                
                const hist = generateIBJJFHistory(
                    targetBelt, 
                    targetDegree, 
                    isKid, 
                    headTeacher._id, 
                    startDate
                );
                
                // If forcing graduate, we artificially push their "lastGraduationDate" back to meet min months requirements
                let lastGradDate = new Date(hist.lastDate);
                if (forceGraduate) {
                    lastGradDate.setFullYear(lastGradDate.getFullYear() - 2); // 2 years ago, surely enough time
                }

                const student = new Student({
                    name: generateName(gender),
                    email: `aluno.${franchise.name.substring(0,3).toLowerCase()}.${i}@arena.com`,
                    franchiseId: franchise._id,
                    gender,
                    birthDate,
                    cpf: `000.000.000-${getRandomInt(10, 99)}`,
                    phone: `+55 11 9${getRandomInt(1000, 9999)}-${getRandomInt(1000, 9999)}`,
                    address: franchise.address, // Same city
                    belt: hist.finalBelt,
                    degree: hist.finalDegree,
                    graduationHistory: hist.history,
                    lastGraduationDate: lastGradDate, 
                    registrationDate: startDate,
                    active: true,
                    status: 'active',
                    paymentStatus: 'Paga', // Paid
                    amount: 350.00, // Monthly fee
                    photo: `https://ui-avatars.com/api/?name=${generateName(gender).replace(' ', '+')}&background=random`
                });

                await student.save();
                allStudents.push(student);

                // 3.1 FINANCIAL HISTORY (Tuition)
                // Generate monthly payments since registration (capped at 12 months for sanity)
                const paymentsToGen = 12;
                for (let m = 0; m < paymentsToGen; m++) {
                    const pDate = new Date();
                    pDate.setMonth(pDate.getMonth() - m);
                    if (pDate < startDate) continue;

                    await Payment.create({
                        studentId: student._id,
                        franchiseId: franchise._id,
                        amount: student.amount,
                        status: 'approved',
                        paymentMethod: 'credit_card',
                        type: 'Tuition',
                        date: pDate,
                        referenceMonth: pDate.getMonth() + 1,
                        referenceYear: pDate.getFullYear(),
                        createdAt: pDate,
                        updatedAt: pDate
                    });
                }
            }
        }

        // 4. CREATE CLASSES (Sequential 06:00 - 22:00)
        console.log('Creating Sequential Classes (06-22h)...');
        for (const franchise of allFranchises) {
            const gymTeachers = allTeachers.filter(t => t.franchiseId.equals(franchise._id));
            
            // Days: Mon(1) to Fri(5)
            for (let day = 1; day <= 5; day++) {
                
                // Hours 6 to 21 (Start), Ends at 22
                for (let hour = 6; hour <= 21; hour++) {
                    const teacher = gymTeachers[hour % 3]; // Rotate teachers
                    
                    const startTime = `${hour.toString().padStart(2, '0')}:00`;
                    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

                    // Define Class Type based on Hour
                    // category: 'BJJ' | 'No-Gi' | 'Wrestling' | 'Kids' | 'Fundamentals'
                    // level: 'beginner' | 'intermediate' | 'advanced'
                    // targetAudience: 'kids' | 'adults' | 'women' | 'seniors'
                    
                    let category: any = 'BJJ';
                    let targetAudience: any = 'adults';
                    let level: any = 'intermediate';
                    let name = 'Jiu Jitsu Todos';

                    if (hour === 6 || hour === 7) { name = 'Jiu Jitsu Despertar'; level = 'beginner'; category = 'Fundamentals'; }
                    else if (hour === 12) { name = 'Jiu Jitsu Lunch'; }
                    else if (hour >= 17 && hour <= 18) {
                        name = 'Jiu Jitsu Kids'; targetAudience = 'kids'; level = 'beginner'; category = 'Kids';
                    }
                    else if (hour === 19) {
                        name = 'Jiu Jitsu Avançado'; level = 'advanced';
                    }
                    else if (hour === 20) {
                         name = 'Jiu Jitsu Iniciante'; level = 'beginner'; category = 'Fundamentals';
                    }
                    else if (hour === 21) {
                         name = 'No-Gi Submission'; category = 'No-Gi';
                    }
                    else {
                        name = 'Jiu Jitsu Geral';
                    }

                    const newClass = new Class({
                        franchiseId: franchise._id,
                        teacherId: teacher._id,
                        name: name,
                        category,
                        level,
                        targetAudience, // Corrected property name
                        capacity: (hour >= 18 && hour <= 20) ? 40 : 25, // Prime time bigger
                        dayOfWeek: day, // Corrected property name (expecting number)
                        startTime,
                        endTime,
                        active: true,
                        minBelt: (level === 'advanced') ? 'Azul' : 'Branca'
                    });
                    
                    await newClass.save();
                    allClasses.push(newClass);
                }
            }
        }

        // 5. ATTENDANCE & EVOLUTION
        console.log('Generating Attendance & Evolution Data...');
        // We need to simulate attendance for last 90 days
        
        const last90Days = [];
        for (let d = 0; d < 90; d++) {
            const dt = new Date();
            dt.setDate(dt.getDate() - d);
            last90Days.push(dt);
        }

        for (const student of allStudents) {
            // Determine how active the student is
            const attendanceFreq = getRandomInt(2, 4); // times per week
            
            // Filter classes for this student's gym
            const gymClasses = allClasses.filter(c => c.franchiseId.equals(student.franchiseId));
            
            let attendedCount = 0;

            for (const date of last90Days) {
                const dayOfWeek = date.getDay(); // 0-6
                
                // Matches dayOfWeek in Class model
                const classesInDay = gymClasses.filter(c => c.dayOfWeek === dayOfWeek);
                
                if (classesInDay.length === 0) continue;
                if (Math.random() > 0.4) continue; // Random skip to simulate realistic attendance pattern

                // Pick one class to attend
                const cls = getRandomElement(classesInDay);
                
                // Matches audience?
                let compatible = true;
                // Corrected property access to targetAudience
                if (cls.targetAudience === 'kids' && (new Date().getFullYear() - student.birthDate.getFullYear() > 16)) compatible = false;
                if (cls.targetAudience === 'adults' && (new Date().getFullYear() - student.birthDate.getFullYear() < 16)) compatible = false;
                if (!compatible) continue;

                const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
                
                // Create Record Object
                const record = {
                    date: date,
                    classId: cls._id,
                    status: 'Present',
                    checkInMethod: 'App',
                    snapshot: {
                        className: cls.name,
                        teacherName: 'Professor', // Simplified
                        startTime: cls.startTime,
                        category: cls.category
                    }
                };

                // Upsert Attendance Bucket
                await Attendance.findOneAndUpdate(
                    { 
                        studentId: student._id, 
                        month: monthStr 
                    },
                    {
                        $setOnInsert: { tenantId: student.franchiseId },
                        $push: { records: record },
                        $inc: { totalPresent: 1 }
                    },
                    { upsert: true, new: true }
                );

                attendedCount++;
                if (attendedCount > 60) break; // Cap
            }
        }
        
        // 6. GRADUATION RULES
        console.log('Creating Graduation Rules...');
        // Correct logic to iterate belts AND degrees to match schema requirements
        for (let i = 0; i < BELT_ORDER_ADULT.length; i++) {
             // For each belt, iterate degrees
             // Simplified: Just White -> Blue, Blue -> Purple general rules or detailed? 
             // The schema is detailed: fromBelt + fromDegree -> toBelt + toDegree.
             
             // Let's CREATE rules for degree progressions (0->1->2->3->4) and Belt progressions (4->Next Belt 0)
             
             for (let d = 0; d <= 4; d++) {
                 // Current State
                 const currentBelt = BELT_ORDER_ADULT[i];
                 const currentDegree = d === 0 ? 'Nenhum' : `${d}º Grau`;
                 
                 // Next State
                 let nextBelt = currentBelt;
                 let nextDegree = `${d+1}º Grau`;
                 
                 // If at 4 degrees, go to next belt (unless Red)
                 if (d === 4) {
                     if (i === BELT_ORDER_ADULT.length - 1) continue; // Max belt
                     nextBelt = BELT_ORDER_ADULT[i+1];
                     nextDegree = 'Nenhum';
                 }
                 
                 await GraduationRule.create({
                    fromBelt: currentBelt,
                    fromDegree: currentDegree,
                    toBelt: nextBelt,
                    toDegree: nextDegree,
                    classesRequired: 30, // Simplified
                    minDaysRequired: 60,
                    examFee: (d === 4) ? 100 : 0,
                    isActive: true
                 });
             }
        }

        console.log('SEEDING COMPLETE! 6 Gyms, 360 Students, Full Schedules.');
        process.exit(0);

    } catch (error) {
        console.error('Seeding Error:', error);
        process.exit(1);
    }
}

seed();
