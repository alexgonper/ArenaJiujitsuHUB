const Franchise = require('../models/Franchise');

/**
 * @desc    Get all franchises
 * @route   GET /api/v1/franchises
 * @access  Public
 */
exports.getAllFranchises = async (req, res) => {
    try {
        const { status, sortBy = '-students', limit, search } = req.query;

        // Build query
        let query = {};
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { owner: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } }
            ];
        }

        let franchises = Franchise.find(query).sort(sortBy);

        if (limit) {
            franchises = franchises.limit(parseInt(limit));
        }

        const results = await franchises;

        res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
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
exports.getFranchise = async (req, res) => {
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
    } catch (error) {
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
exports.createFranchise = async (req, res) => {
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
    } catch (error) {
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
exports.updateFranchise = async (req, res) => {
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
    } catch (error) {
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
exports.deleteFranchise = async (req, res) => {
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
    } catch (error) {
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
exports.getNearbyFranchises = async (req, res) => {
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
                    $maxDistance: parseInt(maxDistance)
                }
            }
        });

        res.status(200).json({
            success: true,
            count: franchises.length,
            data: franchises
        });
    } catch (error) {
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
exports.getNetworkStats = async (req, res) => {
    try {
        const stats = await Franchise.getNetworkStats();

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
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
exports.getTopFranchises = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const franchises = await Franchise.getTopByStudents(limit);

        res.status(200).json({
            success: true,
            count: franchises.length,
            data: franchises
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
