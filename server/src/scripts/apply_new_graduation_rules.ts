
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import GraduationRule from '../models/GraduationRule';
import { connectDB } from '../config/database';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function updateRules() {
    try {
        await connectDB();
        console.log('Connected to MongoDB.');

        const rulesToUpdate = [
            { belt: 'Azul', classes: 20 },
            { belt: 'Roxa', classes: 30 },
            { belt: 'Marrom', classes: 40 }
        ];

        for (const config of rulesToUpdate) {
            console.log(`Updating rules for ${config.belt}...`);
            
            // Update degree increments (Xº Grau -> X+1º Grau)
            const degreeResult = await GraduationRule.updateMany(
                { 
                    fromBelt: config.belt, 
                    toBelt: config.belt 
                },
                { 
                    $set: { classesRequired: config.classes } 
                }
            );
            console.log(`  - Updated ${degreeResult.modifiedCount} degree rules for ${config.belt}.`);

            // Update belt promotions (4º Grau -> Next Belt)
            // Promotion is usually slightly harder (beltClasses * 1.5)
            const promotionResult = await GraduationRule.updateMany(
                { 
                    fromBelt: config.belt, 
                    toBelt: { $ne: config.belt } 
                },
                { 
                    $set: { classesRequired: Math.floor(config.classes * 1.5) } 
                }
            );
            console.log(`  - Updated ${promotionResult.modifiedCount} promotion rules for ${config.belt} to ${Math.floor(config.classes * 1.5)} classes.`);
        }

        console.log('All graduation rules updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error updating graduation rules:', error);
        process.exit(1);
    }
}

updateRules();
