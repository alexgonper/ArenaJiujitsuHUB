const mongoose = require('mongoose');

/**
 * Teacher Schema
 * Represents a teacher/instructor (professor) at an academy
 */
const teacherSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nome do professor é obrigatório'],
        trim: true,
        maxlength: [100, 'Nome não pode exceder 100 caracteres']
    },
    birthDate: {
        type: Date,
        required: [true, 'Data de nascimento é obrigatória']
    },
    gender: {
        type: String,
        enum: ['Masculino', 'Feminino', 'Outro'],
        default: 'Masculino'
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    belt: {
        type: String,
        enum: ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Roxa', 'Marrom', 'Preta', 'Coral', 'Vermelha'],
        default: 'Preta',
        required: [true, 'Faixa é obrigatória']
    },
    degree: {
        type: String,
        enum: ['Nenhum', '1º Grau', '2º Grau', '3º Grau', '4º Grau', '5º Grau', '6º Grau'],
        default: 'Nenhum',
        required: [true, 'Grau é obrigatório']
    },
    hireDate: {
        type: Date,
        required: [true, 'Data de entrada na academia é obrigatória'],
        default: Date.now
    },
    franchiseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Franchise',
        required: [true, 'Academia é obrigatória']
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for quick search by franchise
teacherSchema.index({ franchiseId: 1 });
teacherSchema.index({ name: 'text' });

// Virtual for age
teacherSchema.virtual('age').get(function () {
    if (!this.birthDate) return null;
    const diff = Date.now() - this.birthDate.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
});

// Virtual for formatting hire date
teacherSchema.virtual('formattedHireDate').get(function () {
    if (!this.hireDate) return '';
    return this.hireDate.toLocaleDateString('pt-BR');
});

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;
