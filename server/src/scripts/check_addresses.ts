
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Franchise from '../models/Franchise';
import Student from '../models/Student';
import Teacher from '../models/Teacher';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-hub');
        console.log('Connected to DB');

        const franchiseCount = await Franchise.countDocuments({ address: { $exists: true, $ne: '' } });
        const totalFranchises = await Franchise.countDocuments({});
        console.log(`Franchises with address: ${franchiseCount} / ${totalFranchises}`);
        
        const fSample = await Franchise.findOne({});
        console.log('Sample Franchise Address:', fSample?.address, 'Coords:', fSample?.location?.coordinates);

        const studentCount = await Student.countDocuments({ address: { $exists: true, $ne: '' } });
        const totalStudents = await Student.countDocuments({});
        console.log(`Students with address: ${studentCount} / ${totalStudents}`);
        
        const sSample = await Student.findOne({});
        console.log('Sample Student Address:', sSample?.address);

        const teacherCount = await Teacher.countDocuments({ address: { $exists: true, $ne: '' } });
        const totalTeachers = await Teacher.countDocuments({});
        console.log(`Teachers with address: ${teacherCount} / ${totalTeachers}`);
        
        const tSample = await Teacher.findOne({});
        console.log('Sample Teacher Address:', tSample?.address);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

check();
