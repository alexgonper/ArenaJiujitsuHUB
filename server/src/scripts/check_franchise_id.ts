
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Franchise from '../models/Franchise';
import { connectDB } from '../config/database';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function check() {
    await connectDB();
    
    const logId = '696ea84a6aa1df5c5e089b9d';
    const franchise = await Franchise.findById(logId);
    if (franchise) {
        console.log(`Franchise found for log ID ${logId}: ${franchise.name}`);
    } else {
        console.log(`No franchise found for log ID ${logId}`);
    }
    
    process.exit(0);
}

check();
