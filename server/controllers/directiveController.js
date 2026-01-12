const Directive = require('../models/Directive');

/**
 * @desc    Get all directives
 * @route   GET /api/v1/directives
 * @access  Public
 */
exports.getAllDirectives = async (req, res) => {
    try {
        const {
            status = 'published',
            priority,
            category,
            limit = 50,
            sortBy = '-createdAt'
        } = req.query;

        let query = {};
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (category) query.category = category;

        const directives = await Directive.find(query)
            .sort(sortBy)
            .limit(parseInt(limit))
            .populate('targetFranchiseId', 'name owner');

        res.status(200).json({
            success: true,
            count: directives.length,
            data: directives
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @desc    Get single directive
 * @route   GET /api/v1/directives/:id
 * @access  Public
 */
exports.getDirective = async (req, res) => {
    try {
        const directive = await Directive.findById(req.params.id)
            .populate('targetFranchiseId', 'name owner');

        if (!directive) {
            return res.status(404).json({
                success: false,
                error: 'Directive not found'
            });
        }

        // Increment view count
        await directive.incrementViews();

        res.status(200).json({
            success: true,
            data: directive
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @desc    Create new directive
 * @route   POST /api/v1/directives
 * @access  Private
 */
exports.createDirective = async (req, res) => {
    try {
        const directive = await Directive.create(req.body);

        res.status(201).json({
            success: true,
            data: directive
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @desc    Update directive
 * @route   PUT /api/v1/directives/:id
 * @access  Private
 */
exports.updateDirective = async (req, res) => {
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
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @desc    Delete directive
 * @route   DELETE /api/v1/directives/:id
 * @access  Private
 */
exports.deleteDirective = async (req, res) => {
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
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @desc    Acknowledge directive
 * @route   POST /api/v1/directives/:id/acknowledge
 * @access  Public (would require franchise authentication in production)
 */
exports.acknowledgeDirective = async (req, res) => {
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
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @desc    Get recent directives
 * @route   GET /api/v1/directives/recent/:limit
 * @access  Public
 */
exports.getRecentDirectives = async (req, res) => {
    try {
        const limit = parseInt(req.params.limit) || 10;
        const directives = await Directive.getRecent(limit);

        res.status(200).json({
            success: true,
            count: directives.length,
            data: directives
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @desc    Get urgent directives
 * @route   GET /api/v1/directives/urgent
 * @access  Public
 */
exports.getUrgentDirectives = async (req, res) => {
    try {
        const directives = await Directive.getUrgent();

        res.status(200).json({
            success: true,
            count: directives.length,
            data: directives
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
