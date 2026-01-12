require('dotenv').config();
const mongoose = require('mongoose');
const Franchise = require('./models/Franchise');

// Função de geocoding
async function geocodeAddress(address) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
            {
                headers: {
                    'User-Agent': 'ArenaJiuJitsuHub/1.0'
                }
            }
        );

        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit: 1 req/sec

        const data = await response.json();

        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }

        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

// Função principal
const fixCoordinates = async () => {
    try {
        // Conectar ao banco
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arenahub');
        console.log('✅ Conectado ao MongoDB');

        // Buscar todas as academias
        const franchises = await Franchise.find();
        console.log(`📍 Encontradas ${franchises.length} academias\n`);

        // Encontrar academias sem coordenadas ou com coordenadas duplicadas
        const defaultCoords = [-25.4284, -49.2733];
        const needsGeocoding = franchises.filter(f =>
            !f.location ||
            !f.location.coordinates ||
            f.location.coordinates.length !== 2 ||
            (f.location.coordinates[1] === defaultCoords[0] && f.location.coordinates[0] === defaultCoords[1])
        );

        console.log(`🔧 ${needsGeocoding.length} academias precisam de geocodificação:\n`);
        needsGeocoding.forEach(f => console.log(`   - ${f.name} (${f.address})`));

        // Geocodificar cada academia
        for (const franchise of needsGeocoding) {
            console.log(`\n🌍 Geocodificando ${franchise.name}...`);
            console.log(`   Endereço: ${franchise.address}`);

            const coords = await geocodeAddress(franchise.address);

            if (coords) {
                // Atualizar no banco
                await Franchise.findByIdAndUpdate(franchise._id, {
                    location: {
                        type: 'Point',
                        coordinates: [coords.lng, coords.lat] // MongoDB usa [lng, lat]
                    }
                });

                console.log(`   ✅ Sucesso! Lat: ${coords.lat}, Lng: ${coords.lng}`);
            } else {
                console.log(`   ⚠️  Falha ao geocodificar. Mantendo coordenadas atuais.`);
            }
        }

        console.log(`\n🎉 GEOCODIFICAÇÃO CONCLUÍDA!`);
        console.log(`📊 ${needsGeocoding.length} academias processadas`);

        // Listar resultado final
        const updated = await Franchise.find();
        console.log(`\n📍 Coordenadas atualizadas:`);
        updated.forEach(f => {
            const lat = f.location?.coordinates[1] || 'N/A';
            const lng = f.location?.coordinates[0] || 'N/A';
            console.log(`   ${f.name}: ${lat}, ${lng}`);
        });

        await mongoose.connection.close();
        console.log('\n👋 Conexão fechada');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
};

// Executar
fixCoordinates();
