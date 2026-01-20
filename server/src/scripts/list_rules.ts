
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import GraduationRule from '../models/GraduationRule';
import { connectDB } from '../config/database';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function check() {
    await connectDB();
    
    const rules = await GraduationRule.find();
    console.log('--- ALL RULES (${rules.length}) ---');
    rules.forEach(r => {
        console.log(`${r.fromBelt} ${r.fromDegree} -> ${r.toBelt} ${r.toDegree} (Req: ${r.classesRequired} classes, ${r.minDaysRequired} days)`);
    });
    
    process.exit(0);
}

check();
