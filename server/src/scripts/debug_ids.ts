
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Student from '../models/Student';
import Franchise from '../models/Franchise';
import { connectDB } from '../config/database';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function check() {
    await connectDB();
    
    console.log('--- ALL FRANCHISE IDS IN DB ---');
    const fIds = await Franchise.find().distinct('_id');
    fIds.forEach(id => console.log(id.toString()));
    
    console.log('\n--- SAMPLE STUDENT FRANCHISE IDS ---');
    const students = await Student.find().limit(20);
    students.forEach(s => console.log(`${s.name}: ${s.franchiseId}`));
    
    process.exit(0);
}

check();
