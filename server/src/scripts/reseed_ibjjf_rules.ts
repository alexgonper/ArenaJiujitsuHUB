
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

    // =========================================================================
    // KIDS SYSTEM (4 - 15 Years)
    // IBJJF: White -> Grey/White -> Grey -> Grey/Black -> Yellow/White -> ...
    // =========================================================================
    
    const kidsBelts = [
        { name: 'Cinza', minAge: 4 },
        { name: 'Amarela', minAge: 7 },
        { name: 'Laranja', minAge: 10 },
        { name: 'Verde', minAge: 13 }
    ];

    // IBJJF Children's belts actually have more colors (White-stripe, Solid, Black-stripe)
    // To keep it simple but compliant, we use degrees 1-4.
    for (let i = 0; i < kidsBelts.length; i++) {
        const current = kidsBelts[i];
        const next = i < kidsBelts.length - 1 ? kidsBelts[i + 1] : { name: 'Azul', minAge: 16 };

        // Degrees within belt (Standard: 3 months per stripe for kids)
        for (let j = 0; j < DEGREES.length - 1; j++) {
            rules.push({
                fromBelt: current.name,
                fromDegree: DEGREES[j],
                toBelt: current.name,
                toDegree: DEGREES[j + 1],
                classesRequired: 24, // ~2 classes/week for 3 months
                minDaysRequired: 90,
                minAge: current.minAge,
                examFee: 0
            });
        }

        // Graduation to next belt
        rules.push({
            fromBelt: current.name,
            fromDegree: '4º Grau',
            toBelt: next.name,
            toDegree: 'Nenhum',
            classesRequired: 24,
            minDaysRequired: 90, 
            minAge: next.minAge,
            examFee: 50
        });
    }

    // =========================================================================
    // ADULT SYSTEM (16+ Years)
    // =========================================================================

    // --- WHITE BELT (Branca) ---
    for (let j = 0; j < DEGREES.length - 1; j++) {
        rules.push({
            fromBelt: 'Branca',
            fromDegree: DEGREES[j],
            toBelt: 'Branca',
            toDegree: DEGREES[j+1],
            classesRequired: 30,
            minDaysRequired: 60, // 2 months per stripe (Total ~8-10 months for Blue)
            minAge: 0,
            examFee: 0
        });
    }
    rules.push({
        fromBelt: 'Branca',
        fromDegree: '4º Grau',
        toBelt: 'Azul',
        toDegree: 'Nenhum',
        classesRequired: 30,
        minDaysRequired: 60,
        minAge: 16,
        examFee: 80
    });

    // --- BLUE BELT (Azul) ---
    // IBJJF: Min 2 Years total. 2 Years = 730 days.
    // Divided by 5 (4 stripes + 1 belt jump) = ~146 days per step.
    for (let j = 0; j < DEGREES.length - 1; j++) {
        rules.push({
            fromBelt: 'Azul',
            fromDegree: DEGREES[j],
            toBelt: 'Azul',
            toDegree: DEGREES[j+1],
            classesRequired: 60,
            minDaysRequired: 146, // ~5 months
            minAge: 16,
            examFee: 0
        });
    }
    rules.push({
        fromBelt: 'Azul',
        fromDegree: '4º Grau',
        toBelt: 'Roxa',
        toDegree: 'Nenhum',
        classesRequired: 60,
        minDaysRequired: 146,
        minAge: 16,
        examFee: 120
    });

    // --- PURPLE BELT (Roxa) ---
    // IBJJF: Min 1.5 Years total. 547 days.
    // Divided by 5 steps = ~110 days per step.
    for (let j = 0; j < DEGREES.length - 1; j++) {
        rules.push({
            fromBelt: 'Roxa',
            fromDegree: DEGREES[j],
            toBelt: 'Roxa',
            toDegree: DEGREES[j+1],
            classesRequired: 70,
            minDaysRequired: 110,
            minAge: 16,
            examFee: 0
        });
    }
    rules.push({
        fromBelt: 'Roxa',
        fromDegree: '4º Grau',
        toBelt: 'Marrom',
        toDegree: 'Nenhum',
        classesRequired: 70,
        minDaysRequired: 110,
        minAge: 18,
        examFee: 150
    });

    // --- BROWN BELT (Marrom) ---
    // IBJJF: Min 1 Year total. 365 days.
    // Divided by 5 steps = 73 days per step.
    for (let j = 0; j < DEGREES.length - 1; j++) {
        rules.push({
            fromBelt: 'Marrom',
            fromDegree: DEGREES[j],
            toBelt: 'Marrom',
            toDegree: DEGREES[j+1],
            classesRequired: 80,
            minDaysRequired: 73,
            minAge: 18,
            examFee: 0
        });
    }
    rules.push({
        fromBelt: 'Marrom',
        fromDegree: '4º Grau',
        toBelt: 'Preta',
        toDegree: 'Nenhum',
        classesRequired: 80,
        minDaysRequired: 73,
        minAge: 19,
        examFee: 300
    });
    
    // --- BLACK BELT SYSTEM (Preta) ---
    const blackBeltDegrees = ['Nenhum', '1º Grau', '2º Grau', '3º Grau', '4º Grau', '5º Grau', '6º Grau'];
    const yearsPerDegree = [3, 3, 3, 5, 5, 5]; 

    for (let i = 0; i < blackBeltDegrees.length; i++) {
        const isLastBlackDegree = i === blackBeltDegrees.length - 1;
        const nextBelt = isLastBlackDegree ? 'Coral' : 'Preta';
        const nextDegree = isLastBlackDegree ? '7º Grau' : blackBeltDegrees[i+1];
        
        rules.push({
            fromBelt: 'Preta',
            fromDegree: blackBeltDegrees[i],
            toBelt: nextBelt,
            toDegree: nextDegree,
            classesRequired: 0, 
            minDaysRequired: (yearsPerDegree[i] || 7) * 365,
            minAge: isLastBlackDegree ? 50 : 19,
            examFee: 500
        });
    }

    // Master Belts
    rules.push({
        fromBelt: 'Coral',
        fromDegree: '7º Grau',
        toBelt: 'Coral',
        toDegree: '8º Grau',
        classesRequired: 0,
        minDaysRequired: 7 * 365,
        minAge: 57,
        examFee: 1000
    });

    rules.push({
        fromBelt: 'Coral',
        fromDegree: '8º Grau',
        toBelt: 'Vermelha',
        toDegree: '9º Grau',
        classesRequired: 0,
        minDaysRequired: 10 * 365,
        minAge: 67,
        examFee: 2000
    });

    // --- RED BELT 9th DEGREE (Vermelha) ---
    // 9th to 10th: Reserved for the Gracie Brothers (Pioneers). Unattainable for general public.
    // We stop at 9th.
    
    console.log(`Inserting ${rules.length} IBJJF-aligned rules...`);
    await GraduationRule.insertMany(rules);
    
    console.log('IBJJF Rules seeded successfully!');
    process.exit(0);
}

seedRules();
