const mongoose = require('mongoose');

const dashboardLayoutSchema = new mongoose.Schema({
    userId: {
        type: String, // Can be franchiseId or 'matrix'
        required: true,
        index: true
    },
    appType: {
        type: String, // 'matrix', 'franchisee', etc
        default: 'matrix'
    },
    layout: {
        type: Array, // Stores the array of widget positions
        required: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('DashboardLayout', dashboardLayoutSchema);
