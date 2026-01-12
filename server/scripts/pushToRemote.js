
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Franchise = require('../models/Franchise');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const { connectDB, closeDB } = require('../config/database');

const REMOTE_API_URL = 'https://arenajiujitsuhub-2.onrender.com/api/v1';

async function fetchJson(endpoint) {
    try {
        const res = await fetch(`${REMOTE_API_URL}${endpoint}`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Error fetching ${endpoint}:`, err.message);
        return { data: [] }; // Return empty structure on fail
    }
}

async function postJson(endpoint, data) {
    try {
        const res = await fetch(`${REMOTE_API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const txt = await res.text();
            return { success: false, error: txt };
        }
        return await res.json();
    } catch (err) {
        return { success: false, error: err.message };
    }
}

async function run() {
    try {
        console.log('🔌 Connecting to LOCAL database...');
        await connectDB();

        // 1. Map Franchises (Local ID -> Remote ID via Name)
        console.log('🗺️  Mapping Franchises...');
        const localFranchises = await Franchise.find({});
        const remoteFranchisesData = await fetchJson('/franchises');
        const remoteFranchises = remoteFranchisesData.data || [];

        const localIdToName = new Map();
        localFranchises.forEach(f => localIdToName.set(f._id.toString(), f.name));

        const nameToRemoteId = new Map();
        remoteFranchises.forEach(f => nameToRemoteId.set(f.name, f._id || f.id));

        const localToRemoteIdMap = new Map();
        localFranchises.forEach(f => {
            const remoteId = nameToRemoteId.get(f.name);
            if (remoteId) {
                localToRemoteIdMap.set(f._id.toString(), remoteId);
            } else {
                console.warn(`⚠️  No remote match for franchise: ${f.name}`);
            }
        });

        console.log(`✅ Mapped ${localToRemoteIdMap.size} franchises.`);

        // 2. Sync Teachers
        console.log('\n👨‍🏫 Syncing Teachers...');
        const localTeachers = await Teacher.find({});
        const remoteTeachersData = await fetchJson('/teachers');
        const remoteTeachers = remoteTeachersData.data || [];

        // Identify missing teachers on remote
        // We use Name + FranchiseName as a unique key for check to avoid dupes
        const remoteTeacherKeys = new Set(remoteTeachers.map(t => {
            const fName = t.franchiseId ? (t.franchiseId.name || '') : '';
            return `${t.name}|${fName}`;
        }));

        let addedTeachers = 0;
        let diffTeachers = 0;

        for (const t of localTeachers) {
            const fName = localIdToName.get(t.franchiseId.toString());
            const key = `${t.name}|${fName}`;

            if (!remoteTeacherKeys.has(key)) {
                diffTeachers++;
                // Check if we have a valid remote franchise ID to attach to
                const remoteFranchiseId = localToRemoteIdMap.get(t.franchiseId.toString());

                if (remoteFranchiseId) {
                    process.stdout.write(`   Posting ${t.name} to ${fName}... `);

                    const payload = {
                        ...t.toObject(),
                        franchiseId: remoteFranchiseId,
                        birthDate: t.birthDate ? t.birthDate.toISOString() : null,
                        hireDate: t.hireDate ? t.hireDate.toISOString() : null
                    };
                    delete payload._id;
                    delete payload.__v;
                    delete payload.createdAt;
                    delete payload.updatedAt;

                    const result = await postJson('/teachers', payload);
                    if (result.success) {
                        console.log('✅ OK');
                        addedTeachers++;
                    } else {
                        console.log(`❌ Fail: ${result.error}`);
                    }
                } else {
                    console.log(`⏭️  Skipping ${t.name}: No remote franchise ID.`);
                }
            }
        }
        console.log(`🏁 Teachers Sync: Added ${addedTeachers}/${diffTeachers} missing teachers.`);

        await closeDB();
        process.exit(0);

    } catch (error) {
        console.error('Fatal Error:', error);
        process.exit(1);
    }
}

run();
