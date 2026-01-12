
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Franchise = require('../models/Franchise');
const Metric = require('../models/Metric');
const { connectDB, closeDB } = require('../config/database');

const syncMetrics = async () => {
    try {
        await connectDB();

        const now = new Date();
        const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        console.log(`\n🔄 Syncing metrics for period: ${period}`);

        const franchises = await Franchise.find({});
        console.log(`📍 Found ${franchises.length} franchises.`);

        let totalT = 0;
        let totalS = 0;

        for (const franchise of franchises) {
            const teacherCount = await Teacher.countDocuments({ franchiseId: franchise._id });
            const studentCount = await Student.countDocuments({ franchiseId: franchise._id });

            // Calculate actual revenue from students
            const students = await Student.find({ franchiseId: franchise._id });
            const revenue = students.reduce((acc, s) => acc + (s.amount || 0), 0);

            totalT += teacherCount;
            totalS += studentCount;

            // Find or create metric for this period
            let metric = await Metric.findOne({ franchiseId: franchise._id, period });

            if (metric) {
                metric.teachers.count = teacherCount;
                metric.students.total = studentCount;
                metric.finance.revenue = revenue;
                // Keep expenses and just update profit
                metric.finance.profit = revenue - (metric.finance.expenses || 0);
                await metric.save();
            } else {
                // Create new metric if not exists
                const expenses = revenue * 0.4; // Default 40%
                await Metric.create({
                    franchiseId: franchise._id,
                    period,
                    students: {
                        total: studentCount,
                        new: 0,
                        churn: 0
                    },
                    finance: {
                        revenue,
                        expenses,
                        profit: revenue - expenses
                    },
                    teachers: {
                        count: teacherCount
                    }
                });
            }

            // Also update the Franchise document for consistency if needed
            franchise.students = studentCount;
            franchise.revenue = Math.floor(revenue);
            await franchise.save();

            console.log(`✅ Synced ${franchise.name}: ${teacherCount} teachers, ${studentCount} students.`);
        }

        console.log('\n--- Sync Results ---');
        console.log(`Total Teachers across all franchises: ${totalT}`);
        console.log(`Total Students across all franchises: ${totalS}`);
        console.log('--------------------\n');

        await closeDB();
        console.log('Done!');
    } catch (error) {
        console.error('Error syncing metrics:', error);
        process.exit(1);
    }
};

syncMetrics();
