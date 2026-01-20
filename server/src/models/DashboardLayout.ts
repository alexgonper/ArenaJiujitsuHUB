import mongoose, { Schema, Document } from 'mongoose';

export interface IDashboardLayout extends Document {
    userId: string;
    appType: string;
    layout: any[];
    lastUpdated: Date;
}

const dashboardLayoutSchema = new Schema<IDashboardLayout>({
    userId: {
        type: String,
        required: true,
        index: true
    },
    appType: {
        type: String,
        default: 'matrix'
    },
    layout: {
        type: [Schema.Types.Mixed],
        required: true
    } as any,
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

const DashboardLayout = mongoose.model<IDashboardLayout>('DashboardLayout', dashboardLayoutSchema);

export default DashboardLayout;
