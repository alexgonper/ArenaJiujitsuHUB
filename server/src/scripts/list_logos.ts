
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function listFranchises() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        
        const Franchise = mongoose.model('Franchise', new mongoose.Schema({
            name: String,
            branding: Object
        }));
        
        const franchises = await Franchise.find({});
        console.log('--- FRANCHISES LOGOS ---');
        franchises.forEach(f => {
            console.log(`${f.name}: ${f.branding?.logoUrl || 'NO LOGO'}`);
        });
        console.log('------------------------');
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

listFranchises();
