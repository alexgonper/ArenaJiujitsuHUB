
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Student from '../models/Student';
import { connectDB } from '../config/database';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function check() {
    await connectDB();
    
    const logId = '696ea84a6aa1df5c5e089b9d';
    const count = await Student.countDocuments({ franchiseId: new mongoose.Types.ObjectId(logId) });
    console.log(`Count for log ID ${logId}: ${count}`);
    
    // Check if any students exist at all
    const total = await Student.countDocuments();
    console.log(`Total students in DB: ${total}`);
    
    process.exit(0);
}

check();
