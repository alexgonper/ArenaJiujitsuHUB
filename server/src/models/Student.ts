import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IGraduation {
    belt: string;
    degree: string;
    date: Date;
    promotedBy?: Types.ObjectId;
}

export interface IStudent extends Document {
    name: string;
    gender: 'Masculino' | 'Feminino' | 'Outro';
    birthDate: Date;
    phone?: string;
    email?: string;
    belt: 'Branca' | 'Cinza' | 'Amarela' | 'Laranja' | 'Verde' | 'Azul' | 'Roxa' | 'Marrom' | 'Preta' | 'Coral' | 'Vermelha';
    degree: 'Nenhum' | '1º Grau' | '2º Grau' | '3º Grau' | '4º Grau' | '5º Grau' | '6º Grau' | '7º Grau' | '8º Grau' | '9º Grau' | '10º Grau';
    amount: number;
    registrationDate: Date;
    paymentStatus: 'Paga' | 'Atrasada';
    franchiseId: Types.ObjectId;
    notes?: string;
    address?: string;
    lastGraduationDate: Date;
    graduationHistory: IGraduation[];
    paymentStatusColor: string;
    age: number | null;
    createdAt: Date;
    updatedAt: Date;
    isActive(): boolean;
}

interface IStudentModel extends Model<IStudent> {
    getByFranchise(franchiseId: string | Types.ObjectId, filters?: any): Promise<IStudent[]>;
    getStats(franchiseId: string | Types.ObjectId): Promise<any>;
}

const studentSchema = new Schema<IStudent>({
    name: {
        type: String,
        required: [true, 'Nome do aluno é obrigatório'],
        trim: true,
        maxlength: [100, 'Nome não pode exceder 100 caracteres']
    },
    gender: {
        type: String,
        enum: ['Masculino', 'Feminino', 'Outro'],
        default: 'Masculino'
    },
    birthDate: {
        type: Date,
        required: [true, 'Data de nascimento é obrigatória']
    },
    phone: {
        type: String,
        trim: true,
        validate: {
            validator: function (v: string) {
                if (!v || v === '') return true;
                return /^[\d\s\+\-\(\)]+$/.test(v);
            },
            message: 'Formato de telefone inválido'
        }
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        validate: {
            validator: function (v: string) {
                if (!v || v === '') return true;
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Formato de email inválido'
        }
    },
    belt: {
        type: String,
        enum: ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Roxa', 'Marrom', 'Preta', 'Coral', 'Vermelha'],
        default: 'Branca'
    },
    degree: {
        type: String,
        enum: ['Nenhum', '1º Grau', '2º Grau', '3º Grau', '4º Grau', '5º Grau', '6º Grau', '7º Grau', '8º Grau', '9º Grau', '10º Grau'],
        default: 'Nenhum'
    },
    amount: {
        type: Number,
        default: 0,
        min: [0, 'Valor não pode ser negativo']
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
    paymentStatus: {
        type: String,
        enum: ['Paga', 'Atrasada'],
        default: 'Paga'
    },
    franchiseId: {
        type: Schema.Types.ObjectId,
        ref: 'Franchise',
        required: [true, 'Academia é obrigatória']
    },
    notes: {
        type: String,
        maxlength: [500, 'Notas não podem exceder 500 caracteres']
    },
    address: {
        type: String,
        trim: true,
        maxlength: [200, 'Endereço não pode exceder 200 caracteres']
    },
    lastGraduationDate: {
        type: Date,
        default: Date.now
    },
    graduationHistory: [{
        belt: String,
        degree: String,
        date: { type: Date, default: Date.now },
        promotedBy: { type: Schema.Types.ObjectId, ref: 'Teacher' }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

studentSchema.index({ franchiseId: 1 });
studentSchema.index({ name: 'text' });

studentSchema.virtual('paymentStatusColor').get(function () {
    switch (this.paymentStatus) {
        case 'Paga': return 'green';
        case 'Atrasada': return 'red';
        default: return 'green';
    }
});

studentSchema.virtual('age').get(function () {
    if (!this.birthDate) return null;
    const diff = Date.now() - this.birthDate.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
});

studentSchema.methods.isActive = function () {
    return this.paymentStatus !== 'Atrasada';
};

studentSchema.statics.getByFranchise = function (franchiseId, filters = {}) {
    const query: any = { franchiseId };

    if (filters.belt) query.belt = filters.belt;
    if (filters.degree) query.degree = filters.degree;
    if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
    if (filters.search) {
        query.$or = [
            { name: { $regex: filters.search, $options: 'i' } },
            { phone: { $regex: filters.search, $options: 'i' } },
            { email: { $regex: filters.search, $options: 'i' } }
        ];
    }

    return this.find(query).sort({ createdAt: -1 });
};

studentSchema.statics.getStats = async function (franchiseId) {
    const stats = await this.aggregate([
        { $match: { franchiseId: new mongoose.Types.ObjectId(franchiseId as string) } },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
                paid: {
                    $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paga'] }, 1, 0] }
                },
                overdue: {
                    $sum: { $cond: [{ $eq: ['$paymentStatus', 'Atrasada'] }, 1, 0] }
                }
            }
        }
    ]);

    return stats[0] || {
        total: 0,
        totalAmount: 0,
        paid: 0,
        overdue: 0
    };
};

const Student = mongoose.model<IStudent, IStudentModel>('Student', studentSchema);

export default Student;
