import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDailymetric extends Document {
    franchiseId: Types.ObjectId;
    date: Date; // Normalized to midnight
    
    // Financials
    totalRevenue: number;
    totalExpenses: number;
    
    // Operations
    activeStudents: number;
    newStudents: number;
    dropoutStudents: number;
    classAttendanceCount: number;
    
    metadata: Map<string, any>;
}

const dailyMetricSchema = new Schema<IDailymetric>({
    franchiseId: {
        type: Schema.Types.ObjectId,
        ref: 'Franchise',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    totalRevenue: { type: Number, default: 0 },
    totalExpenses: { type: Number, default: 0 },
    activeStudents: { type: Number, default: 0 },
    newStudents: { type: Number, default: 0 },
    dropoutStudents: { type: Number, default: 0 },
    classAttendanceCount: { type: Number, default: 0 },
    metadata: {
        type: Map,
        of: Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Compound index for fast queries by date range per franchise
dailyMetricSchema.index({ franchiseId: 1, date: 1 }, { unique: true });

const DailyMetric = mongoose.model<IDailymetric>('DailyMetric', dailyMetricSchema);

export default DailyMetric;
