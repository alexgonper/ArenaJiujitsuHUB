
import graduationController from '../controllers/graduationController';
import { connectDB } from '../config/database';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function test() {
    await connectDB();
    
    const req = {
        params: { franchiseId: '696edd555a77e0d9bd401a6f' }
    } as any;
    
    const res = {
        status: (code: number) => {
            console.log('Status:', code);
            return res;
        },
        json: (data: any) => {
            console.log('--- API RESPONSE (AD) ---');
            console.log('Eligible count:', data.count);
            if (data.data && data.data.length > 0) {
                console.log('Sample eligible student:', data.data[0].name);
            }
        }
    } as any;
    
    await graduationController.getEligibleInFranchise(req, res);
    process.exit(0);
}

test();
