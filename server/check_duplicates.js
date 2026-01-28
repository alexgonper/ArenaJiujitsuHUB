
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Env is in current dir (.env)
dotenv.config(); 

const ClassSchema = new mongoose.Schema({
    name: String,
    dayOfWeek: Number,
    startTime: String,
    teacherId: mongoose.Schema.Types.ObjectId,
    franchiseId: mongoose.Schema.Types.ObjectId,
    active: Boolean
}, { strict: false });

const Class = mongoose.model('Class', ClassSchema);

async function checkDuplicates() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI not found in .env');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const classes = await Class.find({ name: /Despertar/i }).lean();
        
        console.log(`Found ${classes.length} classes for "Despertar"`);
        
        // Group by Day + StartTime
        const grouped = {};
        classes.forEach(c => {
            const key = `${c.dayOfWeek}-${c.startTime}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(c);
        });

        Object.keys(grouped).forEach(key => {
            if (grouped[key].length > 1) {
                console.log(`\n⚠️ DUPLICATE FOUND for Day/Time: ${key}`);
                grouped[key].forEach(c => {
                    console.log(`   ID: ${c._id} | Name: ${c.name} | Active: ${c.active}`);
                });
            }
        });
        
        console.log('\nDone.');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkDuplicates();
