const mongoose = require('mongoose');
const Franchise = require('./models/Franchise');
require('dotenv').config();

async function countFranchises() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        const count = await Franchise.countDocuments({});
        console.log(`📊 Total de Franquias no Banco: ${count}`);
        
        const franchises = await Franchise.find({}, 'name _id');
        console.log('List:', franchises);
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await mongoose.disconnect();
    }
}
countFranchises();
