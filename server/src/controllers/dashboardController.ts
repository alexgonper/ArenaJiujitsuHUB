import { Request, Response } from 'express';
import DashboardLayout from '../models/DashboardLayout';

/**
 * @desc    Get dashboard layout
 */
export const getLayout = async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'matrix';

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

/**
 * @desc    Save dashboard layout
 */
export const saveLayout = async (req: Request, res: Response) => {
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
            { layout, appType, lastUpdated: new Date() },
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
