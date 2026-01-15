const mongoose = require('mongoose');

const classBookingSchema = new mongoose.Schema({
    franchiseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Franchise',
        required: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    date: {
        type: Date, // The specific date of the class (e.g., 2023-10-25T00:00:00.000Z)
        required: true
    },
    status: {
        type: String,
        enum: ['reserved', 'cancelled', 'confirmed'], // confirmed means they showed up (attendance created)
        default: 'reserved'
    }
}, {
    timestamps: true
});

// Prevent double booking for the same student in the same class on the same date
classBookingSchema.index({ studentId: 1, classId: 1, date: 1 }, { unique: true });

// Efficient lookup for capacity checking
classBookingSchema.index({ classId: 1, date: 1, status: 1 });

const ClassBooking = mongoose.model('ClassBooking', classBookingSchema);

module.exports = ClassBooking;
