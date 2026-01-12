require('dotenv').config();
const mongoose = require('mongoose');
const Franchise = require('./models/Franchise');
const Student = require('./models/Student');

// Dados para gerar alunos
const maleNames = ['Lucas', 'Matheus', 'Gabriel', 'Pedro', 'Bernardo', 'Rafael', 'Felipe', 'Thiago', 'Bruno', 'Leonardo', 'Daniel', 'Rodrigo', 'Gustavo', 'Caio', 'Vinicius'];
const femaleNames = ['Julia', 'Alice', 'Sophia', 'Laura', 'Manuela', 'Isabella', 'Beatriz', 'Luiza', 'Mariana', 'Gabriela', 'Larissa', 'Fernanda', 'Camila', 'Amanda', 'Leticia'];
const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida'];
const belts = ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Roxa', 'Marrom', 'Preta'];
const degrees = ['Nenhum', '1º Grau', '2º Grau', '3º Grau', '4º Grau'];

// 10 Novas Academias com coordenadas exatas
const targets = [
    // Nacionais
    { name: 'Arena Rio de Janeiro', city: 'Rio de Janeiro - RJ', lat: -22.9068, lng: -43.1729 },
    { name: 'Arena Porto Alegre', city: 'Porto Alegre - RS', lat: -30.0346, lng: -51.2177 },
    { name: 'Arena Belo Horizonte', city: 'Belo Horizonte - MG', lat: -19.9167, lng: -43.9345 },
    { name: 'Arena Brasília', city: 'Brasília - DF', lat: -15.7975, lng: -47.8919 },
    { name: 'Arena Salvador', city: 'Salvador - BA', lat: -12.9777, lng: -38.5016 },
    // Internacionais
    { name: 'Arena New York', city: 'New York, USA', lat: 40.7128, lng: -74.0060 },
    { name: 'Arena Tokyo', city: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
    { name: 'Arena London', city: 'London, UK', lat: 51.5074, lng: -0.1278 },
    { name: 'Arena Paris', city: 'Paris, France', lat: 48.8566, lng: 2.3522 },
    { name: 'Arena Sydney', city: 'Sydney, Australia', lat: -33.8688, lng: 151.2093 }
];

// Helper para gerar aluno aleatório
const generateStudent = (franchiseId) => {
    const isMale = Math.random() > 0.5;
    const firstName = isMale ? maleNames[Math.floor(Math.random() * maleNames.length)] : femaleNames[Math.floor(Math.random() * femaleNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const phone = `${Math.floor(Math.random() * 90 + 10)} 9${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`;

    return {
        name: `${firstName} ${lastName}`,
        gender: isMale ? 'Masculino' : 'Feminino',
        phone,
        belt: belts[Math.floor(Math.random() * belts.length)],
        degree: degrees[Math.floor(Math.random() * degrees.length)],
        amount: [100, 120, 150, 180, 200, 250][Math.floor(Math.random() * 6)],
        paymentStatus: ['Paga', 'Paga', 'Paga', 'Paga', 'Atrasada'][Math.floor(Math.random() * 5)], // Mais chances de estar pago
        birthDate: new Date(new Date().getFullYear() - [18, 22, 25, 30, 35, 40, 15, 50][Math.floor(Math.random() * 8)], Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        franchiseId
    };
};

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log('✅ Conectado ao MongoDB');

        let createdCount = 0;

        for (const target of targets) {
            console.log(`\n🏗️  Criando ${target.name}...`);

            // 1. Criar Academia
            const franchise = await Franchise.create({
                name: target.name,
                owner: 'Mestre ' + lastNames[Math.floor(Math.random() * lastNames.length)],
                address: target.city,
                phone: `+55 ${Math.floor(Math.random() * 90 + 10)} 3333-${Math.floor(Math.random() * 9999)}`,
                email: `contato@${target.name.toLowerCase().replace(/\s/g, '')}.com`,
                students: 20,
                revenue: 20 * 150, // Estimativa
                expenses: 1500 + Math.floor(Math.random() * 2000),
                location: {
                    type: 'Point',
                    coordinates: [target.lng, target.lat] // MongoDB é [lng, lat]
                }
            });

            // 2. Criar 20 Alunos
            const students = Array.from({ length: 20 }, () => generateStudent(franchise._id));
            await Student.insertMany(students);

            console.log(`   ✅ Academia criada com 20 alunos!`);
            createdCount++;
        }

        console.log(`\n🎉 SUCESSO! ${createdCount} novas academias criadas com 200 novos alunos.`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
};

seed();
