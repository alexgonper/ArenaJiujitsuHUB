import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMetric extends Document {
    franchiseId: Types.ObjectId;
    period: string; // "YYYY-MM"
    students: {
        total: number;
        new: number;
        churn: number;
    };
    finance: {
        revenue: number;
        expenses: number;
        profit: number;
    };
    teachers: {
        count: number;
    };
    updatedAt: Date;
}

const MetricSchema = new Schema<IMetric>({
    franchiseId: {
        type: Schema.Types.ObjectId,
        ref: 'Franchise',
        required: true
    },
    period: {
        type: String,
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

MetricSchema.index({ franchiseId: 1, period: 1 }, { unique: true });

const Metric = mongoose.model<IMetric>('Metric', MetricSchema);

export default Metric;
