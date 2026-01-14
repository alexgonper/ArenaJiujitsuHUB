
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Student = require('../models/Student');
const { connectDB, closeDB } = require('../config/database');

const REMOTE_API_URL = 'https://arenajiujitsuhub-2.onrender.com/api/v1';

async function run() {
    try {
        console.log('🔌 Connecting to LOCAL database...');
        await connectDB();

        // Local Stats
        const localStudents = await Student.find({});
        let localStudentsWithHistory = 0;
        let localTotalEntries = 0;

        localStudents.forEach(s => {
            if (s.graduationHistory && s.graduationHistory.length > 0) {
                localStudentsWithHistory++;
                localTotalEntries += s.graduationHistory.length;
            }
        });

        console.log('Fetching remote students data (this may take a moment)...');
        const res = await fetch(`${REMOTE_API_URL}/students`);
        const result = await res.json();
        const remoteStudents = result.data || [];

        let remoteStudentsWithHistory = 0;
        let remoteTotalEntries = 0;

        remoteStudents.forEach(s => {
            if (s.graduationHistory && s.graduationHistory.length > 0) {
                remoteStudentsWithHistory++;
                remoteTotalEntries += s.graduationHistory.length;
            }
        });

        console.log('\n🎓 Graduation History Comparison:');
        console.log('------------------------------------------------------------');
        console.log('| Metric                     | Local        | Remote       |');
        console.log('------------------------------------------------------------');
        console.log(`| Students with History      | ${String(localStudentsWithHistory).padEnd(12)} | ${String(remoteStudentsWithHistory).padEnd(12)} |`);
        console.log(`| Total History Entries      | ${String(localTotalEntries).padEnd(12)} | ${String(remoteTotalEntries).padEnd(12)} |`);
        console.log('------------------------------------------------------------');

        if (localTotalEntries === remoteTotalEntries) {
            console.log('✅ Graduation histories appear to be fully synced.');
        } else if (localTotalEntries > remoteTotalEntries) {
            console.log(`⚠️  Local has ${localTotalEntries - remoteTotalEntries} more history entries.`);
        } else {
            console.log(`🔹 Remote has ${remoteTotalEntries - localTotalEntries} more history entries.`);
        }

        await closeDB();
        process.exit(0);
    } catch (error) {
        console.error('Fatal Error:', error);
        process.exit(1);
    }
}

run();
