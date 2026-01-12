require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');
const Franchise = require('./models/Franchise');

// Nomes masculinos brasileiros
const maleNames = [
    'Carlos Silva', 'João Santos', 'Pedro Oliveira', 'Lucas Costa', 'Matheus Souza',
    'Gabriel Lima', 'Rafael Alves', 'Bruno Pereira', 'Thiago Ribeiro', 'Felipe Martins',
    'André Carvalho', 'Rodrigo Fernandes', 'Marcelo Gomes', 'Paulo Rodrigues', 'Diego Araújo',
    'Fernando Dias', 'Gustavo Castro', 'Leonardo Barbosa', 'Ricardo Rocha', 'Vinicius Cardoso',
    'Juliano Monteiro', 'Renato Pires', 'Fabio Cunha', 'Sergio Moreira', 'Alexandre Teixeira',
    'Leandro Ramos', 'Daniel Campos', 'Marcos Nunes', 'Cristiano Freitas', 'Anderson Batista'
];

// Nomes femininos brasileiros
const femaleNames = [
    'Maria Santos', 'Ana Silva', 'Juliana Costa', 'Fernanda Oliveira', 'Carolina Souza',
    'Camila Lima', 'Beatriz Alves', 'Larissa Pereira', 'Amanda Ribeiro', 'Gabriela Martins',
    'Patrícia Carvalho', 'Priscila Fernandes', 'Renata Gomes', 'Vanessa Rodrigues', 'Tatiana Araújo',
    'Daniela Dias', 'Mariana Castro', 'Aline Barbosa', 'Bianca Rocha', 'Leticia Cardoso',
    'Claudia Monteiro', 'Adriana Pires', 'Simone Cunha', 'Monica Moreira', 'Paula Teixeira',
    'Roberta Ramos', 'Cristina Campos', 'Silvia Nunes', 'Luciana Freitas', 'Andreia Batista'
];

// Faixas e graus
const belts = ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Roxa', 'Marrom', 'Preta'];
const degrees = ['Nenhum', '1º Grau', '2º Grau', '3º Grau', '4º Grau'];
const paymentStatuses = ['Paga', 'Atrasada'];
const genders = ['Masculino', 'Feminino'];

// Função helper para gerar telefone
const generatePhone = () => {
    const ddd = Math.floor(Math.random() * 90) + 10;
    const n1 = Math.floor(Math.random() * 9000) + 1000;
    const n2 = Math.floor(Math.random() * 9000) + 1000;
    return `${ddd} ${n1}-${n2}`;
};

// Função helper para gerar data de registro (últimos 2 anos)
const generateRegistrationDate = () => {
    const now = Date.now();
    const twoYearsAgo = now - (2 * 365 * 24 * 60 * 60 * 1000);
    const randomTime = Math.floor(Math.random() * (now - twoYearsAgo)) + twoYearsAgo;
    return new Date(randomTime);
};

// Função para gerar aluno aleatório
const generateRandomStudent = (franchiseId, gender) => {
    const names = gender === 'Masculino' ? maleNames : femaleNames;
    const name = names[Math.floor(Math.random() * names.length)];
    const belt = belts[Math.floor(Math.random() * belts.length)];
    const degree = degrees[Math.floor(Math.random() * degrees.length)];
    const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
    const amount = [120, 150, 180, 200, 250][Math.floor(Math.random() * 5)];

    return {
        name,
        gender,
        phone: generatePhone(),
        belt,
        degree,
        amount,
        degree,
        amount,
        birthDate: new Date(new Date().getFullYear() - [18, 22, 25, 30, 35, 40, 15, 50][Math.floor(Math.random() * 8)], Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        registrationDate: generateRegistrationDate(),
        paymentStatus,
        franchiseId
    };
};

// Função principal de seed
const seedStudents = async () => {
    try {
        // Conectar ao banco
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Conectado ao MongoDB');

        // Buscar todas as academias
        const franchises = await Franchise.find();
        console.log(`📍 Encontradas ${franchises.length} academias`);

        if (franchises.length === 0) {
            console.log('⚠️  Nenhuma academia encontrada. Execute o seed de academias primeiro.');
            process.exit(0);
        }

        // Limpar alunos existentes (opcional - comente se quiser manter os existentes)
        // await Student.deleteMany({});
        // console.log('🗑️  Alunos existentes removidos');

        let totalCreated = 0;

        // Para cada academia, criar 20 alunos
        for (const franchise of franchises) {
            console.log(`\n🥋 Criando alunos para ${franchise.name}...`);

            const students = [];

            // Gerar 20 alunos (10 masculinos, 10 femininos)
            for (let i = 0; i < 10; i++) {
                students.push(generateRandomStudent(franchise._id, 'Masculino'));
                students.push(generateRandomStudent(franchise._id, 'Feminino'));
            }

            // Inserir no banco
            await Student.insertMany(students);

            // Atualizar contador de alunos na academia
            await Franchise.findByIdAndUpdate(franchise._id, {
                students: 20
            });

            totalCreated += 20;
            console.log(`   ✅ 20 alunos criados para ${franchise.name}`);
        }

        console.log(`\n🎉 SEED CONCLUÍDO!`);
        console.log(`📊 Total de alunos criados: ${totalCreated}`);
        console.log(`📍 Academias atualizadas: ${franchises.length}`);

        // Fechar conexão
        await mongoose.connection.close();
        console.log('\n👋 Conexão fechada');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro ao criar alunos:', error);
        process.exit(1);
    }
};

// Executar seed
seedStudents();
