const Teacher = require('../models/Teacher');
const Franchise = require('../models/Franchise');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

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

/**
 * @desc    Teacher Login
 * @route   POST /api/v1/teachers/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'E-mail é obrigatório'
            });
        }

        const teacher = await Teacher.findOne({ email, active: true }).populate('franchiseId');

        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: 'Professor não encontrado ou inativo'
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
 * @desc    Get Teacher Dashboard Stats and Agenda
 * @route   GET /api/v1/teachers/:id/dashboard
 * @access  Public
 */
exports.getDashboard = async (req, res, next) => {
    try {
        const teacher = await Teacher.findById(req.params.id);

        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: 'Professor não encontrado'
            });
        }

        // Get today's classes for this teacher
        const today = new Date().getDay();
        const classes = await Class.find({
            teacherId: teacher._id,
            dayOfWeek: today,
            active: true
        }).sort({ startTime: 1 });

        // Get total students in the franchise
        const studentCount = await Student.countDocuments({
            franchiseId: teacher.franchiseId
        });

        // Get today's attendance count
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const attendanceToday = await Attendance.countDocuments({
            tenantId: teacher.franchiseId,
            date: { $gte: startOfDay },
            status: 'Present'
        });

        // Get recent attendance
        const recentAttendance = await Attendance.find({
            checkedInBy: teacher._id
        })
            .limit(5)
            .sort({ createdAt: -1 })
            .populate('studentId', 'name');

        res.status(200).json({
            success: true,
            data: {
                teacher,
                agenda: classes,
                stats: {
                    totalStudents: studentCount,
                    attendanceToday: attendanceToday
                },
                recentAttendance
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get Students for Attendance check
 * @route   GET /api/v1/teachers/:id/students
 * @access  Public
 */
exports.getStudentsForAttendance = async (req, res, next) => {
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: 'Professor não encontrado'
            });
        }

        const students = await Student.find({
            franchiseId: teacher.franchiseId
        }).select('name belt paymentStatus');

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
 * @desc    Mark Student Attendance
 * @route   POST /api/v1/teachers/attendance
 * @access  Public
 */
exports.markAttendance = async (req, res, next) => {
    try {
        const { studentId, classId, teacherId, franchiseId } = req.body;

        const attendance = await Attendance.create({
            studentId,
            classId,
            checkedInBy: teacherId,
            tenantId: franchiseId,
            date: new Date(),
            status: 'Present'
        });

        res.status(201).json({
            success: true,
            data: attendance
        });
    } catch (error) {
        next(error);
    }
};
