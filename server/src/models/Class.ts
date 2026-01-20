import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IClass extends Document {
    franchiseId: Types.ObjectId;
    teacherId: Types.ObjectId;
    name: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    capacity: number;

    category: 'BJJ' | 'No-Gi' | 'Wrestling' | 'Kids' | 'Fundamentals';
    level: 'beginner' | 'intermediate' | 'advanced';
    targetAudience: 'kids' | 'adults' | 'women' | 'seniors';
    minBelt: string;
    active: boolean;
}

const classSchema = new Schema<IClass>({
    franchiseId: {
        type: Schema.Types.ObjectId,
        ref: 'Franchise',
        required: true
    },
    teacherId: {
        type: Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    dayOfWeek: {
        type: Number,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    capacity: {
        type: Number,
        default: 30
    },
    category: {
        type: String,
        enum: ['BJJ', 'No-Gi', 'Wrestling', 'Kids', 'Fundamentals'],
        default: 'BJJ'
    },
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    targetAudience: {
        type: String,
        enum: ['kids', 'adults', 'women', 'seniors'],
        default: 'adults'
    },
    minBelt: {
        type: String,
        default: 'Branca'
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

classSchema.index({ franchiseId: 1, dayOfWeek: 1, active: 1 });

const Class = mongoose.model<IClass>('Class', classSchema);

export default Class;
