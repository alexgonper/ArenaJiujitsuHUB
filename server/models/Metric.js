const mongoose = require('mongoose');

const MetricSchema = new mongoose.Schema({
    franchiseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Franchise',
        required: true
    },
    period: {
        type: String, // format "YYYY-MM"
        required: true
    },
    students: {
        total: { type: Number, default: 0 },
        new: { type: Number, default: 0 },
        churn: { type: Number, default: 0 }
    },
    finance: {
        revenue: { type: Number, default: 0 },
        expenses: { type: Number, default: 0 },
        profit: { type: Number, default: 0 }
    },
    teachers: {
        count: { type: Number, default: 0 }
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Create unique index for franchise and period
MetricSchema.index({ franchiseId: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('Metric', MetricSchema);
