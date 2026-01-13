
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Franchise = require('../models/Franchise');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Class = require('../models/Class');
const { connectDB, closeDB } = require('../config/database');

const REMOTE_API_URL = 'https://arenajiujitsuhub-2.onrender.com/api/v1';

async function fetchJson(endpoint) {
    try {
        const res = await fetch(`${REMOTE_API_URL}${endpoint}`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Error fetching ${endpoint}:`, err.message);
        return { data: [] };
    }
}

async function postJson(endpoint, data) {
    try {
        const res = await fetch(`${REMOTE_API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (!res.ok) {
            return { success: false, error: result.error || result.message || 'Unknown error' };
        }
        return { success: true, data: result.data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

async function run() {
    try {
        console.log('🔌 Connecting to LOCAL database...');
        await connectDB();

        // 1. SYNC FRANCHISES
        console.log('\n🏢 Syncing Franchises...');
        const localFranchises = await Franchise.find({});
        const remoteFranchisesData = await fetchJson('/franchises');
        const remoteFranchises = remoteFranchisesData.data || [];

        const nameToRemoteId = new Map();
        remoteFranchises.forEach(f => nameToRemoteId.set(f.name, f._id));

        const localIdToRemoteId = new Map();
        let fAdded = 0;

        for (const lf of localFranchises) {
            let remoteId = nameToRemoteId.get(lf.name);
            if (!remoteId) {
                console.log(`   ➕ Posting franchise: ${lf.name}...`);
                const payload = lf.toObject();
                delete payload._id;
                delete payload.__v;
                delete payload.createdAt;
                delete payload.updatedAt;

                const res = await postJson('/franchises', payload);
                if (res.success) {
                    remoteId = res.data._id;
                    fAdded++;
                } else {
                    console.error(`   ❌ Failed to post franchise ${lf.name}: ${res.error}`);
                }
            }
            if (remoteId) localIdToRemoteId.set(lf._id.toString(), remoteId);
        }
        console.log(`✅ Franchises synced. Added: ${fAdded}. Total mapped: ${localIdToRemoteId.size}`);

        // 2. SYNC TEACHERS
        console.log('\n👨‍🏫 Syncing Teachers...');
        const localTeachers = await Teacher.find({});
        const remoteTeachersData = await fetchJson('/teachers');
        const remoteTeachers = remoteTeachersData.data || [];

        const teacherKeyToRemoteId = new Map();
        remoteTeachers.forEach(t => {
            const fId = t.franchiseId?._id || t.franchiseId;
            teacherKeyToRemoteId.set(`${t.name}|${fId}`, t._id);
        });

        const localTIdToRemoteTId = new Map();
        let tAdded = 0;

        for (const lt of localTeachers) {
            const remoteFId = localIdToRemoteId.get(lt.franchiseId.toString());
            if (!remoteFId) {
                console.warn(`   ⚠️ Skipping teacher ${lt.name}: No remote franchise ID.`);
                continue;
            }

            const key = `${lt.name}|${remoteFId}`;
            let remoteTId = teacherKeyToRemoteId.get(key);

            if (!remoteTId) {
                console.log(`   ➕ Posting teacher: ${lt.name}...`);
                const payload = lt.toObject();
                payload.franchiseId = remoteFId;
                delete payload._id;
                delete payload.__v;
                delete payload.createdAt;
                delete payload.updatedAt;

                const res = await postJson('/teachers', payload);
                if (res.success) {
                    remoteTId = res.data._id;
                    tAdded++;
                } else {
                    console.error(`   ❌ Failed to post teacher ${lt.name}: ${res.error}`);
                }
            }
            if (remoteTId) localTIdToRemoteTId.set(lt._id.toString(), remoteTId);
        }
        console.log(`✅ Teachers synced. Added: ${tAdded}. Total mapped: ${localTIdToRemoteTId.size}`);

        // 3. SYNC STUDENTS
        console.log('\n🎓 Syncing Students...');
        const localStudents = await Student.find({});
        // For students, the list might be large, but let's fetch them to avoid dupes
        const remoteStudentsData = await fetchJson('/students');
        const remoteStudents = remoteStudentsData.data || [];

        const studentKeys = new Set(remoteStudents.map(s => {
            const fId = s.franchiseId?._id || s.franchiseId;
            return `${s.name}|${fId}`;
        }));

        let sAdded = 0;
        for (const ls of localStudents) {
            const remoteFId = localIdToRemoteId.get(ls.franchiseId.toString());
            if (!remoteFId) continue;

            const key = `${ls.name}|${remoteFId}`;
            if (!studentKeys.has(key)) {
                // Check email as well if exists
                if (ls.email) {
                    const emailExists = remoteStudents.some(rs => rs.email === ls.email);
                    if (emailExists) continue;
                }

                console.log(`   ➕ Posting student: ${ls.name}...`);
                const payload = ls.toObject();
                payload.franchiseId = remoteFId;

                // Map promotedBy in history if possible
                if (payload.graduationHistory) {
                    payload.graduationHistory = payload.graduationHistory.map(h => ({
                        ...h,
                        promotedBy: h.promotedBy ? (localTIdToRemoteTId.get(h.promotedBy.toString()) || null) : null
                    }));
                }

                delete payload._id;
                delete payload.__v;
                delete payload.createdAt;
                delete payload.updatedAt;

                const res = await postJson('/students', payload);
                if (res.success) {
                    sAdded++;
                } else {
                    console.error(`   ❌ Failed to post student ${ls.name}: ${res.error}`);
                }
            }
        }
        console.log(`✅ Students synced. Added: ${sAdded}.`);

        // 4. SYNC CLASSES
        console.log('\n📅 Syncing Classes...');
        const localClasses = await Class.find({});
        // Since there's no easy way to get ALL classes (they are by franchise in the route), 
        // we'll just try to post and handle internal duplication if the API allowed it, 
        // but here we just check our local map for what we should post.

        let cAdded = 0;
        for (const lc of localClasses) {
            const remoteFId = localIdToRemoteId.get(lc.franchiseId.toString());
            const remoteTId = localTIdToRemoteTId.get(lc.teacherId.toString());

            if (!remoteFId || !remoteTId) continue;

            // We'll trust our logic or assume small set for now.
            // Ideally we'd fetch per franchise.
            console.log(`   ➕ Posting class: ${lc.name} (${lc.startTime})...`);
            const payload = lc.toObject();
            payload.franchiseId = remoteFId;
            payload.teacherId = remoteTId;

            delete payload._id;
            delete payload.__v;
            delete payload.createdAt;
            delete payload.updatedAt;

            const res = await postJson('/classes', payload);
            if (res.success) {
                cAdded++;
            } else {
                console.error(`   ❌ Failed to post class ${lc.name}: ${res.error}`);
            }
        }
        console.log(`✅ Classes synced. Added: ${cAdded}.`);

        console.log('\n🎉 ALL DONE!');
        await closeDB();
        process.exit(0);

    } catch (error) {
        console.error('Fatal Error:', error);
        process.exit(1);
    }
}

run();
