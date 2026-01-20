
import mongoose from 'mongoose';
import Student from '../models/Student';
import GraduationRule from '../models/GraduationRule';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function checkStudentAndRules() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-hub');
        console.log('Connected.');

        // Find a Roxa student
        const student = await Student.findOne({ belt: 'Roxa', degree: 'Nenhum' });
        if (!student) {
            console.log('No student found with Roxa / Nenhum');
            // Try just Roxa
            const s2 = await Student.findOne({ belt: 'Roxa' });
            if (s2) console.log('Found Roxa student:', s2.name, 'Degree:', `"${s2.degree}"`); 
        } else {
            console.log('Found Roxa/Nenhum student:', student.name);
            console.log('Belt:', `"${student.belt}"`);
            console.log('Degree:', `"${student.degree}"`);

            // Try finding rule for this exact student data
            const rule = await GraduationRule.findOne({
                fromBelt: student.belt,
                fromDegree: student.degree
            });
            console.log('Rule found for student?:', rule ? 'YES' : 'NO');
            if(rule) console.log('Rule To:', rule.toBelt, rule.toDegree);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

checkStudentAndRules();
