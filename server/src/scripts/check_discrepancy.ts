
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkBookingsDiscrepancy() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        
        const email = 'aluno.are.51@arena.com';
        const Student = mongoose.model('Student', new mongoose.Schema({ email: String, name: String }));
        const student = (await Student.findOne({ email })) as any;
        
        if (!student) {
            console.log('Student not found');
            return;
        }
        
        console.log(`Checking bookings for: ${student.name} (${student._id})`);
        
        const targetDate = new Date(Date.UTC(2026, 0, 23, 0, 0, 0, 0));
        
        const ClassBooking = mongoose.model('ClassBooking', new mongoose.Schema({
            studentId: mongoose.Schema.Types.ObjectId,
            classId: mongoose.Schema.Types.ObjectId,
            date: Date,
            status: String
        }));
        
        const bookings = await ClassBooking.find({
            studentId: student._id,
            date: targetDate,
            status: { $ne: 'cancelled' }
        });
        
        console.log(`Total active bookings on Friday 2026-01-23 (UTC 00:00): ${bookings.length}`);
        bookings.forEach((b: any, i) => {
            console.log(`${i+1}. ClassId: ${b.classId} | Status: ${b.status} | Date: ${b.date ? b.date.toISOString() : 'NULL'}`);
        });

        const start = new Date(targetDate);
        start.setUTCHours(-5);
        const end = new Date(targetDate);
        end.setUTCHours(10);
        
        const surrounding = await ClassBooking.find({
            studentId: student._id,
            date: { $gte: start, $lte: end },
            status: { $ne: 'cancelled' }
        });
        
        if (surrounding.length !== bookings.length) {
            console.log(`Found ${surrounding.length} bookings in surrounding hours! Discrepancy detected.`);
            surrounding.forEach((b: any, i) => {
                if (!bookings.some((eb: any) => eb._id.equals(b._id))) {
                    console.log(`   * OUTSIDE UTC MIDNIGHT: ClassId: ${b.classId} | Date: ${b.date ? b.date.toISOString() : 'NULL'}`);
                }
            });
        }
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkBookingsDiscrepancy();
