import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IClassSession extends Document {
    classId: Types.ObjectId; // Reference to the Class Definition
    franchiseId: Types.ObjectId;
    date: Date; // The specific date of this session
    
    // Snapshot of definition at this time
    startTime: string;
    endTime: string;
    teacherId: Types.ObjectId;
    
    // Capacity management
    capacity: number;
    bookedCount: number;
    checkedInCount: number; // For attendance tracking
    
    status: 'scheduled' | 'cancelled' | 'completed';
}

const classSessionSchema = new Schema<IClassSession>({
    classId: {
        type: Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    franchiseId: {
        type: Schema.Types.ObjectId,
        ref: 'Franchise',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    startTime: String,
    endTime: String,
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher' },
    
    capacity: { type: Number, required: true },
    bookedCount: { type: Number, default: 0 },
    checkedInCount: { type: Number, default: 0 },
    
    status: {
        type: String,
        enum: ['scheduled', 'cancelled', 'completed'],
        default: 'scheduled'
    }
}, {
    timestamps: true
});

// Unique session per class per datetime
classSessionSchema.index({ classId: 1, date: 1 }, { unique: true });
classSessionSchema.index({ franchiseId: 1, date: 1 });

const ClassSession = mongoose.model<IClassSession>('ClassSession', classSessionSchema);

export default ClassSession;
