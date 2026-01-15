const mongoose = require('mongoose');
const Class = require('./models/Class');
require('dotenv').config();

async function fixClassCategories() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix');
        console.log('✅ Conectado ao MongoDB');

        const classes = await Class.find({});
        console.log(`🔎 Analisando ${classes.length} aulas...`);

        let updatedCount = 0;

        for (const cls of classes) {
            let newCategory = 'BJJ'; // Default
            const lowerName = cls.name.toLowerCase();

            if (lowerName.includes('no-gi')) {
                newCategory = 'No-Gi';
            } else if (lowerName.includes('wrestling')) {
                newCategory = 'Wrestling';
            } else if (lowerName.includes('kids')) {
                newCategory = 'Kids';
            } else if (lowerName.includes('fundamentals')) {
                newCategory = 'Fundamentals';
            }

            if (cls.category !== newCategory) {
                cls.category = newCategory;
                await cls.save();
                updatedCount++;
            }
        }

        console.log(`✨ Atualizadas ${updatedCount} aulas com categorias corretas.`);

    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado');
    }
}

fixClassCategories();
