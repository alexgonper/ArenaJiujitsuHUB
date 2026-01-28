import mongoose from 'mongoose';
import Payment from '../models/Payment';
import Student from '../models/Student';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/arena-db');
        console.log('Connected to DB');

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        console.log('Checking payments since:', startOfMonth);

        const count = await Payment.countDocuments({
            status: 'approved',
            paidAt: { $gte: startOfMonth }
        });

        console.log('Approved payments this month:', count);

        const allPayments = await Payment.find({
            paidAt: { $gte: startOfMonth }
        }).limit(5);
        
        console.log('Sample payments this month:', allPayments);

        const students = await Student.countDocuments({ paymentStatus: { $ne: 'Atrasada' } });
        console.log('Active students:', students);

        const totalPayments = await Payment.countDocuments({});
        console.log('Total payments in DB:', totalPayments);
        
        // Check latest payment date
        const latestPayment = await Payment.findOne().sort({ paidAt: -1 });
        console.log('Latest payment date:', latestPayment?.paidAt);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
