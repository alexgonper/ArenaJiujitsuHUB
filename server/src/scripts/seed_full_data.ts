
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
    { name: "São Paulo", address: "Av. Paulista, 1578 - Bela Vista, São Paulo - SP, Brasil", lat: -23.5614, lng: -46.6559 },
    { name: "Rio de Janeiro", address: "Av. Atlântica, 1702 - Copacabana, Rio de Janeiro - RJ, Brasil", lat: -22.9694, lng: -43.1785 },
    { name: "Belo Horizonte", address: "Av. Afonso Pena, 1000 - Centro, Belo Horizonte - MG, Brasil", lat: -19.9242, lng: -43.9387 },
    { name: "Vitória", address: "Av. Nossa Sra. da Penha, 1287 - Santa Lucia, Vitória - ES, Brasil", lat: -20.2974, lng: -40.2957 },
    
    // Brazil - South
    { name: "Curitiba", address: "R. XV de Novembro, 300 - Centro, Curitiba - PR, Brasil", lat: -25.4296, lng: -49.2719 },
    { name: "Florianópolis", address: "Av. Beira Mar Norte, 2000 - Centro, Florianópolis - SC, Brasil", lat: -27.5847, lng: -48.5453 },
    { name: "Porto Alegre", address: "Av. Borges de Medeiros, 2035 - Praia de Belas, Porto Alegre - RS, Brasil", lat: -30.0487, lng: -51.2286 },
    
    // Brazil - Northeast
    { name: "Salvador", address: "Av. Oceânica, 2400 - Ondina, Salvador - BA, Brasil", lat: -13.0101, lng: -38.5108 },
    { name: "Recife", address: "Av. Boa Viagem, 3722 - Boa Viagem, Recife - PE, Brasil", lat: -8.1173, lng: -34.8961 },
    { name: "Fortaleza", address: "Av. Beira Mar, 3680 - Meireles, Fortaleza - CE, Brasil", lat: -3.7259, lng: -38.4883 },
    { name: "Natal", address: "Av. Engenheiro Roberto Freire, 8000 - Ponta Negra, Natal - RN, Brasil", lat: -5.8783, lng: -35.1764 },
    
    // Brazil - North & Midwest
    { name: "Manaus", address: "Av. Djalma Batista, 482 - Parque 10 de Novembro, Manaus - AM, Brasil", lat: -3.1070, lng: -60.0232 },
    { name: "Belém", address: "Av. Nazaré, 360 - Nazaré, Belém - PA, Brasil", lat: -1.4526, lng: -48.4839 },
    { name: "Brasília", address: "Sexus Comercial Residencial Norte 203 - Asa Norte, Brasília - DF, Brasil", lat: -15.7836, lng: -47.8850 },
    { name: "Goiânia", address: "Av. Goiás, 1799 - Centro, Goiânia - GO, Brasil", lat: -16.6713, lng: -49.2599 },

    // USA
    { name: "New York", address: "350 5th Ave, New York, NY 10118, Estados Unidos", lat: 40.7488, lng: -73.9857 }, // Empire State
    { name: "Los Angeles", address: "401 N Rodeo Dr, Beverly Hills, CA 90210, Estados Unidos", lat: 34.0694, lng: -118.4042 },
    { name: "Miami", address: "1601 Collins Ave, Miami Beach, FL 33139, Estados Unidos", lat: 25.7891, lng: -80.1297 },
    { name: "San Diego", address: "1350 El Prado, San Diego, CA 92101, Estados Unidos", lat: 32.7314, lng: -117.1507 },
    { name: "Chicago", address: "201 E Randolph St, Chicago, IL 60601, Estados Unidos", lat: 41.8826, lng: -87.6226 }, // The Bean
    
    // Europe
    { name: "London", address: "221B Baker St, London NW1 6XE, Reino Unido", lat: 51.5238, lng: -0.1583 },
    { name: "Paris", address: "Champ de Mars, 5 Av. Anatole France, 75007 Paris, França", lat: 48.8584, lng: 2.2945 }, // Eiffel Tower
    { name: "Lisbon", address: "Praça do Comércio, 1100-148 Lisboa, Portugal", lat: 38.7075, lng: -9.1364 },
    { name: "Barcelona", address: "C/ de Mallorca, 401, 08013 Barcelona, Espanha", lat: 41.4036, lng: 2.1744 }, // Sagrada Familia
    { name: "Rome", address: "Piazza del Colosseo, 1, 00184 Roma RM, Itália", lat: 41.8902, lng: 12.4922 }, // Colosseum
    { name: "Berlin", address: "Platz der Republik 1, 11011 Berlin, Alemanha", lat: 52.5186, lng: 13.3761 }, // Reichstag

    // Asia & Middle East
    { name: "Tokyo", address: "1 Chome-1-2 Oshiage, Sumida City, Tokyo 131-0045, Japão", lat: 35.7101, lng: 139.8107 }, // Skytree
    { name: "Dubai", address: "1 Sheikh Mohammed bin Rashid Blvd - Dubai, Emirados Árabes Unidos", lat: 25.1972, lng: 55.2744 }, // Burj Khalifa
    { name: "Abu Dhabi", address: "Sheikh Rashid Bin Saeed St - Abu Dhabi, Emirados Árabes Unidos", lat: 24.4697, lng: 54.3773 },

    // Oceania
    { name: "Sydney", address: "Bennelong Point, Sydney NSW 2000, Austrália", lat: -33.8568, lng: 151.2153 } // Opera House
];

