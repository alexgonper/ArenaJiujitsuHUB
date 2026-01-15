const mongoose = require('mongoose');
const Franchise = require('./models/Franchise');
require('dotenv').config();

async function updateBranding() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        
        // Update Arena São Paulo to use a professional Blue/Navy theme instead of Orange
        const result = await Franchise.findByIdAndUpdate(
            '69605f917582556c3650184b', 
            {
                'branding.primaryColor': '#FB00FF', // User specified Neon Pink/Magenta
                'branding.secondaryColor': '#AC00AF',
                'branding.brandName': 'Arena São Paulo'
            },
            { new: true }
        );
        
        console.log('✅ Branding atualizado com sucesso:', result.branding);

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await mongoose.disconnect();
    }
}

updateBranding();
