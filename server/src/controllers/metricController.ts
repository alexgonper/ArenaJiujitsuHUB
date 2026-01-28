import { Request, Response } from 'express';
import Metric from '../models/Metric';
import mongoose from 'mongoose';

/**
 * @desc    Get metrics for a specific franchise
 * @route   GET /api/v1/metrics/:franchiseId
 */
export const getFranchiseMetrics = async (req: Request, res: Response) => {
    try {
        const { franchiseId } = req.params;
        const { months = 6 } = req.query;

        // 1. Fetch Historical Metrics (Past Months)
        const metrics = await Metric.find({ franchiseId })
            .sort({ period: 1 })
            .limit(parseInt(months as string));

        // 2. LIVE CALCULATION FOR CURRENT MONTH (Real-time Data)
        const Student = (await import('../models/Student')).default;
        const Payment = (await import('../models/Payment')).default;
        const Teacher = (await import('../models/Teacher')).default;
        
        const now = new Date();
        const currentPeriodKey = now.toISOString().substring(0, 7); // "YYYY-MM"
        
        // Start of current month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // A. Live Students Count (Active Students)
        // Note: Student model status enum is Paga/Atrasada, not 'Inactive' based on model file
        // We consider active anyone who is not explicitly 'Inactive' (though model doesn't have Inactive status)
        // Let's assume all in DB are active or use paymentStatus
        const liveStudentsCount = await Student.countDocuments({ 
            franchiseId,
            // If your system marks inactive students, filter them here. 
            // Based on Student.ts, usually all are listed unless deleted.
            // We can filter by paymentStatus if needed, but for "Active Students", usually all enrolled count.
        });

        // B. Live Revenue (Approved Payments within current month)
        const livePayments = await Payment.aggregate([
            {
                $match: {
                    franchiseId: new mongoose.Types.ObjectId(franchiseId),
                    status: 'approved',
                    paidAt: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$amount" }
                }
            }
        ]);
        let liveRevenue = livePayments.length > 0 ? livePayments[0].totalRevenue : 0;

        // If no actual payments yet (start of month/demo), PROJECT revenue based on contracts
        if (liveRevenue === 0) {
            const projectedRevenue = await Student.aggregate([
                { $match: { franchiseId: new mongoose.Types.ObjectId(franchiseId) } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);
            if (projectedRevenue.length > 0) {
                liveRevenue = projectedRevenue[0].total;
            }
        }

        // C. Live Teachers Count
        const liveTeachersCount = await Teacher.countDocuments({ franchiseId });

        // 3. Construct Live Metric Object
        const liveMetric = {
            period: currentPeriodKey,
            franchiseId,
            students: { total: liveStudentsCount, new: 0, churn: 0 },
            finance: { revenue: liveRevenue, expenses: 0, profit: liveRevenue }, // Using 0 for expenses as prompt didn't specify expense source
            teachers: { count: liveTeachersCount },
            isLive: true // Flag to identify live data
        };

        // 4. Merge Data: Remove stored metric for current month if exists and append live one
        const finalMetrics = metrics.filter(m => m.period !== currentPeriodKey);
        finalMetrics.push(liveMetric as any); // Cast as any or IMetric to fit array

        // Sort by period again just in case
        finalMetrics.sort((a, b) => a.period.localeCompare(b.period));

        res.status(200).json({
            success: true,
            count: finalMetrics.length,
            data: finalMetrics,
            liveDebug: { liveStudentsCount, liveRevenue, liveTeachersCount, period: currentPeriodKey }
        });
    } catch (error: any) {
        console.error('getFranchiseMetrics Error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @desc    Get network-wide metrics (aggregated)
 * @route   GET /api/v1/metrics/network/summary
 */
export const getNetworkMetrics = async (req: Request, res: Response) => {
    try {
        const { months = 6 } = req.query;

        // 1. Historical Data Aggregation
        const summary = await Metric.aggregate([
            {
                $group: {
                    _id: "$period",
                    totalRevenue: { $sum: "$finance.revenue" },
                    totalStudents: { $sum: "$students.total" },
                    totalTeachers: { $sum: "$teachers.count" },
                    franchiseCount: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            { $limit: parseInt(months as string) }
        ]);

        // 2. LIVE NETWORK CALCULATION (Current Month)
        const Student = (await import('../models/Student')).default;
        const Payment = (await import('../models/Payment')).default;
        const Teacher = (await import('../models/Teacher')).default;
        const Franchise = (await import('../models/Franchise')).default;

        const now = new Date();
        const currentPeriodKey = now.toISOString().substring(0, 7); // "YYYY-MM"
        
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // A. Total Active Students in Network
        const totalLiveStudents = await Student.countDocuments({});

        // B. Total Network Revenue
        const networkPayments = await Payment.aggregate([
            {
                $match: {
                    status: 'approved',
                    paidAt: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$amount" }
                }
            }
        ]);
        let totalLiveRevenue = networkPayments.length > 0 ? networkPayments[0].totalRevenue : 0;

        // Fallback: Projected Revenue for Network
        if (totalLiveRevenue === 0) {
            const projectedNetworkRevenue = await Student.aggregate([
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);
            if (projectedNetworkRevenue.length > 0) {
                totalLiveRevenue = projectedNetworkRevenue[0].total;
            }
        }

        // C. Total Teachers
        const totalLiveTeachers = await Teacher.countDocuments({});

        // D. Active Franchises Count
        const activeFranchises = await Franchise.countDocuments({});

        // 3. Construct Live Summary Object
        const liveSummary = {
            _id: currentPeriodKey,
            totalRevenue: totalLiveRevenue,
            totalStudents: totalLiveStudents,
            totalTeachers: totalLiveTeachers,
            franchiseCount: activeFranchises,
            isLive: true
        };

        // 4. Merge: Remove existing summary for current month if any, and append live one
        const finalSummary = summary.filter(s => s._id !== currentPeriodKey);
        finalSummary.push(liveSummary);
        
        // Sort
        finalSummary.sort((a, b) => a._id.localeCompare(b._id));

        res.status(200).json({
            success: true,
            data: finalSummary
        });
    } catch (error: any) {
        console.error('getNetworkMetrics Error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @desc    Create or update a monthly metric snapshot
 * @route   POST /api/v1/metrics
 */
export const createMetric = async (req: Request, res: Response) => {
    try {
        const { franchiseId, period, finance } = req.body;

        if (finance && finance.revenue && finance.expenses) {
            req.body.finance.profit = finance.revenue - finance.expenses;
        }

        const metric = await Metric.findOneAndUpdate(
            { franchiseId, period },
            req.body,
            { new: true, upsert: true, runValidators: true }
        );

        res.status(201).json({
            success: true,
            data: metric
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};
