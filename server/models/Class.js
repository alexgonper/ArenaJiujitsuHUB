const mongoose = require('mongoose');

/**
 * Class Schema
 * Represents a scheduled training session (e.g., Monday 19:00 - BJJ Basics)
 */
const classSchema = new mongoose.Schema({
    franchiseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Franchise',
        required: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    name: {
        type: String, // e.g., "Jiu-Jitsu Iniciante", "No-Gi", "Kids"
        required: true,
        trim: true
    },
    dayOfWeek: {
        type: Number, // 0-6 (Sunday-Saturday)
        required: true
    },
    startTime: {
        type: String, // "19:00"
        required: true
    },
    endTime: {
        type: String, // "20:30"
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
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for fast lookup by franchise and day
classSchema.index({ franchiseId: 1, dayOfWeek: 1, active: 1 });

const Class = mongoose.model('Class', classSchema);

module.exports = Class;
