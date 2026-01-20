import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Teacher from '../models/Teacher';
import { connectDB } from '../config/database';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function seedTeacherHistory() {
    try {
        await connectDB();
        
        const teachers = await Teacher.find();
        if (teachers.length === 0) {
            console.error('No teachers found in database');
            process.exit(1);
        }

        console.log(`Found ${teachers.length} teachers. Seeding history...`);

        for (const teacher of teachers) {
            teacher.graduationHistory = [
                {
                    belt: 'Branca',
                    degree: '4º Grau',
                    date: new Date('2010-06-15'),
                    promotedBy: 'Mestre Carlos Gracie Jr.'
                },
                {
                    belt: 'Azul',
                    degree: 'Nenhum',
                    date: new Date('2012-08-20'),
                    promotedBy: 'Mestre Carlos Gracie Jr.'
                },
                {
                    belt: 'Roxa',
                    degree: 'Nenhum',
                    date: new Date('2014-11-10'),
                    promotedBy: 'Prof. Rafael Rocha'
                },
                {
                    belt: 'Marrom',
                    degree: 'Nenhum',
                    date: new Date('2017-03-05'),
                    promotedBy: 'Prof. Rafael Rocha'
                },
                {
                    belt: 'Preta',
                    degree: teacher.degree || '1º Grau',
                    date: new Date('2021-05-12'),
                    promotedBy: 'Mestre Ricardo Libório'
                }
            ];

            await teacher.save();
            console.log(`✅ History seeded for Prof: ${teacher.name}`);
        }

        console.log('🏁 All teachers seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding teacher history:', error);
        process.exit(1);
    }
}

seedTeacherHistory();
