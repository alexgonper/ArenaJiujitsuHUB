import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotification extends Document {
    recipientId: Types.ObjectId; // Could be Student or Teacher
    recipientType: 'Student' | 'Teacher' | 'Franchise';
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'eligibility' | 'payment' | 'announcement';
    read: boolean;
    metadata?: any;
    createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
    recipientId: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'recipientType'
    },
    recipientType: {
        type: String,
        required: true,
        enum: ['Student', 'Teacher', 'Franchise']
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['info', 'success', 'warning', 'error', 'eligibility', 'payment', 'announcement'],
        default: 'info'
    },
    read: {
        type: Boolean,
        default: false
    },
    metadata: {
        type: Schema.Types.Mixed
    }
}, {
    timestamps: true
});

notificationSchema.index({ recipientId: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
