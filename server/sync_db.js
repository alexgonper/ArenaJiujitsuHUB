const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

// Models
const Franchise = require('./models/Franchise');
const Teacher = require('./models/Teacher');
const Student = require('./models/Student');
const Class = require('./models/Class');
const Attendance = require('./models/Attendance');
const ClassBooking = require('./models/ClassBooking');
const Directive = require('./models/Directive');
const Metric = require('./models/Metric');
const Payment = require('./models/Payment');
const DashboardLayout = require('./models/DashboardLayout');
const GraduationRule = require('./models/GraduationRule');
const Plan = require('./models/Plan');

const MODELS = {
    Franchise, Teacher, Student, Class, Attendance, ClassBooking,
    Directive, Metric, Payment, DashboardLayout, GraduationRule, Plan
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const LOCAL_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix';

async function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
    console.log('🔄 SCRIPT DE SINCRONIZAÇÃO (LOCAL -> REMOTO)');
    console.log('-------------------------------------------');

    // 1. Get Remote URI
    const remoteUri = await askQuestion('🌐 Cole a Connection String do MongoDB REMOTO: ');
    if (!remoteUri.startsWith('mongodb')) {
        console.error('❌ Connection String inválida.');
        process.exit(1);
    }

    console.log(`\n⏳ Conectando ao Banco LOCAL: ${LOCAL_URI}...`);
    const connLocal = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('✅ Conectado ao Local.');

    console.log(`⏳ Conectando ao Banco REMOTO...`);
    const connRemote = await mongoose.createConnection(remoteUri).asPromise();
    console.log('✅ Conectado ao Remoto.');

    // 2. Load Data from Local
    console.log('\n📥 Lendo dados do Local...');
    const localData = {};
    
    for (const [name, model] of Object.entries(MODELS)) {
        // We need to use the model attached to the specific connection
        const ModelLocal = connLocal.model(name, model.schema);
        const data = await ModelLocal.find({});
        localData[name] = data;
        console.log(`   - ${name}: ${data.length} registros`);
    }

    // 3. Confirm Overwrite
    console.log('\n⚠️  ATENÇÃO: ISSO IRÁ APAGAR TODOS OS DADOS NO BANCO REMOTO E SUBSTITUIR PELOS LOCAIS.');
    const confirm = await askQuestion('Digite "CONFIRMAR" para prosseguir: ');

    if (confirm !== 'CONFIRMAR') {
        console.log('❌ Operação cancelada.');
        process.exit(0);
    }

    // 4. Wipe and Insert Remote
    console.log('\n📤 Iniciando Upload para Remoto...');

    for (const [name, model] of Object.entries(MODELS)) {
        const ModelRemote = connRemote.model(name, model.schema);
        
        // Wipe
        process.stdout.write(`   - ${name}: Apagando... `);
        await ModelRemote.deleteMany({});
        process.stdout.write(`Inserindo ${localData[name].length}... `);
        
        // Insert
        if (localData[name].length > 0) {
            await ModelRemote.insertMany(localData[name]);
        }
        console.log('✅ Feito.');
    }

    console.log('\n✨ Sincronização Concluída!');
    
    await connLocal.close();
    await connRemote.close();
    rl.close();
}

main().catch(err => {
    console.error('\n❌ Erro Fatal:', err);
    process.exit(1);
});
