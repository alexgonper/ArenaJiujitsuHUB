
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

const ClassSchema = new mongoose.Schema({
    name: String,
    dayOfWeek: Number,
    startTime: String,
    teacherId: mongoose.Schema.Types.ObjectId,
    franchiseId: mongoose.Schema.Types.ObjectId
}, { strict: false });

const Class = mongoose.model('Class', ClassSchema);

async function checkDuplicates() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
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

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkDuplicates();
