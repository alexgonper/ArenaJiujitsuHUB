import { Request, Response } from 'express';
import Directive from '../models/Directive';

/**
 * @desc    Get all directives
 */
export const getAllDirectives = async (req: Request, res: Response) => {
    try {
        const {
            status = 'published',
            priority,
            category,
            limit = 50,
            sortBy = '-createdAt'
        } = req.query;

        let query: any = {};
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (category) query.category = category;

        const directives = await Directive.find(query)
            .sort(sortBy as string)
            .limit(parseInt(limit as string))
            .populate('targetFranchiseId', 'name owner');

        res.status(200).json({
            success: true,
            count: directives.length,
            data: directives
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @desc    Get single directive
 */
export const getDirective = async (req: Request, res: Response) => {
    try {
        const directive = await Directive.findById(req.params.id)
            .populate('targetFranchiseId', 'name owner');

        if (!directive) {
            return res.status(404).json({
                success: false,
                error: 'Directive not found'
            });
        }

        await directive.incrementViews();

        res.status(200).json({
            success: true,
            data: directive
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @desc    Create new directive
 */
export const createDirective = async (req: Request, res: Response) => {
    try {
        const directive = await Directive.create(req.body);

        res.status(201).json({
            success: true,
            data: directive
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @desc    Update directive
 */
export const updateDirective = async (req: Request, res: Response) => {
    try {
        const directive = await Directive.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!directive) {
            return res.status(404).json({
                success: false,
                error: 'Directive not found'
            });
        }

        res.status(200).json({
            success: true,
            data: directive
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @desc    Delete directive
 */
export const deleteDirective = async (req: Request, res: Response) => {
    try {
        const directive = await Directive.findByIdAndDelete(req.params.id);

        if (!directive) {
            return res.status(404).json({
                success: false,
                error: 'Directive not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @desc    Acknowledge directive
 */
export const acknowledgeDirective = async (req: Request, res: Response) => {
    try {
        const directive = await Directive.findById(req.params.id);

        if (!directive) {
            return res.status(404).json({
                success: false,
                error: 'Directive not found'
            });
        }

        const { franchiseId } = req.body;

        if (!franchiseId) {
            return res.status(400).json({
                success: false,
                error: 'Franchise ID is required'
            });
        }

        await directive.acknowledge(franchiseId);

        res.status(200).json({
            success: true,
            data: directive
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @desc    Get recent directives
 */
export const getRecentDirectives = async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.params.limit) || 10;
        const directives = await Directive.getRecent(limit);

        res.status(200).json({
            success: true,
            count: directives.length,
            data: directives
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @desc    Get urgent directives
 */
export const getUrgentDirectives = async (req: Request, res: Response) => {
    try {
        const directives = await Directive.getUrgent();

        res.status(200).json({
            success: true,
            count: directives.length,
            data: directives
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
