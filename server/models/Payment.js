const mongoose = require('mongoose');

/**
 * Payment Schema
 * Tracks financial transactions, including status and revenue splits.
 */
const paymentSchema = new mongoose.Schema({
    franchiseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Franchise',
        required: [true, 'Franchise ID is required']
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, 'Student ID is required']
    },
    type: {
        type: String,
        enum: ['Tuition', 'Exam', 'Product'],
        required: true,
        default: 'Tuition'
    },
    description: {
        type: String,
        trim: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'refunded', 'cancelled'],
        default: 'pending',
        index: true
    },
    // Mercado Pago Fields
    externalReference: {
        type: String,
        unique: true,
        sparse: true // Allows null/undefined to not conflict uniqueness
    },
    transactionId: {
        type: String, // MP Payment ID
        sparse: true
    },
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'pix', 'boleto', 'account_money', 'cash'],
        default: 'credit_card'
    },
    // Revenue Share Logic
    split: {
        matrixAmount: { type: Number, default: 0 },
        franchiseAmount: { type: Number, default: 0 },
        matrixRate: { type: Number, default: 0 } // Percentage kept by matrix
    },
    paidAt: {
        type: Date
    },
    metadata: {
        type: Map,
        of: String
    }
}, {
    timestamps: true
});

// Index for getting franchise revenue fast
paymentSchema.index({ franchiseId: 1, status: 1 });
paymentSchema.index({ studentId: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
