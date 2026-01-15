const mongoose = require('mongoose');
const ClassBooking = require('./models/ClassBooking');
const Class = require('./models/Class');
const Student = require('./models/Student');
const Franchise = require('./models/Franchise');
require('dotenv').config();

// Mock Request/Response
const mockRes = () => {
    return {
        status: function(code) { 
            this.statusCode = code; 
            return this; 
        },
        json: function(data) { 
            this.data = data; 
            return this; 
        }
    };
};

async function testFlow() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log('✅ Conectado ao MongoDB');

        // 1. Get Dependencies
        const cls = await Class.findOne({});
        const student = await Student.findOne({});
        const franchise = await Franchise.findOne({});

        if (!cls || !student) {
            console.log('❌ Falta dados para teste.');
            return;
        }

        console.log(`🧪 Testando com: Aula=${cls.name}, Aluno=${student.name}`);

        // Define a date (like frontend does)
        // Frontend sends ISO string from nextDate calculation
        // Let's assume sending "2024-01-20T00:00:00.000Z"
        const dateInput = new Date();
        dateInput.setDate(dateInput.getDate() + 1); // Tomorrow
        dateInput.setHours(0,0,0,0);
        const dateStr = dateInput.toISOString();

        console.log(`📅 Data input: ${dateStr}`);

        // --- STEP 1: RESERVE ---
        console.log('\n🔵 1. TENTANDO RESERVAR...');
        
        let encodingDate = new Date(dateStr);
        encodingDate.setHours(0, 0, 0, 0);
        let endOfDay = new Date(encodingDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Logic copied from controller
        let existing = await ClassBooking.findOne({
            classId: cls._id,
            studentId: student._id,
            date: { $gte: encodingDate, $lte: endOfDay }
        });

        if (existing) {
            console.log('⚠️ Já existia reserva anterior (limpando para teste...)');
            await ClassBooking.deleteMany({ classId: cls._id, studentId: student._id });
            existing = null;
        }

        const booking1 = await ClassBooking.create({
            franchiseId: franchise._id,
            classId: cls._id,
            studentId: student._id,
            date: encodingDate, // Normalized
            status: 'reserved'
        });
        console.log(`✅ Reserva criada: ID=${booking1._id} Status=${booking1.status}`);


        // --- STEP 2: CANCEL ---
        console.log('\n🔵 2. TENTANDO CANCELAR...');
        const toCancel = await ClassBooking.findById(booking1._id);
        toCancel.status = 'cancelled';
        await toCancel.save();
        console.log(`✅ Reserva cancelada: Status=${toCancel.status}`);


        // --- STEP 3: RE-RESERVE ---
        console.log('\n🔵 3. TENTANDO RE-RESERVAR (Mesma Data)...');
        
        // Re-run controller logic
        const existing2 = await ClassBooking.findOne({
            classId: cls._id,
            studentId: student._id,
            date: { $gte: encodingDate, $lte: endOfDay }
        });

        console.log(`🔍 Busca retornou: ${existing2 ? 'ENCONTRADO' : 'NULL'}`);
        if (existing2) {
            console.log(`   -> Status atual: ${existing2.status}`);
            console.log(`   -> Data no banco: ${existing2.date.toISOString()}`);
            console.log(`   -> Range busca: ${encodingDate.toISOString()} até ${endOfDay.toISOString()}`);
        }

        if (existing2) {
            if (existing2.status === 'cancelled') {
                existing2.status = 'reserved';
                await existing2.save();
                console.log(`✅ SUCESSO! Reserva reativada.`);
            } else {
                console.log(`❌ FALHA! Deveria estar cancelada, mas está: ${existing2.status}`);
            }
        } else {
            console.log(`❌ FALHA GRAVE! findOne não achou a reserva cancelada!`);
            // Try create will fail
            try {
                await ClassBooking.create({
                    franchiseId: franchise._id,
                    classId: cls._id,
                    studentId: student._id,
                    date: encodingDate,
                    status: 'reserved'
                });
            } catch (e) {
                console.log(`   -> Erro ao criar (como esperado se duplicado): ${e.code}`);
            }
        }

    } catch (error) {
        console.error('❌ Erro Geral:', error);
    } finally {
        await mongoose.disconnect();
    }
}

testFlow();
