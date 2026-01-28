
import mongoose, { Types } from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Franchise from '../models/Franchise';
import Student, { IStudent } from '../models/Student';
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

// Real World Data with Exact Coordinates and Addresses
const CITY_DATA = [
    // Brazil - Southeast
    { name: "São Paulo", address: "Av. Paulista, 1578 - Bela Vista, São Paulo - SP, 01310-200, Brasil", lat: -23.5614, lng: -46.6559 },
    { name: "Rio de Janeiro", address: "Av. Atlântica, 1702 - Copacabana, Rio de Janeiro - RJ, 22021-001, Brasil", lat: -22.9694, lng: -43.1785 },
    { name: "Belo Horizonte", address: "Av. Afonso Pena, 1000 - Centro, Belo Horizonte - MG, 30130-003, Brasil", lat: -19.9242, lng: -43.9387 },
    { name: "Vitória", address: "Av. Nossa Sra. da Penha, 1287 - Santa Lucia, Vitória - ES, 29056-000, Brasil", lat: -20.2974, lng: -40.2957 },
    
    // Brazil - South
    { name: "Curitiba", address: "R. XV de Novembro, 300 - Centro, Curitiba - PR, 80020-310, Brasil", lat: -25.4296, lng: -49.2719 },
    { name: "Florianópolis", address: "Av. Beira Mar Norte, 2000 - Centro, Florianópolis - SC, 88015-700, Brasil", lat: -27.5847, lng: -48.5453 },
    { name: "Porto Alegre", address: "Av. Borges de Medeiros, 2035 - Praia de Belas, Porto Alegre - RS, 90110-150, Brasil", lat: -30.0487, lng: -51.2286 },
    
    // Brazil - Northeast
    { name: "Salvador", address: "Av. Oceânica, 2400 - Ondina, Salvador - BA, 40170-010, Brasil", lat: -13.0101, lng: -38.5108 },
    { name: "Recife", address: "Av. Boa Viagem, 3722 - Boa Viagem, Recife - PE, 51021-000, Brasil", lat: -8.1173, lng: -34.8961 },
    { name: "Fortaleza", address: "Av. Beira Mar, 3680 - Meireles, Fortaleza - CE, 60165-121, Brasil", lat: -3.7259, lng: -38.4883 },
    { name: "Natal", address: "Av. Engenheiro Roberto Freire, 8000 - Ponta Negra, Natal - RN, 59092-001, Brasil", lat: -5.8783, lng: -35.1764 },
    
    // Brazil - North & Midwest
    { name: "Manaus", address: "Av. Djalma Batista, 482 - Parque 10 de Novembro, Manaus - AM, 69050-010, Brasil", lat: -3.1070, lng: -60.0232 },
    { name: "Belém", address: "Av. Nazaré, 360 - Nazaré, Belém - PA, 66035-170, Brasil", lat: -1.4526, lng: -48.4839 },
    { name: "Brasília", address: "SCLN 203 Bloco B - Asa Norte, Brasília - DF, 70833-520, Brasil", lat: -15.7836, lng: -47.8850 },
    { name: "Goiânia", address: "Av. Goiás, 1799 - Centro, Goiânia - GO, 74063-010, Brasil", lat: -16.6713, lng: -49.2599 },

    // USA
    { name: "New York", address: "350 5th Ave, New York, NY 10118, USA", lat: 40.7488, lng: -73.9857 },
    { name: "Los Angeles", address: "401 N Rodeo Dr, Beverly Hills, CA 90210, USA", lat: 34.0694, lng: -118.4042 },
    { name: "Miami", address: "1601 Collins Ave, Miami Beach, FL 33139, USA", lat: 25.7891, lng: -80.1297 },
    { name: "San Diego", address: "1350 El Prado, San Diego, CA 92101, USA", lat: 32.7314, lng: -117.1507 },
    { name: "Chicago", address: "201 E Randolph St, Chicago, IL 60601, USA", lat: 41.8826, lng: -87.6226 },
    
    // Europe
    { name: "London", address: "221B Baker St, London NW1 6XE, UK", lat: 51.5238, lng: -0.1583 },
    { name: "Paris", address: "Champ de Mars, 5 Av. Anatole France, 75007 Paris, France", lat: 48.8584, lng: 2.2945 },
    { name: "Lisbon", address: "Praça do Comércio, 1100-148 Lisboa, Portugal", lat: 38.7075, lng: -9.1364 },
    { name: "Barcelona", address: "C/ de Mallorca, 401, 08013 Barcelona, Spain", lat: 41.4036, lng: 2.1744 },
    { name: "Rome", address: "Piazza del Colosseo, 1, 00184 Roma RM, Italy", lat: 41.8902, lng: 12.4922 },
    { name: "Berlin", address: "Platz der Republik 1, 11011 Berlin, Germany", lat: 52.5186, lng: 13.3761 },

    // Asia & Middle East
    { name: "Tokyo", address: "1 Chome-1-2 Oshiage, Sumida City, Tokyo 131-0045, Japan", lat: 35.7101, lng: 139.8107 },
    { name: "Dubai", address: "1 Sheikh Mohammed bin Rashid Blvd - Dubai, UAE", lat: 25.1972, lng: 55.2744 },
    { name: "Abu Dhabi", address: "Sheikh Rashid Bin Saeed St - Abu Dhabi, UAE", lat: 24.4697, lng: 54.3773 },

    // Oceania
    { name: "Sydney", address: "Bennelong Point, Sydney NSW 2000, Australia", lat: -33.8568, lng: 151.2153 }
];

