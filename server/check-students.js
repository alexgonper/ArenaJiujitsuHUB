const mongoose = require('mongoose');
const Student = require('./models/Student');
require('dotenv').config();

async function countStudents() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        const count = await Student.countDocuments({});
        console.log(`📊 Total de Alunos no Banco: ${count}`);
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await mongoose.disconnect();
    }
}
countStudents();
