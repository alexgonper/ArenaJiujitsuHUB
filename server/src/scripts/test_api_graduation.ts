
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import graduationController from '../controllers/graduationController';
import { connectDB } from '../config/database';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function check() {
    await connectDB();
    
    // Mock Request and Response
    const req: any = { params: { franchiseId: '696edd545a77e0d9bd40175f' } };
    const res: any = {
        status: function(code: number) { this.statusCode = code; return this; },
        json: function(data: any) { this.data = data; return this; }
    };
    
    await graduationController.getEligibleInFranchise(req, res);
    
    console.log('--- API RESPONSE ---');
    console.log(`Status: ${res.statusCode}`);
    console.log(`Eligible count: ${res.data.count}`);
    
    if (res.data.count > 0) {
        console.log('Sample eligible student:', res.data.data[0].name);
    }
    
    process.exit(0);
}

check();
