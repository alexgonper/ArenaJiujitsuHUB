
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Teacher = require('../models/Teacher');
const { connectDB, closeDB } = require('../config/database');

const REMOTE_API_URL = 'https://arenajiujitsuhub-2.onrender.com/api/v1';

async function run() {
    try {
        await connectDB();

        const localTeachers = await Teacher.find({}, 'name');
        const localNames = localTeachers.map(t => t.name);

        console.log('Fetching remote teachers...');
        const res = await fetch(`${REMOTE_API_URL}/teachers`);
        const result = await res.json();
        const remoteTeachers = result.data || [];
        const remoteNames = remoteTeachers.map(t => t.name);

        console.log(`\nLocal Teachers: ${localNames.length}`);
        console.log(`Remote Teachers: ${remoteNames.length}`);

        const onlyRemote = remoteNames.filter(n => !localNames.includes(n));
        const onlyLocal = localNames.filter(n => !remoteNames.includes(n));

        console.log(`\nTeachers ONLY on Remote (showing first 10):`, onlyRemote.slice(0, 10));
        console.log(`\nTeachers ONLY on Local:`, onlyLocal);

        await closeDB();
    } catch (err) {
        console.error(err);
    }
}
run();