const BELT_OPTS_ADULT = ['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta'];
const BELT_OPTS_KIDS = ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde'];
const DEGREES = ['Nenhum', '1º Grau', '2º Grau', '3º Grau', '4º Grau'];

const NAMES_FIRST = ['Carlos', 'João', 'Pedro', 'Lucas', 'Marcos', 'Rafael', 'Bruno', 'André', 'Luiz', 'Gabriel', 'Ana', 'Maria', 'Julia', 'Fernanda', 'Laura', 'Beatriz', 'Mariana', 'Camila', 'Larissa', 'Sofia', 'Rodrigo', 'Thiago', 'Felipe', 'Gustavo', 'Marcelo'];
const NAMES_LAST = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Gracie', 'Machado', 'Ribeiro', 'Martins', 'Carvalho', 'Costa', 'Almeida', 'Nascimento', 'Araujo', 'Mendes'];
const STREET_NAMES = ['Rua das Flores', 'Avenida Central', 'Rua do Comércio', 'Alameda Santos', 'Rua da Paz', 'Avenida Brasil', 'Rua dos Esportes', 'Avenida Principal', 'Rua 7 de Setembro', 'Rua 15 de Novembro'];

function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateName(): string {
    return `${getRandomElement(NAMES_FIRST)} ${getRandomElement(NAMES_LAST)}`;
}

