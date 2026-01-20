
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Student from '../models/Student';
import Franchise from '../models/Franchise';
import GraduationRule from '../models/GraduationRule';
import Attendance from '../models/Attendance';
import { connectDB } from '../config/database';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function check() {
    await connectDB();
    
    const franchise = await Franchise.findOne({ name: /Arena São Paulo/i });
    if (!franchise) {
        console.log('Franchise Arena São Paulo not found');
        process.exit(1);
    }
    
    console.log(`Checking students in ${franchise.name} (${franchise._id})`);
    
    const students = await Student.find({ franchiseId: franchise._id });
    console.log(`Total students in this franchise: ${students.length}`);
    
    let eligibleCount = 0;
    
    for (const student of students) {
        const rule = await GraduationRule.findOne({
            fromBelt: student.belt,
            fromDegree: student.degree
        });
        
        if (!rule) continue;
        
        const lastGradDate = student.lastGraduationDate || student.registrationDate || new Date(0);
        const daysSince = Math.floor((new Date().getTime() - lastGradDate.getTime()) / (1000 * 60 * 60 * 24));
        
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
        
        const isEligible = attendanceCount >= rule.classesRequired && daysSince >= rule.minDaysRequired;
        
        if (isEligible) {
            eligibleCount++;
            console.log(`ELIGIBLE: ${student.name} | Belt: ${student.belt} | Degree: ${student.degree} | Attended: ${attendanceCount}/${rule.classesRequired} | Days: ${daysSince}/${rule.minDaysRequired}`);
        }
    }
    
    console.log(`\nTotal eligible students found by script: ${eligibleCount}`);
    
    process.exit(0);
}

check();
