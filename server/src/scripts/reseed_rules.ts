
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import GraduationRule from '../models/GraduationRule';
import { connectDB } from '../config/database';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const DEGREES = ['Nenhum', '1º Grau', '2º Grau', '3º Grau', '4º Grau'];

async function seedRules() {
    await connectDB();
    
    console.log('Cleaning old rules...');
    await GraduationRule.deleteMany({});
    
    const rules = [];

    // --- WHITE BELT PATH ---
    for (let j = 0; j < DEGREES.length - 1; j++) {
        rules.push({
            fromBelt: 'Branca',
            fromDegree: DEGREES[j],
            toBelt: 'Branca',
            toDegree: DEGREES[j + 1],
            classesRequired: 20,
            minDaysRequired: 30,
            examFee: 0
        });
    }
    rules.push({
        fromBelt: 'Branca',
        fromDegree: '4º Grau',
        toBelt: 'Azul',
        toDegree: 'Nenhum',
        classesRequired: 25,
        minDaysRequired: 45,
        examFee: 50
    });

    // --- KIDS PATH ---
    const kidsPath = ['Cinza', 'Amarela', 'Laranja', 'Verde'];
    for (let i = 0; i < kidsPath.length; i++) {
        const current = kidsPath[i];
        const next = i < kidsPath.length - 1 ? kidsPath[i + 1] : 'Azul';

        for (let j = 0; j < DEGREES.length - 1; j++) {
            rules.push({
                fromBelt: current,
                fromDegree: DEGREES[j],
                toBelt: current,
                toDegree: DEGREES[j + 1],
                classesRequired: 20,
                minDaysRequired: 30,
                examFee: 0
            });
        }
        rules.push({
            fromBelt: current,
            fromDegree: '4º Grau',
            toBelt: next,
            toDegree: 'Nenhum',
            classesRequired: 30,
            minDaysRequired: 90,
            examFee: 40
        });
    }

    // --- ADULT PATH ---
    const adultPath = ['Azul', 'Roxa', 'Marrom', 'Preta'];
    for (let i = 0; i < adultPath.length; i++) {
        const current = adultPath[i];
        const next = i < adultPath.length - 1 ? adultPath[i+1] : null;

        // Degrees
        for (let j = 0; j < DEGREES.length - 1; j++) {
            rules.push({
                fromBelt: current,
                fromDegree: DEGREES[j],
                toBelt: current,
                toDegree: DEGREES[j + 1],
                classesRequired: 30,
                minDaysRequired: 60,
                examFee: 0
            });
        }
        
        // Promotion to next belt
        if (next) {
            rules.push({
                fromBelt: current,
                fromDegree: '4º Grau',
                toBelt: next,
                toDegree: 'Nenhum',
                classesRequired: 50,
                minDaysRequired: 365,
                examFee: 100
            });
        }
    }

    console.log(`Inserting ${rules.length} rules...`);
    await GraduationRule.insertMany(rules);
    
    console.log('Rules seeded successfully!');
    process.exit(0);
}

seedRules();
