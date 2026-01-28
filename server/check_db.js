const mongoose = require('mongoose');

async function check() {
    await mongoose.connect('mongodb://localhost:27017/arenahub');
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    const attendance = db.collection('attendances');
    const total = await attendance.countDocuments();
    console.log('Total Attendances:', total);

    if (total > 0) {
        const sample = await attendance.findOne();
        console.log('Sample Attendance:', JSON.stringify(sample, null, 2));
        
        const withTenant = await attendance.countDocuments({ tenantId: { $exists: true } });
        console.log('With tenantId:', withTenant);

        const withoutTenant = await attendance.countDocuments({ tenantId: { $exists: false } });
        console.log('Without tenantId:', withoutTenant);
    }
    
    process.exit(0);
}

check();
