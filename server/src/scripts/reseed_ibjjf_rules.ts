
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
    // =========================================================================
    // IBJJF: Monthly/Yearly progression based on age, but simplified here to degrees.
    // Grey (4+), Yellow (7+), Orange (10+), Green (13+)
    
    const kidsBelts = [
        { name: 'Cinza', minAge: 4, daysPerDegree: 240, classesPerDegree: 60 },
        { name: 'Amarela', minAge: 7, daysPerDegree: 240, classesPerDegree: 60 },
        { name: 'Laranja', minAge: 10, daysPerDegree: 240, classesPerDegree: 60 },
        { name: 'Verde', minAge: 13, daysPerDegree: 240, classesPerDegree: 60 }
    ];

    for (let i = 0; i < kidsBelts.length; i++) {
        const current = kidsBelts[i];
        const next = i < kidsBelts.length - 1 ? kidsBelts[i + 1] : { name: 'Azul', minAge: 16 };

        // Degrees within belt
        for (let j = 0; j < DEGREES.length - 1; j++) {
            rules.push({
                fromBelt: current.name,
                fromDegree: DEGREES[j],
                toBelt: current.name,
                toDegree: DEGREES[j + 1],
                classesRequired: current.classesPerDegree,
                minDaysRequired: current.daysPerDegree,
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
            classesRequired: current.classesPerDegree,
            minDaysRequired: current.daysPerDegree, // Time from 4th degree to next belt
            minAge: next.minAge, // Must meet age requirement for next belt
            examFee: 50
        });
    }

    // =========================================================================
    // ADULT SYSTEM (16+ Years)
    // =========================================================================

    // --- WHITE BELT (Branca) ---
    // No minimum time by IBJJF, but we set a standard.
    // White -> White Degrees
    for (let j = 0; j < DEGREES.length - 1; j++) {
        rules.push({
            fromBelt: 'Branca',
            fromDegree: DEGREES[j],
            toBelt: 'Branca',
            toDegree: DEGREES[j+1],
            classesRequired: 30,
            minDaysRequired: 90, // ~3 months per stripe
            minAge: 0,
            examFee: 0
        });
    }
    // White -> Blue (Min Age 16)
    rules.push({
        fromBelt: 'Branca',
        fromDegree: '4º Grau',
        toBelt: 'Azul',
        toDegree: 'Nenhum',
        classesRequired: 40,
        minDaysRequired: 90,
        minAge: 16, // CRITICAL IBJJF RULE
        examFee: 80
    });

    // --- BLUE BELT (Azul) ---
    // IBJJF: Min 2 Years as Blue Belt before Purple.
    // 2 Years = ~730 Days.
    // 4 Stripes. So ~180 days per stripe.
    for (let j = 0; j < DEGREES.length - 1; j++) {
        rules.push({
            fromBelt: 'Azul',
            fromDegree: DEGREES[j],
            toBelt: 'Azul',
            toDegree: DEGREES[j+1],
            classesRequired: 50,
            minDaysRequired: 180, // 6 months
            minAge: 16,
            examFee: 0
        });
    }
    // Blue -> Purple
    rules.push({
        fromBelt: 'Azul',
        fromDegree: '4º Grau',
        toBelt: 'Roxa',
        toDegree: 'Nenhum',
        classesRequired: 50,
        minDaysRequired: 10, // Just a small buffer after 4th stripe, assuming total time is managed by stripe progression 
        // OR better: enforce varying minDays for the *jump*? 
        // In this simple engine, it checks time since *Last Graduation*. 
        // If last grad was 4th stripe, then this is just the exam time.
        // NOTE: Real strict enforcement requires checking total time in belt, not just since last stripe.
        // For now, we assume consistent progression.
        minAge: 16,
        examFee: 120
    });

    // --- PURPLE BELT (Roxa) ---
    // IBJJF: Min 1.5 Years (547 Days). ~136 Days per stripe
    for (let j = 0; j < DEGREES.length - 1; j++) {
        rules.push({
            fromBelt: 'Roxa',
            fromDegree: DEGREES[j],
            toBelt: 'Roxa',
            toDegree: DEGREES[j+1],
            classesRequired: 60,
            minDaysRequired: 135,
            minAge: 16,
            examFee: 0
        });
    }
    // Purple -> Brown (Min Age 18)
    rules.push({
        fromBelt: 'Roxa',
        fromDegree: '4º Grau',
        toBelt: 'Marrom',
        toDegree: 'Nenhum',
        classesRequired: 60,
        minDaysRequired: 135,
        minAge: 18, // CRITICAL IBJJF RULE
        examFee: 150
    });

    // --- BROWN BELT (Marrom) ---
    // IBJJF: Min 1 Year (365 Days). ~90 Days per stripe
    for (let j = 0; j < DEGREES.length - 1; j++) {
        rules.push({
            fromBelt: 'Marrom',
            fromDegree: DEGREES[j],
            toBelt: 'Marrom',
            toDegree: DEGREES[j+1],
            classesRequired: 70,
            minDaysRequired: 90,
            minAge: 18,
            examFee: 0
        });
    }
    // Brown -> Black (Min Age 19)
    rules.push({
        fromBelt: 'Marrom',
        fromDegree: '4º Grau',
        toBelt: 'Preta',
        toDegree: 'Nenhum',
        classesRequired: 100,
        minDaysRequired: 90,
        minAge: 19, // CRITICAL IBJJF RULE
        examFee: 300
    });
    
    // --- BLACK BELT (Preta) ---
    // IBJJF: Degrees by time only.
    // 0 -> 1: 3 years
    // 1 -> 2: 3 years
    // 2 -> 3: 3 years
    // 3 -> 4: 5 years
    // ... Simplified here
    
    console.log(`Inserting ${rules.length} IBJJF-aligned rules...`);
    await GraduationRule.insertMany(rules);
    
    console.log('IBJJF Rules seeded successfully!');
    process.exit(0);
}

seedRules();
