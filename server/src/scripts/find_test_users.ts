
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Student from '../models/Student';
import Teacher from '../models/Teacher';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function findUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-hub');
        
        const teacher = await Teacher.findOne({}).select('email name belt');
        const student = await Student.findOne({}).select('email name belt');

        console.log('\n--- CREDENCIAIS DE TESTE ---');
        console.log('Professor:');
        console.log(`Email: ${teacher?.email}`);
        console.log(`Nome: ${teacher?.name}`);
        console.log('---');
        console.log('Aluno:');
        console.log(`Email: ${student?.email}`); // Student likely doesn't have email in seed?
        // Wait, seed script had `email: aluno...`
        console.log(`Nome: ${student?.name}`);
        console.log('----------------------------\n');

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

findUsers();
