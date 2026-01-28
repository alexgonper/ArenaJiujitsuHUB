
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkStudent() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        
        const Student = mongoose.model('Student', new mongoose.Schema({
            name: String,
            email: String,
            franchiseId: mongoose.Schema.Types.ObjectId
        }));
        
        const Franchise = mongoose.model('Franchise', new mongoose.Schema({
            name: String
        }));
        
        const email = 'aluno.are.51@arena.com';
        const students = await Student.find({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
        
        console.log(`--- CADASTROS PARA ${email} ---`);
        for (const s of students) {
            const f = await Franchise.findById(s.franchiseId);
            console.log(`Aluno: ${s.name} | Unidade: ${f ? f.name : 'Desconhecida'} (${s.franchiseId})`);
        }
        console.log('---------------------------------');
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkStudent();
