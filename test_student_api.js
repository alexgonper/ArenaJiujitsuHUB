// Test script to verify student data from API
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/students',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const response = JSON.parse(data);

            if (response.success && response.data && response.data.length > 0) {
                console.log('\n=== TESTE DE DADOS DOS ALUNOS ===\n');
                console.log(`Total de alunos: ${response.count}\n`);

                // Mostrar os primeiros 5 alunos
                const sample = response.data.slice(0, 5);

                sample.forEach((student, index) => {
                    console.log(`${index + 1}. ${student.name}`);
                    console.log(`   Faixa: ${student.belt || 'NÃO DEFINIDA'}`);
                    console.log(`   Grau: ${student.degree || 'NÃO DEFINIDO'}`);
                    console.log(`   _id: ${student._id}`);
                    console.log('');
                });

                // Verificar se todos têm o campo degree
                const withoutDegree = response.data.filter(s => !s.degree);
                console.log(`\nAlunos sem campo 'degree': ${withoutDegree.length}`);

                if (withoutDegree.length > 0) {
                    console.log('\nExemplos de alunos sem degree:');
                    withoutDegree.slice(0, 3).forEach(s => {
                        console.log(`  - ${s.name} (${s._id})`);
                    });
                }
            } else {
                console.log('Nenhum aluno encontrado ou erro na resposta');
            }
        } catch (error) {
            console.error('Erro ao processar resposta:', error);
            console.log('Resposta raw:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('Erro na requisição:', error);
});

req.end();
