import { Request, Response } from 'express';
import Franchise from '../models/Franchise';

/**
 * @desc    Get all franchises
 * @route   GET /api/v1/franchises
 * @access  Public
 */
export const getAllFranchises = async (req: Request, res: Response) => {
    try {
        const { status, sortBy = '-students', limit, search } = req.query;

        // Build query
        let query: any = {};
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { owner: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } }
            ];
        }

        let franchisesQuery = Franchise.find(query).sort(sortBy as string);

        if (limit) {
            franchisesQuery = franchisesQuery.limit(parseInt(limit as string));
        }

        const results = await franchisesQuery;

        res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @desc    Get single franchise
 * @route   GET /api/v1/franchises/:id
 * @access  Public
 */
export const getFranchise = async (req: Request, res: Response) => {
    try {
        const franchise = await Franchise.findById(req.params.id);

        if (!franchise) {
            return res.status(404).json({
                success: false,
                error: 'Franchise not found'
            });
        }

        res.status(200).json({
            success: true,
            data: franchise
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @desc    Create new franchise
 * @route   POST /api/v1/franchises
 * @access  Private (would require authentication in production)
 */
export const createFranchise = async (req: Request, res: Response) => {
    try {
        // Convert lat/lng to GeoJSON format if provided
        if (req.body.lat && req.body.lng) {
            req.body.location = {
                type: 'Point',
                coordinates: [req.body.lng, req.body.lat] // [longitude, latitude]
            };
            delete req.body.lat;
            delete req.body.lng;
        }

        const franchise = await Franchise.create(req.body);

        res.status(201).json({
            success: true,
            data: franchise
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @desc    Update franchise
 * @route   PUT /api/v1/franchises/:id
 * @access  Private
 */
export const updateFranchise = async (req: Request, res: Response) => {
    try {
        // Convert lat/lng to GeoJSON format if provided
        if (req.body.lat && req.body.lng) {
            req.body.location = {
                type: 'Point',
                coordinates: [req.body.lng, req.body.lat]
            };
            delete req.body.lat;
            delete req.body.lng;
        }

        const franchise = await Franchise.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!franchise) {
            return res.status(404).json({
                success: false,
                error: 'Franchise not found'
            });
        }

        res.status(200).json({
            success: true,
            data: franchise
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @desc    Delete franchise
 * @route   DELETE /api/v1/franchises/:id
 * @access  Private
 */
export const deleteFranchise = async (req: Request, res: Response) => {
    try {
        const franchise = await Franchise.findByIdAndDelete(req.params.id);

        if (!franchise) {
            return res.status(404).json({
                success: false,
                error: 'Franchise not found'
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
 * @desc    Get franchises near a location
 * @route   GET /api/v1/franchises/nearby/:lng/:lat
 * @access  Public
 */
export const getNearbyFranchises = async (req: Request, res: Response) => {
    try {
        const { lng, lat } = req.params;
        const maxDistance = req.query.distance || 100000; // Default 100km

        const franchises = await Franchise.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(maxDistance as string)
                }
            }
        });

        res.status(200).json({
            success: true,
            count: franchises.length,
            data: franchises
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @desc    Get network statistics
 * @route   GET /api/v1/franchises/stats/network
 * @access  Public
 */
export const getNetworkStats = async (req: Request, res: Response) => {
    try {
        const stats = await (Franchise as any).getNetworkStats();

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @desc    Get top performing franchises
 * @route   GET /api/v1/franchises/stats/top
 * @access  Public
 */
export const getTopFranchises = async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 5;
        const franchises = await (Franchise as any).getTopByStudents(limit);

        res.status(200).json({
            success: true,
            count: franchises.length,
            data: franchises
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
