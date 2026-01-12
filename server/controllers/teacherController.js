const Teacher = require('../models/Teacher');
const Franchise = require('../models/Franchise');

/**
 * @desc    Get all teachers or filter by franchise
 * @route   GET /api/v1/teachers
 * @access  Public
 */
exports.getTeachers = async (req, res, next) => {
    try {
        const { franchiseId, belt, search } = req.query;

        let query = {};

        if (franchiseId) query.franchiseId = franchiseId;
        if (belt) query.belt = belt;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } }
            ];
        }

        const teachers = await Teacher.find(query)
            .populate('franchiseId', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: teachers.length,
            data: teachers
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single teacher
 * @route   GET /api/v1/teachers/:id
 * @access  Public
 */
exports.getTeacher = async (req, res, next) => {
    try {
        const teacher = await Teacher.findById(req.params.id)
            .populate('franchiseId', 'name owner address');

        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: 'Professor não encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: teacher
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new teacher
 * @route   POST /api/v1/teachers
 * @access  Public
 */
exports.createTeacher = async (req, res, next) => {
    try {
        // Verificar se a academia existe
        const franchise = await Franchise.findById(req.body.franchiseId);
        if (!franchise) {
            return res.status(404).json({
                success: false,
                error: 'Academia não encontrada'
            });
        }

        const teacher = await Teacher.create(req.body);

        // Update franchise teacher count
        await Franchise.findByIdAndUpdate(req.body.franchiseId, {
            $inc: { teachers: 1 }
        });

        res.status(201).json({
            success: true,
            data: teacher
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update teacher
 * @route   PUT /api/v1/teachers/:id
 * @access  Public
 */
exports.updateTeacher = async (req, res, next) => {
    try {
        let teacher = await Teacher.findById(req.params.id);

        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: 'Professor não encontrado'
            });
        }

        teacher = await Teacher.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: teacher
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete teacher
 * @route   DELETE /api/v1/teachers/:id
 * @access  Public
 */
exports.deleteTeacher = async (req, res, next) => {
    try {
        const teacher = await Teacher.findById(req.params.id);

        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: 'Professor não encontrado'
            });
        }

        await teacher.deleteOne();

        // Update franchise teacher count
        await Franchise.findByIdAndUpdate(teacher.franchiseId, {
            $inc: { teachers: -1 }
        });

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};
