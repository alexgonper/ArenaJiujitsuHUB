const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-hub')
    .then(async () => {
        const Franchise = require('../models/Franchise');
        const franchises = await Franchise.find({}).select('name branding');

        console.log('📊 Franchises with Support Info:\n');
        franchises.forEach(f => {
            const hasSupport = f.branding?.supportEmail || f.branding?.supportPhone;
            console.log(`${f.name}:`);
            console.log(`  Email: ${f.branding?.supportEmail || '(não configurado)'}`);
            console.log(`  Phone: ${f.branding?.supportPhone || '(não configurado)'}`);
            console.log(`  Status: ${hasSupport ? '✅ Configurado' : '⚠️  Não configurado'}`);
            console.log('');
        });

        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
