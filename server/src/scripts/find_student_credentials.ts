import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Student from '../models/Student';
import Franchise from '../models/Franchise';
import { connectDB } from '../config/database';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function findCredentials() {
    try {
        await connectDB();
        
        console.log('\n🔍 Searching for valid credentials...\n');

        // Find Arena São Paulo
        const gym = await Franchise.findOne({ name: 'Arena São Paulo' });
        
        if (!gym) {
            console.log('❌ Arena São Paulo not found. Listing all gyms:');
            const gyms = await Franchise.find({}, 'name');
            console.log(gyms.map(g => g.name).join(', '));
            process.exit(0);
        }

        console.log(`✅ Found Gym: ${gym.name} (ID: ${gym._id})`);

        // Find students for this gym
        const students = await Student.find({ franchiseId: gym._id }).limit(3);
        
        if (students.length === 0) {
            console.log('❌ No students found for this gym.');
        } else {
            console.log('\n👤 Valid Student Credentials:');
            students.forEach((s, i) => {
                console.log(`   ${i+1}. Name: ${s.name} | Email: ${s.email}`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

findCredentials();
