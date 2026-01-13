const mongoose = require('mongoose');
const Franchise = require('../models/Franchise');
require('dotenv').config({ path: '../.env' });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
};

const listFranchises = async () => {
    await connectDB();
    const franchises = await Franchise.find({});
    console.log(`Found ${franchises.length} franchises:`);
    franchises.forEach(f => {
        console.log(`- "${f.name}" (ID: ${f._id})`);
    });
    process.exit(0);
};

listFranchises();
