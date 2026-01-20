import mongoose from 'mongoose';
import Franchise from './models/Franchise';
import { connectDB } from './config/database';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function run() {
    await connectDB();
    const franchises = await Franchise.find({});
    console.log('Franchises found:', franchises.map(f => ({ id: f._id, name: f.name })));
    process.exit(0);
}
run();
