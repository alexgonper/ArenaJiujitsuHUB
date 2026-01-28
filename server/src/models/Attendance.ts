import mongoose, { Schema, Document, Types } from 'mongoose';

// Interface for the Embedded Snapshot (Lightweight)
interface IAttendanceRecord {
    date: Date; // Full timestamp
    classId: Types.ObjectId; // Link to Class Def
    sessionId?: Types.ObjectId; // Link to ClassSession (if exists)
    
    status: 'Present' | 'Absent' | 'Late' | 'Excused';
    checkInMethod: 'App' | 'Booking' | 'Professor' | 'Kiosk';
    
    // SNAPSHOT DATA (Integrity)
    snapshot: {
        className: string;
        teacherName: string;
        startTime: string;
        endTime?: string; // Added for overlap check optimization
        category: string;
    };
}

export interface IAttendance extends Document {
    studentId: Types.ObjectId;
    tenantId: Types.ObjectId; // Franchise
    month: string; // Format: "YYYY-MM" (Bucket Key)
    
    records: IAttendanceRecord[];
    
    totalPresent: number; // Cached counter for this month
}

const attendanceSchema = new Schema<IAttendance>({
    studentId: {
        type: Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'Franchise',
        required: true
    },
    month: {
        type: String, // "2024-01"
        required: true
    },
    records: [{
        date: { type: Date, required: true },
        classId: { type: Schema.Types.ObjectId, ref: 'Class' },
        sessionId: { type: Schema.Types.ObjectId, ref: 'ClassSession' },
        status: { type: String, default: 'Present' },
        checkInMethod: String,
        snapshot: {
            className: String,
            teacherName: String,
            startTime: String,
            endTime: String, // Added
            category: String
        }
    }],
    totalPresent: { type: Number, default: 0 }
}, {
    timestamps: true
});

// Compound index for unique bucket per student per month
attendanceSchema.index({ studentId: 1, month: 1 }, { unique: true });
// Index allowing search by specific class occurrence efficiency
attendanceSchema.index({ "records.classId": 1, "records.date": 1 });
// Shard Key Candidate (if sharding by Tenant)
attendanceSchema.index({ tenantId: 1, month: 1 });

const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);

export default Attendance;
