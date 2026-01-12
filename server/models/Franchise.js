const mongoose = require('mongoose');

/**
 * Franchise Schema
 * Represents an Arena Jiu-Jitsu academy unit
 */
const franchiseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Franchise name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    owner: {
        type: String,
        required: [true, 'Owner name is required'],
        trim: true
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true
    },
    phone: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                // Only validate if phone is provided
                if (!v || v === '') return true;
                return /^[\d\s\+\-\(\)]+$/.test(v);
            },
            message: 'Please provide a valid phone number'
        }
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        validate: {
            validator: function (v) {
                // Only validate if email is provided
                if (!v || v === '') return true;
                return /^\S+@\S+\.\S+$/.test(v);
            },
            message: 'Please provide a valid email'
        }
    },
    students: {
        type: Number,
        default: 0,
        min: [0, 'Students count cannot be negative']
    },
    revenue: {
        type: Number,
        default: 0,
        min: [0, 'Revenue cannot be negative']
    },
    expenses: {
        type: Number,
        default: 0,
        min: [0, 'Expenses cannot be negative']
    },
    royaltyPercent: {
        type: Number,
        default: 5,
        min: [0, 'Royalty percent cannot be negative'],
        max: [100, 'Royalty percent cannot exceed 100']
    },
    location: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number] // [longitude, latitude]
        }
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'active'
    },
    metrics: {
        retention: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        satisfaction: {
            type: Number,
            min: 0,
            max: 10,
            default: 0
        },
        growth: {
            type: Number,
            default: 0
        }
    },
    metadata: {
        founded: Date,
        lastUpdated: Date,
        notes: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Create geospatial index for location queries
franchiseSchema.index({ location: '2dsphere' });

// Virtual for profit calculation
franchiseSchema.virtual('profit').get(function () {
    return this.revenue - this.expenses;
});

// Virtual for profit margin percentage
franchiseSchema.virtual('profitMargin').get(function () {
    if (this.revenue === 0) return 0;
    return ((this.revenue - this.expenses) / this.revenue * 100).toFixed(2);
});

// Method to get franchise summary
franchiseSchema.methods.getSummary = function () {
    return {
        id: this._id,
        name: this.name,
        owner: this.owner,
        students: this.students,
        revenue: this.revenue,
        profit: this.profit,
        status: this.status
    };
};

// Static method to get top franchises by students
franchiseSchema.statics.getTopByStudents = function (limit = 5) {
    return this.find({ status: 'active' })
        .sort({ students: -1 })
        .limit(limit)
        .select('name owner students location');
};

// Static method to get network statistics
franchiseSchema.statics.getNetworkStats = async function () {
    const stats = await this.aggregate([
        {
            $match: { status: 'active' }
        },
        {
            $group: {
                _id: null,
                totalStudents: { $sum: '$students' },
                totalRevenue: { $sum: '$revenue' },
                totalExpenses: { $sum: '$expenses' },
                averageStudents: { $avg: '$students' },
                unitCount: { $sum: 1 }
            }
        }
    ]);

    return stats[0] || {
        totalStudents: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        averageStudents: 0,
        unitCount: 0
    };
};

// Pre-save middleware to update lastUpdated
franchiseSchema.pre('save', function (next) {
    this.metadata = this.metadata || {};
    this.metadata.lastUpdated = new Date();
    next();
});

const Franchise = mongoose.model('Franchise', franchiseSchema);

module.exports = Franchise;