const BELT_OPTS_ADULT = ['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta'];
const BELT_OPTS_KIDS = ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde'];
const DEGREES = ['Nenhum', '1º Grau', '2º Grau', '3º Grau', '4º Grau', '5º Grau', '6º Grau', '7º Grau', '8º Grau', '9º Grau', '10º Grau'];

const NAMES_FIRST_MASC = ['Carlos', 'João', 'Pedro', 'Lucas', 'Marcos', 'Rafael', 'Bruno', 'André', 'Luiz', 'Gabriel', 'Rodrigo', 'Thiago', 'Felipe', 'Gustavo', 'Marcelo', 'Ricardo', 'Fernando', 'Eduardo', 'Paulo', 'Antonio'];
const NAMES_FIRST_FEM = ['Ana', 'Maria', 'Julia', 'Fernanda', 'Laura', 'Beatriz', 'Mariana', 'Camila', 'Larissa', 'Sofia', 'Isabella', 'Heloisa', 'Alice', 'Manuela', 'Valentina', 'Leticia', 'Carla', 'Patrícia', 'Gabriela', 'Bárbara'];
const NAMES_LAST = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Gracie', 'Machado', 'Ribeiro', 'Martins', 'Carvalho', 'Costa', 'Almeida', 'Nascimento', 'Araujo', 'Mendes'];

function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateName(gender?: 'Masculino' | 'Feminino'): string {
    const first = gender === 'Feminino' ? getRandomElement(NAMES_FIRST_FEM) : (gender === 'Masculino' ? getRandomElement(NAMES_FIRST_MASC) : getRandomElement([...NAMES_FIRST_MASC, ...NAMES_FIRST_FEM]));
    return `${first} ${getRandomElement(NAMES_LAST)}`;
}

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-hub');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
}

async function clearDatabase() {
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
}

const BELT_ORDER_ADULT = ['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta', 'Coral', 'Vermelha'];
const BELT_ORDER_KIDS = ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde'];

const MIN_MONTHS: Record<string, number> = {
    'Branca': 12, 'Cinza': 12, 'Amarela': 12, 'Laranja': 12, 'Verde': 12,
    'Azul': 24, 'Roxa': 18, 'Marrom': 12, 'Preta': 36
};

