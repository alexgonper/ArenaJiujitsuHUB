const Metric = require('../models/Metric');
const Franchise = require('../models/Franchise');

// @desc    Get metrics for a specific franchise
// @route   GET /api/v1/metrics/:franchiseId
exports.getFranchiseMetrics = async (req, res) => {
    try {
        const { franchiseId } = req.params;
        const { months = 6 } = req.query;

        const metrics = await Metric.find({ franchiseId })
            .sort({ period: 1 })
            .limit(parseInt(months));

        res.status(200).json({
            success: true,
            count: metrics.length,
            data: metrics
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get network-wide metrics (aggregated)
// @route   GET /api/v1/metrics/network/summary
exports.getNetworkMetrics = async (req, res) => {
    try {
        const { months = 6 } = req.query;

        // Aggregate metrics by period for all franchises
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
            { $limit: parseInt(months) }
        ]);

        res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Create or update a monthly metric snapshot
// @route   POST /api/v1/metrics
exports.createMetric = async (req, res) => {
    try {
        const { franchiseId, period } = req.body;

        // Calculate profit if not provided
        if (req.body.finance && req.body.finance.revenue && req.body.finance.expenses) {
            req.body.finance.profit = req.body.finance.revenue - req.body.finance.expenses;
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
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};
