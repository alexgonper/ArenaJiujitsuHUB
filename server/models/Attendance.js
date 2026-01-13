const mongoose = require('mongoose');

/**
 * Attendance Schema
 * Tracks a student's presence in a specific class instance.
 */
const attendanceSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Franchise',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late', 'Excused'],
        default: 'Present'
    },
    checkedInBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Who performed the check-in (Professor/Admin)
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate check-ins for same student/class/date might be tricky due to time, 
// so we'll index tenant + date for reporting speed.
attendanceSchema.index({ tenantId: 1, date: -1 });
attendanceSchema.index({ studentId: 1, date: -1 }); // Fast history lookup

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
