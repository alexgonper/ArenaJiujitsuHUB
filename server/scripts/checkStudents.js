require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');

const checkStudents = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');

        const total = await Student.countDocuments();
        const withDegree = await Student.countDocuments({ degree: { $ne: 'Nenhum' } });

        console.log('Total students:', total);
        console.log('Students with degree (not Nenhum):', withDegree);

        // Sample students with degrees
        const samples = await Student.find({ degree: { $ne: 'Nenhum' } }).limit(5);
        console.log('\nSample students with degrees:');
        samples.forEach(s => console.log(`  - ${s.name}: ${s.belt} • ${s.degree}`));

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkStudents();
