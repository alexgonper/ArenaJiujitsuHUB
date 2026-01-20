
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import ClassBooking from '../models/ClassBooking';
import Class from '../models/Class';
import Franchise from '../models/Franchise';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log(`MongoDB Connected`);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

const debugSP = async () => {
    await connectDB();
    console.log('--- DEBUG ARENA SAO PAULO ---');

    // 1. Find Arena Sao Paulo
    const franchise = await Franchise.findOne({ name: { $regex: 'S?o Paulo', $options: 'i' } });
    if (!franchise) {
        console.log('Arena Sao Paulo not found!');
        const all = await Franchise.find({}, 'name');
        console.log('Available:', all.map(f => f.name));
        process.exit();
    }
    console.log(`Franchise: ${franchise.name} (${franchise._id})`);

    // 2. Find 06:00 Class Today (Tuesday)
    const cls = await Class.findOne({
        franchiseId: franchise._id,
        startTime: '06:00',
        dayOfWeek: 2
    });

    if (!cls) {
        console.log('No 06:00 class found for Sao Paulo on Tuesday!');
        process.exit();
    }
    console.log(`Class: ${cls.name} (${cls._id})`);

    // 3. Check Bookings
    const startOfDay = new Date('2026-01-20T00:00:00.000Z');
    const endOfDay = new Date('2026-01-20T23:59:59.999Z');

    const bookings = await ClassBooking.find({
        classId: cls._id,
        date: { $gte: startOfDay, $lte: endOfDay }
    });
    
    console.log(`Bookings count: ${bookings.length}`);
    
    process.exit();
};

debugSP();
