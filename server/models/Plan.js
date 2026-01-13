const mongoose = require('mongoose');

/**
 * Plan Schema
 * Defines the SaaS subscription tiers (Free, Standard, Master)
 */
const planSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        enum: ['Free', 'Standard', 'Master']
    },
    pricePerStudent: {
        type: Number,
        required: true,
        default: 0
    },
    currency: {
        type: String,
        default: 'BRL'
    },
    features: {
        maxStudents: { type: Number, default: 999999 },
        maxClasses: { type: Number, default: 999999 },
        allowWhiteLabel: { type: Boolean, default: false },
        allowMercadoPago: { type: Boolean, default: false },
        allowGraduationSystem: { type: Boolean, default: false }
    },
    billingCycle: {
        type: String,
        enum: ['Monthly', 'Yearly'],
        default: 'Monthly'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan;
