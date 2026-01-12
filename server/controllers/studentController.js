const Student = require('../models/Student');
const Franchise = require('../models/Franchise');

/**
 * @desc    Get all students or filter by franchise
 * @route   GET /api/v1/students
 * @access  Public
 */
exports.getStudents = async (req, res, next) => {
    try {
        const { franchiseId, belt, paymentStatus, search } = req.query;

        let query = {};

        if (franchiseId) query.franchiseId = franchiseId;
        if (belt) query.belt = belt;
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const students = await Student.find(query)
            .populate('franchiseId', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single student
 * @route   GET /api/v1/students/:id
 * @access  Public
 */
exports.getStudent = async (req, res, next) => {
    try {
        const student = await Student.findById(req.params.id)
            .populate('franchiseId', 'name owner address');

        if (!student) {
            return res.status(404).json({
                success: false,
                error: 'Aluno não encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: student
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new student
 * @route   POST /api/v1/students
 * @access  Public
 */
exports.createStudent = async (req, res, next) => {
    try {
        // Verificar se a academia existe
        const franchise = await Franchise.findById(req.body.franchiseId);
        if (!franchise) {
            return res.status(404).json({
                success: false,
                error: 'Academia não encontrada'
            });
        }

        const student = await Student.create(req.body);

        // Incrementar contador de alunos na academia
        await Franchise.findByIdAndUpdate(
            req.body.franchiseId,
            { $inc: { students: 1 } }
        );

        res.status(201).json({
            success: true,
            data: student
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update student
 * @route   PUT /api/v1/students/:id
 * @access  Public
 */
exports.updateStudent = async (req, res, next) => {
    try {
        let student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                error: 'Aluno não encontrado'
            });
        }

        student = await Student.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: student
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete student
 * @route   DELETE /api/v1/students/:id
 * @access  Public
 */
exports.deleteStudent = async (req, res, next) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                error: 'Aluno não encontrado'
            });
        }

        // Decrementar contador na academia
        await Franchise.findByIdAndUpdate(
            student.franchiseId,
            { $inc: { students: -1 } }
        );

        await student.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get students statistics by franchise
 * @route   GET /api/v1/students/stats/:franchiseId
 * @access  Public
 */
exports.getStudentStats = async (req, res, next) => {
    try {
        const stats = await Student.getStats(req.params.franchiseId);

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update payment status
 * @route   PATCH /api/v1/students/:id/payment
 * @access  Public
 */
exports.updatePaymentStatus = async (req, res, next) => {
    try {
        const { paymentStatus } = req.body;

        if (!['Paga', 'Pendente', 'Atrasada'].includes(paymentStatus)) {
            return res.status(400).json({
                success: false,
                error: 'Status de pagamento inválido'
            });
        }

        const student = await Student.findByIdAndUpdate(
            req.params.id,
            { paymentStatus },
            { new: true, runValidators: true }
        );

        if (!student) {
            return res.status(404).json({
                success: false,
                error: 'Aluno não encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: student
        });
    } catch (error) {
        next(error);
    }
};
