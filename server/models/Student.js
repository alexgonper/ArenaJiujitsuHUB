const mongoose = require('mongoose');

/**
 * Student Schema
 * Representa um aluno/atleta matriculado em uma academia
 */
const studentSchema = new mongoose.Schema({
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
            validator: function (v) {
                if (!v || v === '') return true;
                return /^[\d\s\+\-\(\)]+$/.test(v);
            },
            message: 'Formato de telefone inválido'
        }
    },
    belt: {
        type: String,
        enum: ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Roxa', 'Marrom', 'Preta'],
        default: 'Branca'
    },
    degree: {
        type: String,
        enum: ['Nenhum', '1º Grau', '2º Grau', '3º Grau', '4º Grau'],
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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Franchise',
        required: [true, 'Academia é obrigatória']
    },
    notes: {
        type: String,
        maxlength: [500, 'Notas não podem exceder 500 caracteres']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index para busca rápida por academia
studentSchema.index({ franchiseId: 1 });
studentSchema.index({ name: 'text' });

// Virtual para status de pagamento com cor
studentSchema.virtual('paymentStatusColor').get(function () {
    switch (this.paymentStatus) {
        case 'Paga': return 'green';
        case 'Atrasada': return 'red';
        default: return 'green';
    }
});

// Virtual para idade
studentSchema.virtual('age').get(function () {
    if (!this.birthDate) return null;
    const diff = Date.now() - this.birthDate.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
});

// Method para verificar se está ativo
studentSchema.methods.isActive = function () {
    return this.paymentStatus !== 'Atrasada';
};

// Static method para obter alunos por academia
studentSchema.statics.getByFranchise = function (franchiseId, filters = {}) {
    const query = { franchiseId };

    if (filters.belt) query.belt = filters.belt;
    if (filters.degree) query.degree = filters.degree;
    if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
    if (filters.search) {
        query.$or = [
            { name: { $regex: filters.search, $options: 'i' } },
            { phone: { $regex: filters.search, $options: 'i' } }
        ];
    }

    return this.find(query).sort({ createdAt: -1 });
};

// Static method para estatísticas de alunos
studentSchema.statics.getStats = async function (franchiseId) {
    const stats = await this.aggregate([
        { $match: { franchiseId: mongoose.Types.ObjectId(franchiseId) } },
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

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
