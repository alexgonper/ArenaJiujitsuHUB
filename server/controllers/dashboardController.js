const DashboardLayout = require('../models/DashboardLayout');

// @desc    Get dashboard layout
// @route   GET /api/v1/dashboard/layout
// @access  Public (for now)
exports.getLayout = async (req, res) => {
    try {
        const userId = req.query.userId || 'matrix';

        const layout = await DashboardLayout.findOne({ userId });

        if (!layout) {
            return res.status(404).json({
                success: false,
                message: 'Layout not found'
            });
        }

        res.status(200).json({
            success: true,
            data: layout.layout
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Save dashboard layout
// @route   POST /api/v1/dashboard/layout
// @access  Public (for now)
exports.saveLayout = async (req, res) => {
    try {
        const { layout } = req.body;
        const userId = req.body.userId || 'matrix';
        const appType = req.body.appType || 'matrix';

        if (!layout) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a layout'
            });
        }

        const dashboard = await DashboardLayout.findOneAndUpdate(
            { userId },
            { layout, appType, lastUpdated: Date.now() },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            data: dashboard
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};
