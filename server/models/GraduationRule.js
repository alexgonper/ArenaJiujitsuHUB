const mongoose = require('mongoose');

/**
 * GraduationRule Schema
 * Defines the requirements (classes and time) for a student to advance to the next degree or belt.
 */
const graduationRuleSchema = new mongoose.Schema({
    fromBelt: {
        type: String,
        required: true,
        enum: ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Roxa', 'Marrom', 'Preta', 'Coral', 'Vermelha']
    },
    fromDegree: {
        type: String,
        required: true,
        enum: ['Nenhum', '1º Grau', '2º Grau', '3º Grau', '4º Grau', '5º Grau', '6º Grau', '7º Grau', '8º Grau', '9º Grau', '10º Grau']
    },
    toBelt: {
        type: String,
        required: true
    },
    toDegree: {
        type: String,
        required: true
    },
    classesRequired: {
        type: Number,
        required: true,
        default: 40
    },
    minDaysRequired: {
        type: Number,
        default: 90 // 3 months
    },
    examFee: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index for unique rule mapping
graduationRuleSchema.index({ fromBelt: 1, fromDegree: 1 }, { unique: true });

const GraduationRule = mongoose.model('GraduationRule', graduationRuleSchema);

module.exports = GraduationRule;