function generateIBJJFHistory(
    targetBelt: string, 
    targetDegree: string, 
    isKid: boolean, 
    teacherId: any,
    startDate: Date
): { history: any[], finalBelt: string, finalDegree: string, lastDate: Date } {
    const history = [];
    const beltOrder = isKid ? BELT_ORDER_KIDS : BELT_ORDER_ADULT;
    
    let currentBeltIdx = 0;
    let currentDegree = 0; 
    let currentDate = new Date(startDate);
    const now = new Date();

    const targetBeltIdx = beltOrder.indexOf(targetBelt);
    let targetDegreeNum = 0;
    if (targetDegree !== 'Nenhum') {
        targetDegreeNum = parseInt(targetDegree.charAt(0));
    }
    
    while (currentDate <= now) {
        const currentBeltName = beltOrder[currentBeltIdx];
        
        history.push({
            belt: currentBeltName,
            degree: currentDegree === 0 ? 'Nenhum' : `${currentDegree}º Grau`,
            date: new Date(currentDate),
            promotedBy: teacherId
        });

        if (currentBeltIdx === targetBeltIdx && currentDegree === targetDegreeNum) {
            break;
        }

        const beltDuration = MIN_MONTHS[currentBeltName] || 12;
        const monthsPerStripe = Math.ceil(beltDuration / (currentBeltName === 'Preta' ? 6 : 4)); 
        
        const daysToAdd = (monthsPerStripe * 30) + getRandomInt(-15, 45);
        currentDate.setDate(currentDate.getDate() + daysToAdd);

        if (currentDate > now) break;

        if (currentBeltName === 'Preta' || currentBeltName === 'Coral' || currentBeltName === 'Vermelha') {
            if (currentDegree < (currentBeltName === 'Preta' ? 6 : (currentBeltName === 'Coral' ? 8 : 10))) {
                currentDegree++;
            } else {
                if (currentBeltName === 'Preta' && currentDegree >= 6) {
                    currentBeltIdx++; // Coral
                    currentDegree = 7;
                } else if (currentBeltName === 'Coral' && currentDegree >= 8) {
                    currentBeltIdx++; // Vermelha
                    currentDegree = 9;
                } else {
                    break;
                }
            }
        } else {
            if (currentDegree < 4) {
                currentDegree++;
            } else {
                currentDegree = 0;
                currentBeltIdx++;
                if (currentBeltIdx >= beltOrder.length || currentBeltIdx > targetBeltIdx && !isKid) break;
            }
        }
        
        if (currentBeltIdx > targetBeltIdx) break;
    }
    
    const lastEntry = history[history.length - 1];
    return {
        history,
        finalBelt: lastEntry.belt,
        finalDegree: lastEntry.degree,
        lastDate: lastEntry.date
    };
}

