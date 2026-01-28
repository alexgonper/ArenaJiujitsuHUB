
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function findStudent() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        
        const Student = mongoose.model('Student', new mongoose.Schema({
            name: String,
            franchiseId: mongoose.Schema.Types.ObjectId
        }));
        
        const student = await Student.findOne({ name: /Eduardo/i });
        if (student) {
            console.log(`Student: ${student.name}`);
            console.log(`Franchise ID: ${student.franchiseId}`);
            
            const Franchise = mongoose.model('Franchise', new mongoose.Schema({
                name: String,
                branding: Object
            }));
            
            const franchise = await Franchise.findById(student.franchiseId);
            if (franchise) {
                console.log(`Franchise Name: ${franchise.name}`);
                console.log(`Franchise Branding: ${JSON.stringify(franchise.branding, null, 2)}`);
            }
        } else {
            console.log('Student Eduardo not found');
        }
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

findStudent();
