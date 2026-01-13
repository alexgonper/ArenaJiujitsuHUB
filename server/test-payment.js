/**
 * Payment System Test Script
 * Tests the payment creation and split logic locally
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Payment = require('./models/Payment');
const Student = require('./models/Student');
const Franchise = require('./models/Franchise');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-matrix';

async function testPaymentSystem() {
    try {
        console.log('🧪 Testing Payment System...\n');

        // Connect to database
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // 1. Get a sample franchise and student
        const franchise = await Franchise.findOne();
        const student = await Student.findOne({ franchiseId: franchise._id });

        if (!franchise || !student) {
            console.log('❌ No franchise or student found. Please seed the database first.');
            process.exit(1);
        }

        console.log(`📍 Franchise: ${franchise.name}`);
        console.log(`👤 Student: ${student.name}`);
        console.log(`💰 Royalty Rate: ${franchise.royaltyPercent || 10}%\n`);

        // 2. Create a test payment
        const amount = 250.00;
        const royaltyPercent = franchise.royaltyPercent || 10;
        const matrixFee = (amount * royaltyPercent) / 100;
        const franchiseIncome = amount - matrixFee;

        const payment = new Payment({
            franchiseId: franchise._id,
            studentId: student._id,
            type: 'Tuition',
            description: 'Mensalidade de Teste',
            amount: amount,
            status: 'pending',
            split: {
                matrixAmount: matrixFee,
                franchiseAmount: franchiseIncome,
                matrixRate: royaltyPercent
            }
        });

        await payment.save();
        console.log('✅ Payment created successfully!');
        console.log(`   ID: ${payment._id}`);
        console.log(`   Amount: R$ ${amount.toFixed(2)}`);
        console.log(`   Matrix Fee (${royaltyPercent}%): R$ ${matrixFee.toFixed(2)}`);
        console.log(`   Franchise Income: R$ ${franchiseIncome.toFixed(2)}`);
        console.log(`   Status: ${payment.status}\n`);

        // 3. Simulate approval
        payment.status = 'approved';
        payment.paidAt = new Date();
        await payment.save();

        console.log('✅ Payment approved!');
        console.log(`   Paid At: ${payment.paidAt.toLocaleString()}\n`);

        // 4. Verify student status update
        student.paymentStatus = 'Paga';
        await student.save();
        console.log('✅ Student status updated to "Paga"\n');

        // 5. Cleanup (optional)
        console.log('🧹 Cleaning up test payment...');
        await Payment.findByIdAndDelete(payment._id);
        console.log('✅ Test payment deleted\n');

        console.log('🎉 All tests passed!\n');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Database connection closed');
        process.exit(0);
    }
}

testPaymentSystem();