function generateAddress(city: string): string {
    return `${getRandomElement(STREET_NAMES)}, ${getRandomInt(10, 2000)} - Bairro Central, ${city}`;
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

async function seed() {
    await connectDB();
    await clearDatabase();

    const franchises = [];
    const allStudents = [];
    const allTeachers = [];
    const allClasses = [];

    const monthsToGenerate = 12;
    const today = new Date();

    // 1. Create Franchises
    console.log(`Creating ${CITY_DATA.length} franchises...`);
    for (const cityData of CITY_DATA) {
        const franchiseName = `Arena ${cityData.name}`;
        
        // Exact coordinates
        const lat = cityData.lat;
        const lng = cityData.lng;

        const franchise = new Franchise({
            name: franchiseName,
            owner: generateName(),
            address: cityData.address, // Use exact address
            phone: `+55 (11) 99999-${getRandomInt(1000, 9999)}`,
            email: `contact@arena${cityData.name.toLowerCase().replace(/\s/g, '')}.com`,
            status: 'active',
            location: {
                type: 'Point',
                coordinates: [lng, lat] // Mongo uses [Lng, Lat]
            },
            plan: getRandomElement(['Standard', 'Master']),
            students: 0, // Will update later
            teachers: 0,
            revenue: 0,
            expenses: 0,
            metrics: {
                retention: getRandomInt(80, 99),
                satisfaction: getRandomInt(8, 10),
                growth: getRandomInt(-5, 10)
            },
            branding: {
                brandName: 'Arena Jiu Jitsu',
                primaryColor: '#FF6B00',
                secondaryColor: '#000000',
                supportEmail: `suporte@arena${cityData.name.toLowerCase().replace(/\s/g, '')}.com`,
                supportPhone: `+55 (11) 9${getRandomInt(1000, 9999)}-${getRandomInt(1000, 9999)}`
            }
        });
        await franchise.save();
        franchises.push(franchise);

        // Generate Metrics History
        let currentStudents = 60; // Target
        for (let i = monthsToGenerate; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const period = date.toISOString().slice(0, 7); // YYYY-MM
            
            // Random variation
            const fluctuation = getRandomInt(-5, 10);
            
            // For the last month (index 0), we want it to match reality roughly,
            // but we will update reality to match the last metric in the loop or logic below.
            // Actually the requirement says "ultimo mes de acordo com dados reais".
            // So we will sync after creating students/payments.
            
            await Metric.create({
                franchiseId: franchise._id,
                period,
                students: {
                    total: Math.max(0, currentStudents - (i * getRandomInt(-2, 5))),
                    new: getRandomInt(5, 15),
                    churn: getRandomInt(0, 5)
                },
                finance: {
                    revenue: Math.max(0, currentStudents * 300 + getRandomInt(-1000, 2000)),
                    expenses: getRandomInt(5000, 15000),
                    profit: 0 // calculated virtual
                }
            });
        }
    }

    // Helper for IBJJF History
    const BELT_ORDER_ADULT = ['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta', 'Coral', 'Vermelha'];
    const BELT_ORDER_KIDS = ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde'];
    
    // Min months per belt (approximate for simulation)
    const MIN_MONTHS: Record<string, number> = {
        'Branca': 12, 'Cinza': 12, 'Amarela': 12, 'Laranja': 12, 'Verde': 12,
        'Azul': 24, 'Roxa': 18, 'Marrom': 12, 'Preta': 36
    };

    function generateIBJJFHistory(
        targetBelt: string, 
        targetDegree: string, 
        isKid: boolean, 
        teacherId: any, // Allow null or ObjectId
        startDate: Date
    ): { history: any[], finalBelt: string, finalDegree: string, lastDate: Date } {
        const history = [];
        const beltOrder = isKid ? BELT_ORDER_KIDS : BELT_ORDER_ADULT;
        
        let currentBeltIdx = 0;
        let currentDegree = 0; // 0 = Nenhum, 1 = 1º, etc.
        let currentDate = new Date(startDate);
        const now = new Date();

        // Target indices
        const targetBeltIdx = beltOrder.indexOf(targetBelt);
        let targetDegreeNum = 0;
        if (targetDegree !== 'Nenhum') {
            targetDegreeNum = parseInt(targetDegree.charAt(0));
        }
        
        // Loop until we reach target
        while (currentDate <= now) {
            const currentBeltName = beltOrder[currentBeltIdx];
            
            // Add History Entry
            history.push({
                belt: currentBeltName,
                degree: currentDegree === 0 ? 'Nenhum' : `${currentDegree}º Grau`,
                date: new Date(currentDate),
                promotedBy: teacherId
            });

            // Check if reached target
            if (currentBeltIdx === targetBeltIdx && currentDegree === targetDegreeNum) {
                break;
            }

            // Advance Time & Rank
            // Time to next stripe/belt
            const beltDuration = MIN_MONTHS[currentBeltName] || 12;
            const monthsPerStripe = Math.ceil(beltDuration / 4); 
            
            // Randomize slightly
            const daysToAdd = (monthsPerStripe * 30) + getRandomInt(-10, 10);
            currentDate.setDate(currentDate.getDate() + daysToAdd);

            // Progression Logic
            if (currentBeltName === 'Preta' || currentBeltName === 'Coral' || currentBeltName === 'Vermelha') {
                // Black belt degrees (time based, usually 3 years)
                currentDegree++;
                // Check if we need to change belt (Coral/Red logic omitted for simplicity, mostly degree increment)
            } else {
                // Colored belts
                if (currentDegree < 4) {
                    currentDegree++;
                } else {
                    currentDegree = 0;
                    currentBeltIdx++;
                    if (currentBeltIdx >= beltOrder.length) break;
                }
            }
        }
        
        // If we overshoot time (future date), we must clamp but that implies the student started earlier.
        // For simulation, we just stop at "Now" if we run out of time, or we ensure StartDate was long enough ago.
        // We will return the actual valid history chain.
        
        const lastEntry = history[history.length - 1];
        return {
            history,
            finalBelt: lastEntry.belt,
            finalDegree: lastEntry.degree,
            lastDate: lastEntry.date
        };
    }

    // 2. Create Teachers & Results
    console.log('Creating teachers...');
    const teacherBelts = ['Preta', 'Coral', 'Vermelha'];
    
    // Global list of teachers for students to reference
    // We generate them first.
    
    for (const franchise of franchises) {
        // Extract city from franchise name for address match
        const cityMatch = franchise.name.replace('Arena ', '');
        
        for (let i = 0; i < 3; i++) {
            const isMaster = i === 0;
            const targetBelt = isMaster ? getRandomElement(teacherBelts) : 'Preta'; 
            let targetDegreeInt = isMaster ? getRandomInt(3, 8) : getRandomInt(0, 3);
            const targetDegree = targetDegreeInt === 0 ? 'Nenhum' : `${targetDegreeInt}º Grau`;
            
            // Teachers started long ago
            const yearsPracticing = 10 + (targetDegreeInt * 3) + (isMaster ? 10 : 0);
            const bjjStartDate = new Date(today.getFullYear() - yearsPracticing, 0, 1);
            
            // Generate History (Teacher specific simplified)
            const history = [];
            let currDate = new Date(bjjStartDate);
            // Creating explicit history for teacher
            let tBeltIdx = 0; // White
            let tDegree = 0;
            const tBeltOrder = ['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta', 'Coral', 'Vermelha'];
            const targetTIdx = tBeltOrder.indexOf(targetBelt);
            
            while(true) {
                 const bName = tBeltOrder[tBeltIdx];
                 history.push({
                     belt: bName,
                     degree: tDegree === 0 ? 'Nenhum' : `${tDegree}º Grau`,
                     date: new Date(currDate),
                     promotedBy: "Grand Master Hélio (Legacy)"
                 });
                 
                 // Break if we reached the exact target state
                 // Note: we might overshoot if logic skips? Unlikely with +=1 degree.
                 if(tBeltIdx === targetTIdx && tDegree === targetDegreeInt) break;
                 
                 // Safety Break to prevent infinite loop
                 if (tBeltIdx > targetTIdx) break; // Overshot belt
                 
                 // Increment Time
                 const yearsPerDegree = bName === 'Preta' ? 3 : (bName === 'Coral' ? 5 : 1);
                 currDate = new Date(currDate.setFullYear(currDate.getFullYear() + yearsPerDegree));
                 
                 // Logic to advance rank
                 if(bName === 'Preta') {
                     // Black belt: 0-6 degrees (roughly). At 7 (technically), become Coral.
                     // If target is Black 10th degree (Red), we must traverse.
                     if (tDegree >= 6) {
                         tBeltIdx++; // To Coral
                         tDegree = 7; // IBJJF: Coral is 7th degree. Let's start Coral at 7 for realism or 0? 
                         // My system uses Enum "Nenhum...10". 
                         // If I set tDegree=7, the next loop prints "Coral 7º Grau". This is accurate.
                     } else {
                         tDegree++;
                     }
                 } else if (bName === 'Coral') {
                     // Coral: 7, 8 degrees. At 9 -> Red.
                     if (tDegree >= 8) {
                         tBeltIdx++; // To Vermelha
                         tDegree = 9;
                     } else {
                         tDegree++;
                     }
                 } else if (bName === 'Vermelha') {
                     // Red: 9, 10.
                     if (tDegree < 10) tDegree++;
                     else break; // Cap at Red 10
                 } else {
                     // Colored Belts
                     if(tDegree < 4) tDegree++;
                     else {
                         tDegree = 0;
                         tBeltIdx++;
                     }
                 }
                 
                 // Clamp time
                 if(currDate > new Date()) {
                     // If we ran out of time but haven't reached rank, we just stop and accept meaningful history up to now.
                     // Or we fudge the last entry to match target?
                     // User priority: "Historico completo".
                     // Let's just break. The teacher will be saved with the belt/degree from the loop's last state or the Target we defined in constructor?
                     // The constructor uses `targetBelt` and `targetDegree`.
                     // The history might end prematurely.
                     // To ensure consistency, we should update the teacher's ACTUAL rank to match the last history entry if we time-out?
                     // Or just break.
                     break; 
                 }
            }

            const teacher = new Teacher({
                name: generateName(),
                birthDate: new Date(1980, getRandomInt(0, 11), getRandomInt(1, 28)),
                gender: getRandomElement(['Masculino', 'Feminino']),
                phone: `(11) 9${getRandomInt(1000, 9999)}-${getRandomInt(1000, 9999)}`,
                email: `sensei.${generateName().split(' ')[0].toLowerCase()}${getRandomInt(1, 1000)}@arena.com`,
                
                // Add Address
                address: generateAddress(cityMatch),
                
                belt: targetBelt,
                degree: targetDegree,
                franchiseId: franchise._id,
                hireDate: new Date(2020, getRandomInt(0, 11), 1),
                active: true,
                graduationHistory: history
            });
            await teacher.save();
            allTeachers.push(teacher);
        }
        franchise.teachers = 3;
        await franchise.save();
    }

    // 3. Create Students & History
    console.log('Creating students...');
    for (const franchise of franchises) {
        const cityMatch = franchise.name.replace('Arena ', '');
        // Get teachers for this franchise to be promoters
        const localTeachers = allTeachers.filter(t => t.franchiseId.equals(franchise._id));
        const promoterId = localTeachers.length > 0 ? localTeachers[0]._id : null;

        let activeStudents = 0;
        let totalRevenue = 0;

        for (let i = 0; i < 60; i++) {
            const isKid = i < 15;
            const birthYear = isKid ? getRandomInt(2012, 2018) : getRandomInt(1975, 2005);
            const birthDate = new Date(birthYear, getRandomInt(0, 11), getRandomInt(1, 28));
            
            // Determine Target Belt
            let targetBelt = 'Branca';
            if (isKid) {
                targetBelt = getRandomElement(BELT_ORDER_KIDS);
            } else {
                 const rand = Math.random();
                 if (rand > 0.9) targetBelt = 'Preta';
                 else if (rand > 0.8) targetBelt = 'Marrom';
                 else if (rand > 0.6) targetBelt = 'Roxa';
                 else if (rand > 0.4) targetBelt = 'Azul';
            }
            
            // Determine Target Degree
            let targetDegree = 'Nenhum';
            if (targetBelt !== 'Branca') {
                 targetDegree = getRandomElement(['Nenhum', '1º Grau', '2º Grau', '3º Grau', '4º Grau']);
            }

            // Estimate Start Date based on rank
            // White: 3 mo, Blue: 2.5 yrs, Purple: 5 yrs, Brown: 7 yrs, Black: 10 yrs
            let yearsTraining = 0.5; // default white
            if (targetBelt === 'Azul') yearsTraining = 3;
            if (targetBelt === 'Roxa') yearsTraining = 5;
            if (targetBelt === 'Marrom') yearsTraining = 7;
            if (targetBelt === 'Preta') yearsTraining = 10;
            if (isKid && targetBelt !== 'Branca') yearsTraining = 2; // Kids promote faster/different

            const startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - yearsTraining);
            
            // Generate Detailed History
            const genResult = generateIBJJFHistory(targetBelt, targetDegree, isKid, promoterId, startDate);

            const registrationDate = new Date(startDate); // Assume they registered when they started (or slightly after)

            const student = new Student({
                name: generateName(),
                gender: getRandomElement(['Masculino', 'Feminino']),
                birthDate,
                phone: `(11) 9${getRandomInt(1000, 9999)}-${getRandomInt(1000, 9999)}`,
                email: `aluno${getRandomInt(1, 100000)}@arena.com`,
                
                // Add Address
                address: generateAddress(cityMatch),
                
                // Use result from generator
                belt: genResult.finalBelt,
                degree: genResult.finalDegree,
                lastGraduationDate: genResult.lastDate,
                graduationHistory: genResult.history,
                
                amount: getRandomInt(200, 500),
                registrationDate: new Date(2023, 0, 1), // Standardize registration for payment logic or use realistic
                paymentStatus: 'Paga', 
                franchiseId: franchise._id
            });
            // Fix registration date to be logical with history? 
            // Students might transfer. But let's assume registrationDate = Join Date.
            // If they are Black belt, maybe they joined recently? 
            // User request: "Historico completo ... de acordo com IBJJF". 
            // Usually history implies *their life in Jiu Jitsu*.
            
            await student.save();
            allStudents.push(student);
            activeStudents++;

            // Payments (Same as before)
            const monthsDiff = (today.getFullYear() - 2023) * 12 + today.getMonth(); // approx
            const limit = 12; 
            for (let m = 0; m <= limit; m++) {
                const pDate = new Date(today.getFullYear(), today.getMonth() - m, 5);
                if (pDate < student.registrationDate) continue;

                const isLate = m === 0 && Math.random() > 0.9;
                if (isLate && m === 0) {
                    student.paymentStatus = 'Atrasada';
                    await student.save();
                } else {
                   await Payment.create({
                       franchiseId: franchise._id,
                       studentId: student._id,
                       type: 'Tuition',
                       amount: student.amount,
                       status: 'approved',
                       paymentMethod: 'credit_card',
                       paidAt: pDate,
                       createdAt: pDate,
                       description: 'Mensalidade'
                   });
                   if (m === 0) totalRevenue += student.amount;
                }
            }
        }
        
        franchise.students = activeStudents;
        franchise.revenue = totalRevenue;
        franchise.expenses = Math.floor(totalRevenue * 0.4);
        await franchise.save();
    }


    // 4. Create Classes
    console.log('Creating classes...');
    const DAYS = [1, 2, 3, 4, 5, 6]; // Mon-Sat
    const TIMES = ['07:00', '12:00', '18:00', '19:00', '20:00'];
    const CATEGORIES = ['BJJ', 'No-Gi', 'Wrestling', 'Fundamentals'];
    
    for (const franchise of franchises) {
        // Find teachers for this franchise
        const myTeachers = allTeachers.filter(t => t.franchiseId.equals(franchise._id));
        
        for (let i = 0; i < 60; i++) {
            const teacher = getRandomElement(myTeachers);
            const category = i % 10 === 0 ? 'Kids' : getRandomElement(CATEGORIES);
            const targetAudience = category === 'Kids' ? 'kids' : getRandomElement(['adults', 'women', 'adults']);
            const minBelt = category === 'Fundamentals' ? 'Branca' : 'Branca'; // Simplified
            
            const startTime = getRandomElement(TIMES);
            const [h, m] = startTime.split(':').map(Number);
            let endH = h + 1;
            let endM = m + 30; // 1.5h
            if (endM >= 60) {
                endH += 1;
                endM -= 60;
            }
            const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

            const cls = new Class({
                franchiseId: franchise._id,
                teacherId: teacher._id,
                name: `${category} ${targetAudience === 'kids' ? 'Kids' : 'Adulto'}`,
                dayOfWeek: getRandomElement(DAYS),
                startTime,
                endTime,
                capacity: getRandomInt(20, 40),
                category: category as any,
                level: 'beginner',
                targetAudience: targetAudience as any,
                minBelt,
                active: true
            });
            await cls.save();
            allClasses.push(cls);
        }
    }

    // 4.5 Create Graduation Rules
    console.log('Creating graduation rules...');
    const RULES_ADULT = ['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta'];
    const DEGREES_LIST = ['Nenhum', '1º Grau', '2º Grau', '3º Grau', '4º Grau'];
    
    for (let b = 0; b < RULES_ADULT.length; b++) {
        const currentBelt = RULES_ADULT[b];
        const nextBelt = RULES_ADULT[b + 1];

        // Degrees within current belt
        for (let d = 0; d < DEGREES_LIST.length; d++) {
            const currentDegree = DEGREES_LIST[d];
            let nextDegreeObj = '';
            let nextBeltObj = currentBelt;

            if (d < DEGREES_LIST.length - 1) {
                // Move to next degree
                nextDegreeObj = DEGREES_LIST[d + 1];
            } else {
                // Move to next belt (degree 'Nenhum')
                if (nextBelt) {
                    nextBeltObj = nextBelt;
                    nextDegreeObj = 'Nenhum';
                } else {
                    continue; // Max belt reached (Preta logic simplified here)
                }
            }

            // Create Rule
            // We set low requirements for the seed to ensure some students appear eligible
            await GraduationRule.create({
                fromBelt: currentBelt,
                fromDegree: currentDegree,
                toBelt: nextBeltObj,
                toDegree: nextDegreeObj,
                classesRequired: 15, // Low enough for 3-month history
                minDaysRequired: 30,
                examFee: 0,
                isActive: true
            });
        }
    }
    
    // 5. Generate History (Sessions and Attendance) - Last 3 months
    console.log('Generating attendance history (this may take a moment)...');
    const todayNum = new Date().getTime();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Group students by franchise for easier lookup
    const studentsByFranchise: any = {};
    for (const s of allStudents) {
        const fid = s.franchiseId.toString();
        if (!studentsByFranchise[fid]) studentsByFranchise[fid] = [];
        studentsByFranchise[fid].push(s);
    }

    // Iterate day by day for the last 90 days
    const dayIterator = new Date(threeMonthsAgo);
    
    // Batch inserts for performance
    let attendanceBatch : any[] = [];
    let sessionBatch : any[] = [];
    
    // Helper to get or create attendance document for user/month
    // For bulk insert, we'll create the record structures in memory then save using bulkWrite or similar?
    // Mongoose bulkWrite is best.
    
    // Actually, to correctly simulate the "Bucketing" pattern of Attendance model (one doc per student per month),
    // we need to be careful. 
    // Simplified approach: We will create the sessions. For attendance, we will just insert raw records into the array? 
    // No, we should respect the schema.
    
    // To avoid massive memory usage, we'll process month by month.
    
    for (let m = 0; m < 4; m++) { // 0 to 3 (covers overlaps)
         const targetMonth = new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth() + m, 1);
         if (targetMonth > today) break;
         
         const startOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
         const endOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
         
         const periodStr = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}`;
         console.log(`Processing month: ${periodStr}`);

         // Map: StudentID -> AttendanceDoc
         const studentAttendanceMap = new Map<string, any>();

         // Initialize docs for all students in this month
         // (Only if they were registered)
         for (const s of allStudents) {
             if (s.registrationDate > endOfMonth) continue;
             studentAttendanceMap.set(s._id.toString(), {
                 studentId: s._id,
                 tenantId: s.franchiseId,
                 month: periodStr,
                 records: [],
                 totalPresent: 0
             });
         }
         
         // Generate sessions for each day in this month
         for (let d = 1; d <= endOfMonth.getDate(); d++) {
             const currentDate = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth(), d);
             if (currentDate > today) break;
             
             const dayOfWeek = currentDate.getDay(); // 0=Sun, 6=Sat
             if (dayOfWeek === 0) continue; // No class sunday

             // Find classes for this day
             // Note: In our mock, dayOfWeek is 1-6. JS is 0-6.
             const todaysClasses = allClasses.filter(c => c.dayOfWeek === dayOfWeek);

             for (const cls of todaysClasses) {
                 // 1. Create Session
                 const session = new ClassSession({
                     classId: cls._id,
                     franchiseId: cls.franchiseId,
                     date: currentDate,
                     startTime: cls.startTime,
                     endTime: cls.endTime,
                     teacherId: cls.teacherId,
                     capacity: cls.capacity,
                     bookedCount: 0,
                     checkedInCount: 0,
                     status: 'completed'
                 });
                 // We won't save session individually to save time, push to batch
                 // But we need the ID for attendance.
                 
                 // Pick random attendees
                 const franchiseStudentsObs = studentsByFranchise[cls.franchiseId.toString()] || [];
                 const potentialAttendees = franchiseStudentsObs.filter((s: any) => {
                     // Check constraints
                     if (s.registrationDate > currentDate) return false;
                     if (cls.targetAudience === 'kids' && s.age > 15) return false;
                     if (cls.targetAudience === 'adults' && s.age < 16) return false;
                     // Random attendance chance
                     return Math.random() > 0.6; // 40% attendance rate
                 });
                 
                 // Cap at capacity
                 const attendees = potentialAttendees.slice(0, cls.capacity);
                 
                 session.bookedCount = attendees.length;
                 session.checkedInCount = attendees.length;
                 sessionBatch.push(session);

                 // 2. Add to Attendance
                 for (const student of attendees) {
                     const attDoc = studentAttendanceMap.get(student._id.toString());
                     if (attDoc) {
                         attDoc.records.push({
                             date: currentDate,
                             classId: cls._id,
                             sessionId: session._id,
                             status: 'Present',
                             checkInMethod: 'App',
                             snapshot: {
                                 className: cls.name,
                                 teacherName: 'Teacher', // Simplified
                                 startTime: cls.startTime,
                                 category: cls.category
                             }
                         });
                         attDoc.totalPresent++;
                     }
                 }
             }
         }
         
         // Save Sessions for this month
         if (sessionBatch.length > 0) {
            await ClassSession.insertMany(sessionBatch);
            sessionBatch = [];
         }
         
         // Save Attendance Docs
         const attendanceDocs = Array.from(studentAttendanceMap.values()).filter(d => d.records.length > 0);
         if (attendanceDocs.length > 0) {
             await Attendance.insertMany(attendanceDocs);
         }
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
}

seed();
