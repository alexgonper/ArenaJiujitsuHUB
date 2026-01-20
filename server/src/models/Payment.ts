import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPayment extends Document {
    franchiseId: Types.ObjectId;
    studentId: Types.ObjectId;
    type: 'Tuition' | 'Exam' | 'Product';
    description?: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected' | 'refunded' | 'cancelled';
    externalReference?: string;
    transactionId?: string;
    paymentMethod?: 'credit_card' | 'pix' | 'boleto' | 'account_money' | 'cash';
    split: {
        matrixAmount: number;
        franchiseAmount: number;
        matrixRate: number;
    };
    paidAt?: Date;
    metadata?: Map<string, string>;
}

const paymentSchema = new Schema<IPayment>({
    franchiseId: {
        type: Schema.Types.ObjectId,
        ref: 'Franchise',
        required: [true, 'Franchise ID is required']
    },
    studentId: {
        type: Schema.Types.ObjectId,
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
    externalReference: {
        type: String,
        unique: true,
        sparse: true
    },
    transactionId: {
        type: String,
        sparse: true
    },
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'pix', 'boleto', 'account_money', 'cash'],
        default: 'credit_card'
    },
    split: {
        matrixAmount: { type: Number, default: 0 },
        franchiseAmount: { type: Number, default: 0 },
        matrixRate: { type: Number, default: 0 }
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

paymentSchema.index({ franchiseId: 1, status: 1 });
paymentSchema.index({ studentId: 1, createdAt: -1 });

const Payment = mongoose.model<IPayment>('Payment', paymentSchema);

export default Payment;
