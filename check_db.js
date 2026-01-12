const mongoose = require('mongoose');
const Metric = require('./server/models/Metric');
const Student = require('./server/models/Student');
const Franchise = require('./server/models/Franchise');
require('dotenv').config({ path: './server/.env' });

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const mCount = await Metric.countDocuments();
        const sCount = await Student.countDocuments();
        const fCount = await Franchise.countDocuments();
        console.log(`Metrics: ${mCount}`);
        console.log(`Students: ${sCount}`);
        console.log(`Franchises: ${fCount}`);

        if (mCount > 0) {
            const sample = await Metric.findOne().populate('franchiseId');
            console.log('Sample Metric Franchise:', sample.franchiseId?.name);
            console.log('Sample Metric Period:', sample.period);
        }
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkData();
