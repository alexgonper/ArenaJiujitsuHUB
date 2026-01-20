import { Request, Response } from 'express';
import Metric from '../models/Metric';

/**
 * @desc    Get metrics for a specific franchise
 * @route   GET /api/v1/metrics/:franchiseId
 */
export const getFranchiseMetrics = async (req: Request, res: Response) => {
    try {
        const { franchiseId } = req.params;
        const { months = 6 } = req.query;

        const metrics = await Metric.find({ franchiseId })
            .sort({ period: 1 })
            .limit(parseInt(months as string));

        res.status(200).json({
            success: true,
            count: metrics.length,
            data: metrics
        });
    } catch (error: any) {
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

        res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error: any) {
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
