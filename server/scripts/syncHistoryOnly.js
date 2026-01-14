
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
        return { data: [] };
    }
}

async function putJson(endpoint, data) {
    try {
        const res = await fetch(`${REMOTE_API_URL}${endpoint}`, {
            method: 'PUT',
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

        // 1. Map Franchises (Local ID -> Remote ID via Name)
        console.log('🗺️  Mapping Franchises...');
        const localFranchises = await Franchise.find({});
        const remoteFranchisesData = await fetchJson('/franchises');
        const remoteFranchises = remoteFranchisesData.data || [];

        const localFIdToRemoteFId = new Map();
        localFranchises.forEach(lf => {
            const rf = remoteFranchises.find(f => f.name === lf.name);
            if (rf) localFIdToRemoteFId.set(lf._id.toString(), rf._id);
        });

        // 2. Map Teachers (Local ID -> Remote ID via Name + Franchise)
        console.log('🗺️  Mapping Teachers...');
        const localTeachers = await Teacher.find({});
        const remoteTeachersData = await fetchJson('/teachers');
        const remoteTeachers = remoteTeachersData.data || [];

        const localTIdToRemoteTId = new Map();
        localTeachers.forEach(lt => {
            const remoteFId = localFIdToRemoteFId.get(lt.franchiseId.toString());
            const rt = remoteTeachers.find(t => t.name === lt.name && (t.franchiseId?._id === remoteFId || t.franchiseId === remoteFId));
            if (rt) localTIdToRemoteTId.set(lt._id.toString(), rt._id);
        });

        // 3. Sync History for Students
        console.log('\n📊 Syncing Graduation Histories...');
        const localStudents = await Student.find({ 'graduationHistory.0': { $exists: true } });
        console.log(`Found ${localStudents.length} local students with history.`);

        const remoteStudentsData = await fetchJson('/students');
        const remoteStudents = remoteStudentsData.data || [];

        let updated = 0;
        let failed = 0;

        for (const ls of localStudents) {
            const remoteFId = localFIdToRemoteFId.get(ls.franchiseId.toString());
            const rs = remoteStudents.find(s => s.name === ls.name && (s.franchiseId?._id === remoteFId || s.franchiseId === remoteFId));

            if (rs) {
                // Determine if remote already has history
                if (!rs.graduationHistory || rs.graduationHistory.length < ls.graduationHistory.length) {
                    process.stdout.write(`   ⚙️ Updating history for ${ls.name}... `);

                    const cleanHistory = ls.graduationHistory.map(h => ({
                        belt: h.belt,
                        degree: h.degree,
                        date: h.date,
                        promotedBy: h.promotedBy ? (localTIdToRemoteTId.get(h.promotedBy.toString()) || null) : null
                    }));

                    const res = await putJson(`/students/${rs._id}`, {
                        graduationHistory: cleanHistory,
                        lastGraduationDate: ls.lastGraduationDate,
                        belt: ls.belt,
                        degree: ls.degree
                    });

                    if (res.success) {
                        console.log('✅ OK');
                        updated++;
                    } else {
                        console.log(`❌ Fail: ${res.error}`);
                        failed++;
                    }
                }
            } else {
                // Student doesn't exist on remote? (Should have been synced before)
                // console.log(`   ⚠️ Student not found on remote: ${ls.name}`);
            }
        }

        console.log(`\n🎉 DONE! Updated ${updated} students. Failed: ${failed}.`);
        await closeDB();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