async function seed() {
    await connectDB();
    await clearDatabase();

    const franchises = [];
    const allStudents = [];
    const allTeachers = [];
    const allClasses = [];
    const today = new Date();

    // 1. Create Franchises
    console.log(`Creating ${CITY_DATA.length} franchises...`);
    for (const cityData of CITY_DATA) {
        const franchiseName = `Arena ${cityData.name}`;
        const cityKey = cityData.name.toLowerCase().replace(/\s/g, '');

        const franchise = new Franchise({
            name: franchiseName,
            owner: generateName('Masculino'),
            address: cityData.address,
            phone: `+55 (11) 9${getRandomInt(7000, 9999)}-${getRandomInt(1000, 9999)}`,
            email: `contato@arena${cityKey}.com.br`,
            status: 'active',
            location: {
                type: 'Point',
                coordinates: [cityData.lng, cityData.lat]
            },
            plan: getRandomElement(['Standard', 'Master']),
            students: 60,
            teachers: 3,
            revenue: 0,
            expenses: 0,
            royaltyPercent: getRandomInt(5, 10),
            metrics: {
                retention: getRandomInt(85, 98),
                satisfaction: getRandomInt(9, 10),
                growth: getRandomInt(2, 8)
            },
            branding: {
                brandName: `Arena ${cityData.name} BJJ`,
                primaryColor: '#FF6B00',
                secondaryColor: '#000000',
                supportEmail: `suporte@arena${cityKey}.com`,
                supportPhone: `+55 (11) 9${getRandomInt(8000, 9999)}-${getRandomInt(1000, 9999)}`,
                logoUrl: `https://ui-avatars.com/api/?name=Arena+${cityData.name}&background=FF6B00&color=fff`,
                faviconUrl: 'https://arenajiujitsuhub.com/favicon.ico'
            }
        });
        await franchise.save();
        franchises.push(franchise);

        // Metrics History (12 Months)
        for (let i = 12; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const period = date.toISOString().slice(0, 7);
            
            // Alternating pattern for history, but last month reflects reality
            const isPositive = i === 0 || i % 2 === 0;
            const growthFactor = isPositive ? getRandomInt(2, 10) : getRandomInt(-5, -1);
            
            await Metric.create({
                franchiseId: franchise._id,
                period,
                students: {
                    total: Math.max(0, 60 - (i * 2) + growthFactor),
                    new: getRandomInt(5, 12),
                    churn: getRandomInt(0, 4)
                },
                finance: {
                    revenue: Math.max(0, (60 - i) * 350 + (growthFactor * 100)),
                    expenses: getRandomInt(8000, 12000),
                    profit: 0
                },
                teachers: { count: 3 }
            });
        }
    }

    // 2. Create Teachers
    console.log('Creating teachers with IBJJF history...');
    for (const franchise of franchises) {
        const cityMatch = franchise.name.replace('Arena ', '');
        
        for (let i = 0; i < 3; i++) {
            const isMaster = i === 0;
            const targetBelt = isMaster ? getRandomElement(['Preta', 'Coral', 'Vermelha']) : 'Preta';
            let targetDegreeInt = isMaster ? getRandomInt(4, 9) : getRandomInt(1, 4);
            const targetDegree = `${targetDegreeInt}º Grau`;
            
            const age = 30 + (targetDegreeInt * 4) + (isMaster ? 20 : 0);
            const birthDate = new Date(today.getFullYear() - age, getRandomInt(0, 11), getRandomInt(1, 28));
            const startDate = new Date(birthDate.getFullYear() + 15, 0, 1);

            const genResult = generateIBJJFHistory(targetBelt, targetDegree, false, "Grand Master Gracie", startDate);

            const teacher = new Teacher({
                name: generateName('Masculino'),
                birthDate,
                gender: 'Masculino',
                phone: `(11) 9${getRandomInt(8000, 9999)}-${getRandomInt(1000, 9999)}`,
                email: `sensei.f${franchises.indexOf(franchise)}.t${i}@arena.com`,
                address: `Rua dos Mestres, ${getRandomInt(10, 500)} - Bairro Nobre, ${cityMatch}`,
                belt: genResult.finalBelt,
                degree: genResult.finalDegree,
                franchiseId: franchise._id,
                hireDate: new Date(2022, 0, 1),
                active: true,
                graduationHistory: genResult.history
            });
            await teacher.save();
            allTeachers.push(teacher);
        }
    }

    // 3. Create Students
    console.log('Creating 1800 students (60 per academy) with full history and payments...');
    for (const franchise of franchises) {
        const localTeachers = allTeachers.filter(t => t.franchiseId.equals(franchise._id));
        const promoter = localTeachers[0];
        const cityMatch = franchise.name.replace('Arena ', '');

        for (let i = 0; i < 60; i++) {
            const isKid = i < 15;
            const gender = getRandomElement(['Masculino', 'Feminino']) as 'Masculino' | 'Feminino';
            const age = isKid ? getRandomInt(6, 15) : getRandomInt(18, 50);
            const birthDate = new Date(today.getFullYear() - age, getRandomInt(0, 11), getRandomInt(1, 28));
            
            let targetBelt = 'Branca';
            if (isKid) {
                targetBelt = getRandomElement(BELT_ORDER_KIDS);
            } else {
                const r = Math.random();
                if (r > 0.95) targetBelt = 'Preta';
                else if (r > 0.85) targetBelt = 'Marrom';
                else if (r > 0.70) targetBelt = 'Roxa';
                else if (r > 0.40) targetBelt = 'Azul';
            }
            
            const targetDegree = getRandomElement(['Nenhum', '1º Grau', '2º Grau', '3º Grau', '4º Grau']);
            const yearsTraining = isKid ? (age - 5) : (targetBelt === 'Preta' ? 12 : (targetBelt === 'Marrom' ? 8 : (targetBelt === 'Roxa' ? 5 : (targetBelt === 'Azul' ? 3 : 1))));
            const startDate = new Date(today.getFullYear() - yearsTraining, getRandomInt(0, 11), 1);

            const genResult = generateIBJJFHistory(targetBelt, targetDegree, isKid, promoter?._id, startDate);

            const student = new Student({
                name: generateName(gender),
                gender,
                birthDate,
                phone: `(11) 9${getRandomInt(9000, 9999)}-${getRandomInt(1000, 9999)}`,
                email: `student.f${franchises.indexOf(franchise)}.s${i}@arena.com`,
                address: `Rua do Aluno, ${getRandomInt(10, 1000)} - Residencial, ${cityMatch}`,
                belt: genResult.finalBelt,
                degree: genResult.finalDegree,
                lastGraduationDate: genResult.lastDate,
                graduationHistory: genResult.history,
                amount: getRandomInt(250, 450),
                registrationDate: startDate,
                paymentStatus: 'Paga',
                franchiseId: franchise._id
            });
            await student.save();
            allStudents.push(student);

            // Payment History (Full from registration)
            const regMonths = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
            const maxPayments = Math.min(regMonths, 24); // Cap at 2 years
            for (let m = 0; m <= maxPayments; m++) {
                const paidAt = new Date(today.getFullYear(), today.getMonth() - m, 5);
                if (paidAt < startDate) continue;

                await Payment.create({
                    franchiseId: franchise._id,
                    studentId: student._id,
                    type: 'Tuition',
                    amount: student.amount,
                    status: 'approved',
                    paymentMethod: 'credit_card',
                    paidAt,
                    createdAt: paidAt,
                    description: `Mensalidade ${paidAt.getMonth()+1}/${paidAt.getFullYear()}`
                });
            }
        }
    }

    // 4. Create Classes
    console.log('Creating sequential classes (06:00 - 22:00)...');
    const CATEGORIES = ['BJJ', 'No-Gi', 'Wrestling', 'Fundamentals'];
    
    for (const franchise of franchises) {
        const myTeachers = allTeachers.filter(t => t.franchiseId.equals(franchise._id));
        
        let classIndex = 0;
        for (let dw = 1; dw <= 6; dw++) { // Mon-Sat
            for (let hour = 6; hour < 22; hour++) { // 06:00 to 21:00 (ends at 22:00)
                const startTime = `${hour.toString().padStart(2, '0')}:00`;
                const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
                
                const teacher = myTeachers[classIndex % myTeachers.length];
                
                // Logic for categories and audience
                let category = getRandomElement(CATEGORIES);
                let audience = 'adults';
                
                // Kids classes usually in late afternoon
                if (hour >= 17 && hour <= 18) {
                    category = 'Kids';
                    audience = 'kids';
                } else if (hour === 19) {
                    audience = 'women';
                }
                
                const cls = new Class({
                    franchiseId: franchise._id,
                    teacherId: teacher._id,
                    name: `${category} ${audience === 'kids' ? 'Infantil' : (audience === 'women' ? 'Feminino' : 'Adulto')}`,
                    dayOfWeek: dw,
                    startTime,
                    endTime,
                    capacity: getRandomInt(20, 40),
                    category: category as any,
                    level: getRandomElement(['beginner', 'intermediate', 'advanced']),
                    targetAudience: audience as any,
                    minBelt: audience === 'kids' ? 'Branca' : (classIndex % 5 === 0 ? 'Azul' : 'Branca'),
                    active: true
                });
                
                await cls.save();
                allClasses.push(cls);
                classIndex++;
            }
        }
    }

    // 5. Attendance & Sessions (Last 3 months)
    console.log('Generating attendance and class sessions...');
    const months = [0, 1, 2];
    for (const mIdx of months) {
        const targetMonth = new Date(today.getFullYear(), today.getMonth() - mIdx, 1);
        const periodStr = targetMonth.toISOString().slice(0, 7);
        const daysInMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), d);
            if (date > today) break;
            const dw = date.getDay();
            if (dw === 0) continue;

            const dayClasses = allClasses.filter(c => c.dayOfWeek === dw);
            const sessionDocs = [];
            const attendanceUpdates = [];

            for (const cls of dayClasses) {
                const session = new ClassSession({
                    classId: cls._id,
                    franchiseId: cls.franchiseId,
                    date,
                    startTime: cls.startTime,
                    endTime: cls.endTime,
                    teacherId: cls.teacherId,
                    capacity: cls.capacity,
                    status: 'completed'
                });

                const franchiseStudents = allStudents.filter(s => s.franchiseId.equals(cls.franchiseId));
                const eligible = franchiseStudents.filter(s => {
                    const studentAge = s.age || 0;
                    if (cls.targetAudience === 'kids' && studentAge > 15) return false;
                    if (cls.targetAudience === 'adults' && studentAge < 16) return false;
                    return Math.random() > 0.6;
                }).slice(0, cls.capacity);

                session.bookedCount = eligible.length;
                session.checkedInCount = eligible.length;
                sessionDocs.push(session);

                for (const student of eligible) {
                    attendanceUpdates.push({
                        studentId: student._id,
                        tenantId: cls.franchiseId,
                        month: periodStr,
                        record: {
                            date,
                            classId: cls._id,
                            sessionId: session._id,
                            status: 'Present',
                            snapshot: {
                                className: cls.name,
                                teacherName: 'Professor',
                                startTime: cls.startTime,
                                category: cls.category
                            }
                        }
                    });
                }
            }
            
            if (sessionDocs.length > 0) {
                await ClassSession.insertMany(sessionDocs);
                // Group updates by student and month to create buckets
                const grouped = new Map();
                for (const upd of attendanceUpdates) {
                    const key = `${upd.studentId}_${upd.month}`;
                    if (!grouped.has(key)) grouped.set(key, { studentId: upd.studentId, tenantId: upd.tenantId, month: upd.month, records: [] });
                    grouped.get(key).records.push(upd.record);
                }

                for (const bucket of grouped.values()) {
                    await Attendance.findOneAndUpdate(
                        { studentId: bucket.studentId, month: bucket.month },
                        { 
                            $push: { records: { $each: bucket.records } },
                            $inc: { totalPresent: bucket.records.length },
                            $setOnInsert: { tenantId: bucket.tenantId }
                        },
                        { upsert: true }
                    );
                }
            }
        }
    }

    // 6. Graduation Rules
    console.log('Creating graduation rules...');
    const ADULT_BELTS = ['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta'];
    for (let i = 0; i < ADULT_BELTS.length; i++) {
        for (let d = 0; d < 5; d++) {
            const currentDegree = d === 0 ? 'Nenhum' : `${d}º Grau`;
            let nextBelt = ADULT_BELTS[i];
            let nextDegree = `${d+1}º Grau`;
            
            if (d === 4) {
               if (i === ADULT_BELTS.length - 1) continue;
               nextBelt = ADULT_BELTS[i+1];
               nextDegree = 'Nenhum';
            }

            const beltClasses = ADULT_BELTS[i] === 'Azul' ? 20 : (ADULT_BELTS[i] === 'Roxa' ? 30 : (ADULT_BELTS[i] === 'Marrom' ? 40 : 20));

            await GraduationRule.create({
                fromBelt: ADULT_BELTS[i],
                fromDegree: currentDegree,
                toBelt: nextBelt,
                toDegree: nextDegree,
                classesRequired: (d === 4) ? beltClasses * 1.5 : beltClasses,
                minDaysRequired: 30,
                isActive: true
            });
        }
    }

    console.log('Seeding completed! 30 academies, 1.8k students, 90 teachers, full histories created.');
    process.exit(0);
}

seed();
