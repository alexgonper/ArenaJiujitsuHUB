
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function cleanupEmails() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log('Conectado para limpeza...');
        
        const Student = mongoose.model('Student', new mongoose.Schema({
            email: String,
            franchiseId: mongoose.Schema.Types.ObjectId
        }));

        // O e-mail que estamos testando
        const testEmail = 'aluno.are.51@arena.com';
        const spFranchiseId = '696ef2d54743599f3e052c1b'; // ID de São Paulo

        // Remover todos os registros desse e-mail que NÃO sejam de São Paulo
        const result = await Student.deleteMany({ 
            email: testEmail, 
            franchiseId: { $ne: new mongoose.Types.ObjectId(spFranchiseId) } 
        });

        console.log(`Sucesso: Removidos ${result.deletedCount} cadastros duplicados.`);
        
        // Verificar se sobrou alguém
        const remaining = await Student.find({ email: testEmail });
        console.log(`Cadastros restantes para ${testEmail}: ${remaining.length}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Erro na limpeza:', err);
    }
}

cleanupEmails();
