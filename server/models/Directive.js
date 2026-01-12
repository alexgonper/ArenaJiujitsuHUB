const mongoose = require('mongoose');

/**
 * Directive Schema
 * Represents official communications from headquarters to franchises
 */
const directiveSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, 'Directive text is required'],
        trim: true,
        minlength: [10, 'Directive must be at least 10 characters'],
        maxlength: [2000, 'Directive cannot exceed 2000 characters']
    },
    targetUnit: {
        type: String,
        default: 'Rede Geral',
        trim: true
    },
    targetFranchiseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Franchise',
        default: null
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    category: {
        type: String,
        enum: ['announcement', 'training', 'event', 'policy', 'emergency', 'general'],
        default: 'general'
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'published'
    },
    author: {
        name: {
            type: String,
            default: 'Matriz Curitiba'
        },
        role: {
            type: String,
            default: 'HQ'
        }
    },
    metadata: {
        views: {
            type: Number,
            default: 0
        },
        acknowledged: [{
            franchiseId: mongoose.Schema.Types.ObjectId,
            acknowledgedAt: Date
        }]
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for efficient querying
directiveSchema.index({ createdAt: -1 });
directiveSchema.index({ targetFranchiseId: 1 });
directiveSchema.index({ status: 1, priority: -1 });

// Virtual for acknowledgement count
directiveSchema.virtual('acknowledgedCount').get(function () {
    return this.metadata.acknowledged.length;
});

// Method to mark as acknowledged by a franchise
directiveSchema.methods.acknowledge = function (franchiseId) {
    const alreadyAcknowledged = this.metadata.acknowledged.some(
        ack => ack.franchiseId.toString() === franchiseId.toString()
    );

    if (!alreadyAcknowledged) {
        this.metadata.acknowledged.push({
            franchiseId,
            acknowledgedAt: new Date()
        });
    }

    return this.save();
};

// Method to increment view count
directiveSchema.methods.incrementViews = function () {
    this.metadata.views += 1;
    return this.save();
};

// Static method to get recent directives
directiveSchema.statics.getRecent = function (limit = 10) {
    return this.find({ status: 'published' })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('targetFranchiseId', 'name');
};

// Static method to get urgent directives
directiveSchema.statics.getUrgent = function () {
    return this.find({
        status: 'published',
        priority: 'urgent'
    })
        .sort({ createdAt: -1 });
};

const Directive = mongoose.model('Directive', directiveSchema);

module.exports = Directive;
