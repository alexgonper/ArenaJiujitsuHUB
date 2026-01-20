import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IDirective extends Document {
    text: string;
    targetUnit: string;
    targetFranchiseId: Types.ObjectId | null;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: 'announcement' | 'training' | 'event' | 'policy' | 'emergency' | 'general';
    status: 'draft' | 'published' | 'archived';
    author: {
        name: string;
        role: string;
    };
    metadata: {
        views: number;
        acknowledged: Array<{
            franchiseId: Types.ObjectId;
            acknowledgedAt: Date;
        }>;
    };
    acknowledgedCount: number;
    acknowledge(franchiseId: Types.ObjectId): Promise<IDirective>;
    incrementViews(): Promise<IDirective>;
}

interface IDirectiveModel extends Model<IDirective> {
    getRecent(limit?: number): Promise<IDirective[]>;
    getUrgent(): Promise<IDirective[]>;
}

const directiveSchema = new Schema<IDirective>({
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
        type: Schema.Types.ObjectId,
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
            franchiseId: Schema.Types.ObjectId,
            acknowledgedAt: Date
        }]
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

directiveSchema.index({ createdAt: -1 });
directiveSchema.index({ targetFranchiseId: 1 });
directiveSchema.index({ status: 1, priority: -1 });

directiveSchema.virtual('acknowledgedCount').get(function (this: IDirective) {
    return this.metadata.acknowledged.length;
});

directiveSchema.methods.acknowledge = function (this: IDirective, franchiseId: Types.ObjectId) {
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

directiveSchema.methods.incrementViews = function (this: IDirective) {
    this.metadata.views += 1;
    return this.save();
};

directiveSchema.statics.getRecent = function (limit = 10) {
    return this.find({ status: 'published' })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('targetFranchiseId', 'name');
};

directiveSchema.statics.getUrgent = function () {
    return this.find({
        status: 'published',
        priority: 'urgent'
    })
        .sort({ createdAt: -1 });
};

const Directive = mongoose.model<IDirective, IDirectiveModel>('Directive', directiveSchema);

export default Directive;
