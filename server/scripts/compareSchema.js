
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { connectDB, closeDB } = require('../config/database');

const REMOTE_BASE_URL = 'https://arenajiujitsuhub-2.onrender.com/api/v1';

async function checkRoute(endpoint) {
    try {
        const res = await fetch(`${REMOTE_BASE_URL}${endpoint}`);
        return {
            exists: res.status !== 404,
            status: res.status,
            isJson: res.headers.get('content-type')?.includes('application/json')
        };
    } catch (err) {
        return { exists: false, error: err.message };
    }
}

async function run() {
    try {
        console.log('🔌 Verificando Tabelas/Coleções...');
        await connectDB();

        const localCollections = await mongoose.connection.db.listCollections().toArray();
        const localNames = localCollections.map(c => c.name);

        console.log('\n📋 Tabelas no Banco Local:');
        console.log(localNames.join(', '));

        console.log('\n🔍 Verificando disponibilidade no Servidor Remoto (via API):');
        console.log('------------------------------------------------------------');
        console.log('| Tabela/Recurso | Rota API         | Status Remoto       |');
        console.log('------------------------------------------------------------');

        const mappings = [
            { name: 'franchises', route: '/franchises' },
            { name: 'teachers', route: '/teachers' },
            { name: 'students', route: '/students' },
            { name: 'classes', route: '/classes' }, // we checked this via schedule usually
            { name: 'attendances', route: '/attendance' },
            { name: 'directives', route: '/directives' },
            { name: 'graduations', route: '/graduation/eligible/x' }, // checking the root
            { name: 'metrics', route: '/metrics' },
            { name: 'payments', route: '/payments' }
        ];

        for (const m of mappings) {
            const result = await checkRoute(m.route.replace('/x', ''));
            let status = result.exists ? '✅ Existe (API)' : '❌ Não exposto/404';
            if (result.status === 401 || result.status === 403) status = '🔒 Protegido (401/403)';

            console.log(`| ${m.name.padEnd(14)} | ${m.route.padEnd(16)} | ${status.padEnd(19)} |`);
        }
        console.log('------------------------------------------------------------');

        console.log('\n🧪 Comparando Esquema (Exemplo: Aluno)');
        const Student = require('../models/Student');
        const localSample = await Student.findOne();

        if (localSample) {
            const localKeys = Object.keys(localSample.toObject());
            const res = await fetch(`${REMOTE_BASE_URL}/students`);
            const remoteData = await res.json();
            const remoteSample = remoteData.data?.[0];

            if (remoteSample) {
                const remoteKeys = Object.keys(remoteSample);
                const onlyLocal = localKeys.filter(k => !remoteKeys.includes(k) && k !== '__v');
                const onlyRemote = remoteKeys.filter(k => !localKeys.includes(k) && k !== '__v');

                console.log('Campos Local vs Remoto (Student):');
                console.log(`- Campos extras local: [${onlyLocal.join(', ')}]`);
                console.log(`- Campos extras remoto: [${onlyRemote.join(', ')}]`);

                if (onlyLocal.length === 0 && onlyRemote.length === 0) {
                    console.log('✅ Esquemas de "Student" estão idênticos.');
                }
            }
        }

        await closeDB();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
