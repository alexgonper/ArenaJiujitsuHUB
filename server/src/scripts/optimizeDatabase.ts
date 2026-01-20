import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import Student from '../models/Student';
import Teacher from '../models/Teacher';
import Attendance from '../models/Attendance';
import Franchise from '../models/Franchise';
import Payment from '../models/Payment';
import { connectDB, closeDB } from '../config/database';

/**
 * Cria índices otimizados para todas as collections
 */
export const createOptimizedIndexes = async () => {
    try {
        console.log('🔧 Criando índices otimizados...\n');

        // ===== STUDENTS INDEXES =====
        console.log('📚 Otimizando índices de Students...');
        await Student.collection.createIndex({ franchiseId: 1, paymentStatus: 1 });
        await Student.collection.createIndex({ franchiseId: 1, belt: 1 });
        await Student.collection.createIndex({ franchiseId: 1, registrationDate: -1 });
        await Student.collection.createIndex({ email: 1 }, { sparse: true });
        await Student.collection.createIndex({ phone: 1 }, { sparse: true });
        await Student.collection.createIndex({ createdAt: -1 });
        console.log('✅ Students: 6 índices criados');

        // ===== TEACHERS INDEXES =====
        console.log('\n👨‍🏫 Otimizando índices de Teachers...');
        await Teacher.collection.createIndex({ franchiseId: 1 });
        await Teacher.collection.createIndex({ email: 1 }, { unique: true, sparse: true });
        await Teacher.collection.createIndex({ belt: 1 });
        await Teacher.collection.createIndex({ createdAt: -1 });
        console.log('✅ Teachers: 4 índices criados');

        // ===== ATTENDANCE INDEXES =====
        console.log('\n📋 Otimizando índices de Attendance...');
        await Attendance.collection.createIndex({ franchiseId: 1, date: -1 });
        await Attendance.collection.createIndex({ studentId: 1, date: -1 });
        await Attendance.collection.createIndex({ classId: 1 });
        await Attendance.collection.createIndex({ createdAt: -1 });
        console.log('✅ Attendance: 4 índices criados');

        // ===== FRANCHISES INDEXES =====
        console.log('\n🏢 Otimizando índices de Franchises...');
        await Franchise.collection.createIndex({ location: '2dsphere' });
        await Franchise.collection.createIndex({ isMatrix: 1 });
        await Franchise.collection.createIndex({ createdAt: -1 });
        console.log('✅ Franchises: 3 índices criados');

        // ===== PAYMENTS INDEXES =====
        console.log('\n💰 Otimizando índices de Payments...');
        await Payment.collection.createIndex({ franchiseId: 1, status: 1 });
        await Payment.collection.createIndex({ studentId: 1, createdAt: -1 });
        await Payment.collection.createIndex({ status: 1, createdAt: -1 });
        console.log('✅ Payments: 3 índices criados');

        console.log('\n✅ TODOS OS ÍNDICES CRIADOS COM SUCESSO!');
        console.log('📊 Total: 20+ índices otimizados\n');

        // Listar todos os índices para verificação
        console.log('📋 Verificando índices criados...\n');
        
        const studentIndexes = await Student.collection.indexes();
        console.log(`Students (${studentIndexes.length} índices):`, studentIndexes.map(i => i.name));
        
        const teacherIndexes = await Teacher.collection.indexes();
        console.log(`Teachers (${teacherIndexes.length} índices):`, teacherIndexes.map(i => i.name));
        
        const attendanceIndexes = await Attendance.collection.indexes();
        console.log(`Attendance (${attendanceIndexes.length} índices):`, attendanceIndexes.map(i => i.name));

        console.log('\n✨ Otimização de banco de dados completa!');
        
    } catch (error) {
        console.error('❌ Erro ao criar índices:', error);
        throw error;
    }
};

/**
 * Analisa performance das queries
 */
export const analyzeQueryPerformance = async () => {
    console.log('\n📊 Analisando performance das queries...\n');

    try {
        const explain: any = await Student.find({ franchiseId: '507f1f77bcf86cd799439011' } as any)
            .explain('executionStats');
        
        console.log('Query Plan - Students by Franchise:');
        console.log(`- Docs examinados: ${explain.executionStats.totalDocsExamined}`);
        console.log(`- Docs retornados: ${explain.executionStats.nReturned}`);
        console.log(`- Tempo de execução: ${explain.executionStats.executionTimeMillis}ms`);
        console.log(`- Índice usado: ${explain.executionStats.executionStages.indexName || 'COLLECTION_SCAN'}`);
        
    } catch (error) {
        console.log('⚠️  Não foi possível analisar performance (normal se não houver dados)');
    }
};

// Executar se chamado diretamente
if (require.main === module) {
    (async () => {
        try {
            await connectDB();
            await createOptimizedIndexes();
            await analyzeQueryPerformance();
            await closeDB();
            process.exit(0);
        } catch (error) {
            console.error('❌ Erro:', error);
            await closeDB();
            process.exit(1);
        }
    })();
}
