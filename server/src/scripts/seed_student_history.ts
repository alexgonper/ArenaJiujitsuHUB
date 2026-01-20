import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Student from '../models/Student';
import Teacher from '../models/Teacher';
import { connectDB } from '../config/database';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function seedStudentHistory() {
    try {
        await connectDB();
        
        const students = await Student.find();
        if (students.length === 0) {
            console.error('No students found in database');
            process.exit(1);
        }

        const teacher = await Teacher.findOne();
        if (!teacher) {
            console.error('No teachers found to act as promoter');
            process.exit(1);
        }

        console.log(`Found ${students.length} students. Seeding history using Prof. ${teacher.name} as reference...`);

        const beltOrder = ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Roxa', 'Marrom', 'Preta'];

        for (const student of students) {
            const history = [];
            
            // Add initial belt
            history.push({
                belt: 'Branca',
                degree: 'Nenhum',
                date: new Date(student.registrationDate.getTime() - (1000 * 60 * 60 * 24 * 365)), // 1 year before registration
                promotedBy: teacher._id
            });

            // If the student is not a white belt, add intermediate belt
            if (student.belt !== 'Branca') {
                const currentIndex = beltOrder.indexOf(student.belt);
                if (currentIndex > 0) {
                    // Add some intermediate belts
                    for (let i = 1; i <= currentIndex; i++) {
                        history.push({
                            belt: beltOrder[i],
                            degree: 'Nenhum',
                            date: new Date(student.registrationDate.getTime() - (1000 * 60 * 60 * 24 * 180 * (currentIndex - i + 1))),
                            promotedBy: teacher._id
                        });
                    }
                }
            }

            // Ensure the current belt/degree is in history if it's the latest
            const hasCurrent = history.some(h => h.belt === student.belt && h.degree === student.degree);
            if (!hasCurrent) {
                history.push({
                    belt: student.belt,
                    degree: student.degree,
                    date: student.lastGraduationDate || new Date(),
                    promotedBy: teacher._id
                });
            }

            student.graduationHistory = history;
            await student.save();
            console.log(`✅ History seeded for Student: ${student.name} (${history.length} graduations)`);
        }

        console.log('🏁 All students seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding student history:', error);
        process.exit(1);
    }
}

seedStudentHistory();
