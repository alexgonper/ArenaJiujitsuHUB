require('dotenv').config();
const mongoose = require('mongoose');
const Franchise = require('../models/Franchise');
const { connectDB, closeDB } = require('../config/database');

/**
 * Seed Database with Initial Arena Franchises
 */

const franchises = [
    {
        name: "Arena Papanduva",
        owner: "Prof. Anderson Morais BigBoy",
        address: "Rua Juscelino K. de Oliveira, s/n, Centro, Papanduva - SC",
        phone: "42 999526407",
        email: "papanduva@arenajj.com",
        students: 78,
        revenue: 10200,
        expenses: 4500,
        location: {
            type: 'Point',
            coordinates: [-50.1444, -26.5684] // [lng, lat]
        },
        status: 'active',
        metrics: {
            retention: 85,
            satisfaction: 9.2,
            growth: 12
        },
        metadata: {
            founded: new Date('2020-01-15'),
            notes: 'Strong community engagement'
        }
    },
    {
        name: "Arena São Francisco do Sul",
        owner: "Prof. David Maldonado / Lucas Maldonado",
        address: "Av. Inácio Espíndola 550 - Praia Grande, São Francisco do Sul - SC",
        phone: "47 996164179",
        email: "saofrancisco@arenajj.com",
        students: 92,
        revenue: 12500,
        expenses: 5800,
        location: {
            type: 'Point',
            coordinates: [-48.6381, -26.2425]
        },
        status: 'active',
        metrics: {
            retention: 88,
            satisfaction: 9.5,
            growth: 15
        },
        metadata: {
            founded: new Date('2019-06-01'),
            notes: 'Coastal location with tourism potential'
        }
    },
    {
        name: "Arena Guaratuba",
        owner: "Prof. Alexandre Vieira",
        address: "Av. Ivaí, 99 - Guaratuba - PR",
        phone: "41 999402641",
        email: "guaratuba@arenajj.com",
        students: 84,
        revenue: 11000,
        expenses: 4200,
        location: {
            type: 'Point',
            coordinates: [-48.5747, -25.8828]
        },
        status: 'active',
        metrics: {
            retention: 82,
            satisfaction: 9.0,
            growth: 10
        },
        metadata: {
            founded: new Date('2021-03-10'),
            notes: 'Growing youth program'
        }
    },
    {
        name: "Arena Cascais",
        owner: "Prof. Julio Amodio",
        address: "Cascais, Portugal",
        phone: "+351 910554339",
        email: "cascais@arenajj.com",
        students: 65,
        revenue: 7500,
        expenses: 3200,
        location: {
            type: 'Point',
            coordinates: [-9.4223, 38.6971]
        },
        status: 'active',
        metrics: {
            retention: 90,
            satisfaction: 9.8,
            growth: 8
        },
        metadata: {
            founded: new Date('2018-09-01'),
            notes: 'First international unit, strong European presence'
        }
    },
    {
        name: "Arena México",
        owner: "Hélio Carcereri",
        address: "Culiacán, México",
        phone: "+52 000000",
        email: "mexico@arenajj.com",
        students: 145,
        revenue: 19000,
        expenses: 9500,
        location: {
            type: 'Point',
            coordinates: [-107.3940, 24.8091]
        },
        status: 'active',
        metrics: {
            retention: 87,
            satisfaction: 9.3,
            growth: 20
        },
        metadata: {
            founded: new Date('2017-04-20'),
            notes: 'Largest unit, strong competition team'
        }
    }
];

async function seedDatabase() {
    try {
        // Connect to database
        await connectDB();

        // Clear existing data
        console.log('🗑️  Clearing existing franchises...');
        await Franchise.deleteMany({});

        // Insert seed data
        console.log('🌱 Seeding franchises...');
        const created = await Franchise.insertMany(franchises);

        console.log('\n✅ Database seeded successfully!');
        console.log(`📊 Created ${created.length} franchises:`);
        created.forEach((f, i) => {
            console.log(`   ${i + 1}. ${f.name} - ${f.students} students`);
        });

        // Display stats
        const stats = await Franchise.getNetworkStats();
        console.log('\n📈 Network Statistics:');
        console.log(`   Total Students: ${stats.totalStudents}`);
        console.log(`   Total Revenue: R$ ${stats.totalRevenue.toLocaleString()}`);
        console.log(`   Average Students: ${Math.round(stats.averageStudents)}`);
        console.log(`   Active Units: ${stats.unitCount}`);

        console.log('\n✨ Seed completed!\n');

        // Close connection
        await closeDB();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

// Run seeder
seedDatabase();
