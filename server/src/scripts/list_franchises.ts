
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Franchise from '../models/Franchise';
import { connectDB } from '../config/database';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function check() {
    await connectDB();
    
    const franchises = await Franchise.find();
    console.log('--- ALL FRANCHISES ---');
    franchises.forEach(f => {
        console.log(`${f.name} - ${f._id}`);
    });
    
    process.exit(0);
}

check();
