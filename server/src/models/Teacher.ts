import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IGraduation {
    belt: string;
    degree: string;
    date: Date;
    promotedBy?: string | Types.ObjectId;
}

export interface ITeacher extends Document {
    name: string;
    birthDate: Date;
    gender: 'Masculino' | 'Feminino' | 'Outro';
    phone?: string;
    email?: string;
    address?: string;
    belt: string;
    degree: string;
    hireDate: Date;
    franchiseId: Types.ObjectId;
    active: boolean;
    age: number | null;
    formattedHireDate: string;
    photoUrl?: string;
    graduationHistory: IGraduation[];
}

const teacherSchema = new Schema<ITeacher>({
    name: {
        type: String,
        required: [true, 'Nome do professor é obrigatório'],
        trim: true,
        maxlength: [100, 'Nome não pode exceder 100 caracteres']
    },
    photoUrl: {
        type: String,
        trim: true
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
        enum: ['Nenhum', '1º Grau', '2º Grau', '3º Grau', '4º Grau', '5º Grau', '6º Grau', '7º Grau', '8º Grau', '9º Grau', '10º Grau'],
        default: 'Nenhum',
        required: [true, 'Grau é obrigatório']
    },
    hireDate: {
        type: Date,
        required: [true, 'Data de entrada na academia é obrigatória'],
        default: Date.now
    },
    franchiseId: {
        type: Schema.Types.ObjectId,
        ref: 'Franchise',
        required: [true, 'Academia é obrigatória']
    },
    active: {
        type: Boolean,
        default: true
    },
    graduationHistory: [{
        belt: String,
        degree: String,
        date: { type: Date, default: Date.now },
        promotedBy: { type: String } // String or ID for the master's name
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

teacherSchema.index({ franchiseId: 1 });
teacherSchema.index({ name: 'text' });

teacherSchema.virtual('age').get(function () {
    if (!this.birthDate) return null;
    const diff = Date.now() - this.birthDate.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
});

teacherSchema.virtual('formattedHireDate').get(function () {
    if (!this.hireDate) return '';
    return this.hireDate.toLocaleDateString('pt-BR');
});

const Teacher = mongoose.model<ITeacher>('Teacher', teacherSchema);

export default Teacher;
