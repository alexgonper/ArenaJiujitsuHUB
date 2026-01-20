
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Student from './server/src/models/Student';
import GraduationRule from './server/src/models/GraduationRule';
import Attendance from './server/src/models/Attendance';
import { connectDB } from './server/src/config/database';

dotenv.config();

async function check() {
    await connectDB();
    
    console.log('--- RULES ---');
    const rules = await GraduationRule.find().limit(5);
    console.log(JSON.stringify(rules, null, 2));

    console.log('--- ELIGIBILITY CHECK FOR FIRST 5 STUDENTS ---');
    const students = await Student.find().limit(5);
    
    for (const student of students) {
        const rule = await GraduationRule.findOne({
            fromBelt: student.belt,
            fromDegree: student.degree
        });
        
        const lastGradDate = student.lastGraduationDate || student.registrationDate || new Date(0);
        const daysSince = Math.floor((new Date().getTime() - lastGradDate.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log(`Student: ${student.name} | Belt: ${student.belt} | Degree: ${student.degree}`);
        console.log(`Rule found: ${!!rule} | Days since last grad: ${daysSince}`);
        
        if (rule) {
            console.log(`Classes required: ${rule.classesRequired} | Days required: ${rule.minDaysRequired}`);
            
            const attendanceStats = await Attendance.aggregate([
                {
                    $match: {
                        studentId: student._id,
                        month: { $gte: lastGradDate.toISOString().substring(0, 7) }
                    }
                },
                { $unwind: '$records' },
                {
                    $match: {
                        'records.date': { $gte: lastGradDate },
                        'records.status': 'Present'
                    }
                },
                {
                    $count: 'totalClasses'
                }
            ]);
            
            const attendanceCount = attendanceStats.length > 0 ? attendanceStats[0].totalClasses : 0;
            console.log(`Attendance count: ${attendanceCount}`);
            console.log(`Eligible: ${attendanceCount >= rule.classesRequired && daysSince >= rule.minDaysRequired}`);
        }
        console.log('---');
    }
    
    process.exit(0);
}

check();
