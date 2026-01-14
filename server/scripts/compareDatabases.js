
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Franchise = require('../models/Franchise');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Class = require('../models/Class');
const { connectDB, closeDB } = require('../config/database');

const REMOTE_API_URL = 'https://arenajiujitsuhub-2.onrender.com/api/v1';

async function fetchCount(endpoint) {
    try {
        const res = await fetch(`${REMOTE_API_URL}${endpoint}`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const result = await res.json();
        return result.count !== undefined ? result.count : (result.data ? result.data.length : 0);
    } catch (err) {
        console.error(`Error fetching count from ${endpoint}:`, err.message);
        return 'ERR';
    }
}

async function run() {
    try {
        console.log('🔌 Connecting to LOCAL database...');
        await connectDB();

        console.log('\n📊 Comparing Database Counts:');
        console.log('------------------------------------------------------------');
        console.log('| Collection | Local Count | Remote Count | Status      |');
        console.log('------------------------------------------------------------');

        const collections = [
            { name: 'Franchises', model: Franchise, endpoint: '/franchises' },
            { name: 'Teachers', model: Teacher, endpoint: '/teachers' },
            { name: 'Students', model: Student, endpoint: '/students' }
        ];

        for (const col of collections) {
            const localCount = await col.model.countDocuments();
            const remoteCount = await fetchCount(col.endpoint);

            let status = '✅ Synced';
            if (localCount !== remoteCount) {
                status = localCount > remoteCount ? '🔸 Local has more' : '🔹 Remote has more';
            }
            if (remoteCount === 'ERR') status = '❌ Fetch Error';

            console.log(`| ${col.name.padEnd(10)} | ${String(localCount).padEnd(11)} | ${String(remoteCount).padEnd(12)} | ${status.padEnd(11)} |`);
        }

        // Special case for Classes as they don't have a global count endpoint easily accessible via usual GET
        // But let's try /classes/all if it exists or just skip if not possible.
        // Actually, looking at the sync script I wrote, I know how many classes I posted.
        const localClasses = await Class.countDocuments();
        console.log(`| Classes    | ${String(localClasses).padEnd(11)} | ?            | Check Agenda |`);

        console.log('------------------------------------------------------------');

        // Check if names match for Franchises
        console.log('\n🔍 Verifying Franchise Names:');
        const localFNames = (await Franchise.find({}, 'name')).map(f => f.name).sort();
        const remoteRes = await fetch(`${REMOTE_API_URL}/franchises`);
        const remoteData = await remoteRes.json();
        const remoteFNames = (remoteData.data || []).map(f => f.name).sort();

        const missingOnRemote = localFNames.filter(n => !remoteFNames.includes(n));
        const extraOnRemote = remoteFNames.filter(n => !localFNames.includes(n));

        if (missingOnRemote.length === 0 && extraOnRemote.length === 0) {
            console.log('✅ All franchise names match exactly.');
        } else {
            if (missingOnRemote.length > 0) console.log('⚠️ Missing on Remote:', missingOnRemote.join(', '));
            if (extraOnRemote.length > 0) console.log('⚠️ Extra on Remote:', extraOnRemote.join(', '));
        }

        await closeDB();
        process.exit(0);
    } catch (error) {
        console.error('Fatal Error:', error);
        process.exit(1);
    }
}

run();
