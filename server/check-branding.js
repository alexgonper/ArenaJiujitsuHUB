const mongoose = require('mongoose');
const Franchise = require('./models/Franchise');
require('dotenv').config();

async function checkFranchiseBranding() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        
        const franchise = await Franchise.findById('69605f917582556c3650184b');
        
        if (franchise) {
            console.log('🏢 Franquia:', franchise.name);
            console.log('🎨 Branding:', franchise.branding);
        } else {
            console.log('❌ Franquia não encontrada');
        }
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await mongoose.disconnect();
    }
}
checkFranchiseBranding();
