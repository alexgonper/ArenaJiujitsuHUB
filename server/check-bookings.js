const mongoose = require('mongoose');
const ClassBooking = require('./models/ClassBooking');
require('dotenv').config();

async function countBookings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        const count = await ClassBooking.countDocuments({});
        console.log(`📊 Total de Reservas no Banco: ${count}`);
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await mongoose.disconnect();
    }
}
countBookings();
