
require('dotenv').config();
const mongoose = require('mongoose');
const Franchise = require('../models/Franchise');
const Teacher = require('../models/Teacher');
const { connectDB, closeDB } = require('../config/database');

async function check() {
    await connectDB();
    const fCount = await Franchise.countDocuments();
    const tCount = await Teacher.countDocuments();
    console.log(`Franchises: ${fCount}, Teachers: ${tCount}`);

    // Check for high belts
    const coral = await Teacher.countDocuments({ belt: 'Coral' });
    const red = await Teacher.countDocuments({ belt: 'Vermelha' });
    console.log(`Coral: ${coral}, Red: ${red}`);

    await closeDB();
    process.exit(0);
}
check();
