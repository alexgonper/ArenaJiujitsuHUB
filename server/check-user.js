const mongoose = require('mongoose');
const Student = require('./models/Student');
require('dotenv').config();

async function checkUser(email) {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        const user = await Student.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
        
        if (user) {
            console.log('✅ Usuário Encontrado:', user.name, user._id, user.franchiseId);
        } else {
            console.log('❌ Usuário NÃO Encontrado:', email);
        }
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkUser('bruno.alves5444@bol.com.br');
