import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IClassBooking extends Document {
    franchiseId: Types.ObjectId;
    classId: Types.ObjectId;
    studentId: Types.ObjectId;
    date: Date;
    status: 'reserved' | 'cancelled' | 'confirmed';
}

const classBookingSchema = new Schema<IClassBooking>({
    franchiseId: {
        type: Schema.Types.ObjectId,
        ref: 'Franchise',
        required: true
    },
    classId: {
        type: Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    studentId: {
        type: Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['reserved', 'cancelled', 'confirmed'],
        default: 'reserved'
    }
}, {
    timestamps: true
});

classBookingSchema.index({ studentId: 1, classId: 1, date: 1 }, { unique: true });
classBookingSchema.index({ classId: 1, date: 1, status: 1 });

const ClassBooking = mongoose.model<IClassBooking>('ClassBooking', classBookingSchema);

export default ClassBooking;
