const mongoose = require('mongoose');
require('dotenv').config();
const Student = require('../models/Student');

const checkStudent = async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-hub');

    // Find a student with a high belt to check complex history
    const student = await Student.findOne({ belt: { $in: ['Roxa', 'Marrom', 'Preta'] } });

    if (student) {
        console.log(`Name: ${student.name}`);
        console.log(`Current Belt: ${student.belt} ${student.degree}`);
        console.log('History:');
        student.graduationHistory.forEach(h => {
            console.log(` - ${h.date.toISOString().split('T')[0]}: ${h.belt} (${h.degree})`);
        });
    } else {
        console.log('No high belt student found');
    }
    process.exit();
};

checkStudent();
