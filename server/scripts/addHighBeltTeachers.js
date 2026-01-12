
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Franchise = require('../models/Franchise');
const Teacher = require('../models/Teacher');
const { connectDB, closeDB } = require('../config/database');

const REMOTE_API_URL = 'https://arenajiujitsuhub-2.onrender.com/api/v1';

// Generation Data
const firstNames = ['Mestre Carlos', 'Mestre Hélio', 'Mestre Rickson', 'Grão-Mestre Flavio', 'Mestre Sylvio', 'Mestre Pedro', 'Profa. Rosa', 'Profa. Carmen', 'Mestre Robson', 'Mestre João', 'Mestre Osvaldo'];
const lastNames = ['Gracie', 'Behring', 'Machado', 'Mansor', 'Varella', 'Hemeterio', 'Fadda', 'Almeida', 'Silva', 'Santos'];
const highBelts = ['Coral', 'Vermelha'];

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateHighBeltTeacher(franchiseId) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const birthDate = getRandomDate(new Date(1940, 0, 1), new Date(1971, 0, 1));
    const hireDate = getRandomDate(new Date(2010, 0, 1), new Date());
    const belt = getRandomElement(highBelts);

    let degree;
    if (belt === 'Vermelha') {
        degree = getRandomElement(['9º Grau', '10º Grau']);
    } else {
        degree = getRandomElement(['7º Grau', '8º Grau']);
    }

    return {
        name: `${firstName} ${lastName}`,
        birthDate: birthDate,
        belt: belt,
        degree: degree,
        hireDate: hireDate,
        franchiseId: franchiseId,
        gender: firstName.includes('Profa.') ? 'Feminino' : 'Masculino',
        address: 'Endereço Gerado Automaticamente'
    };
}

async function fetchRemoteFranchises() {
    try {
        const response = await fetch(`${REMOTE_API_URL}/franchises`);
        if (!response.ok) return [];
        const json = await response.json();
        return json.data || [];
    } catch (error) {
        console.error('Error fetching remote franchises:', error.message);
        return [];
    }
}

async function postToRemote(teacher, remoteFranchiseId) {
    try {
        const payload = {
            ...teacher,
            franchiseId: remoteFranchiseId,
            birthDate: teacher.birthDate.toISOString(),
            hireDate: teacher.hireDate.toISOString()
        };
        delete payload._id;

        const response = await fetch(`${REMOTE_API_URL}/teachers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            // const txt = await response.text();
            // console.error(`Status ${response.status}: ${txt}`);
            return false;
        }
        process.stdout.write('.');
        return true;
    } catch (error) {
        console.error('Remote error:', error.message);
        return false;
    }
}

async function run() {
    try {
        console.log('🔌 Connecting to LOCAL DB...');
        await connectDB();

        const localFranchises = await Franchise.find({});
        console.log(`📍 Found ${localFranchises.length} local franchises.`);

        console.log('🌐 Fetching remote franchises for ID mapping...');
        const remoteFranchises = await fetchRemoteFranchises();
        console.log(`📍 Found ${remoteFranchises.length} remote franchises.`);

        const remoteIdMap = new Map();
        remoteFranchises.forEach(f => {
            remoteIdMap.set(f.name, f._id || f.id);
        });

        const allNewTeachers = [];
        const remoteSyncQueue = [];

        for (const localFranchise of localFranchises) {
            const remoteId = remoteIdMap.get(localFranchise.name);

            for (let i = 0; i < 5; i++) {
                const teacher = generateHighBeltTeacher(localFranchise._id);
                allNewTeachers.push(teacher);
                if (remoteId) {
                    remoteSyncQueue.push({ teacher, remoteId });
                }
            }
        }

        if (allNewTeachers.length > 0) {
            console.log(`💾 Inserting ${allNewTeachers.length} teachers locally...`);
            await Teacher.insertMany(allNewTeachers);
            console.log('✅ Local insert done.');
        }

        if (remoteSyncQueue.length > 0) {
            console.log(`🌐 Pushing ${remoteSyncQueue.length} teachers to remote API...`);
            const chunkSize = 5;
            let success = 0;
            for (let i = 0; i < remoteSyncQueue.length; i += chunkSize) {
                const chunk = remoteSyncQueue.slice(i, i + chunkSize);
                const promises = chunk.map(item => postToRemote(item.teacher, item.remoteId));
                const results = await Promise.all(promises);
                success += results.filter(r => r).length;
            }
            console.log(`\n✅ Remote sync finished. Success: ${success}/${remoteSyncQueue.length}`);
        }

        await closeDB();
        process.exit(0);

    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

run();
