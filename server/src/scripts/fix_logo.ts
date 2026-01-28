
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function fixLogoUrl() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log('Connected to DB');
        
        const Franchise = mongoose.model('Franchise', new mongoose.Schema({
            branding: Object
        }));
        
        const result = await Franchise.updateMany(
            { 'branding.logoUrl': 'https://vio.placeholder.com/150' },
            { $set: { 'branding.logoUrl': 'https://via.placeholder.com/150' } }
        );
        
        console.log(`Updated ${result.modifiedCount} franchises`);
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

fixLogoUrl();
