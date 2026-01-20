
import mongoose from 'mongoose';
import Student from '../models/Student';
import Payment from '../models/Payment';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const checkData = async () => {
    const targetId = '696ea84d6aa1df5c5e08e6d4';
    
    try {
        // Ensure disconnected
        await mongoose.disconnect();

        // Check ARENAHUB
        console.log('--- Checking arenahub ---');
        await mongoose.connect('mongodb://localhost:27017/arenahub');
        console.log('Connected to arenahub');
        const studentHub = await Student.findById(targetId);
        if (studentHub) {
            console.log(`Found student in arenahub: ${studentHub.name}`);
             const payments = await Payment.find({ studentId: studentHub._id });
             console.log(`Payments found in arenahub: ${payments.length}`);
        } else {
            console.log(`Student NOT found in arenahub`);
        }
        await mongoose.disconnect();

        // Check ARENA-MATRIX
        console.log('--- Checking arena-matrix ---');
        await mongoose.connect('mongodb://localhost:27017/arena-matrix');
        console.log('Connected to arena-matrix');
        const studentMatrix = await Student.findById(targetId);
        if (studentMatrix) {
            console.log(`Found student in arena-matrix: ${studentMatrix.name}`);
            const payments = await Payment.find({ studentId: studentMatrix._id });
             console.log(`Payments found in arena-matrix: ${payments.length}`);
        } else {
             console.log(`Student NOT found in arena-matrix`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkData();
