const Teacher = require('../models/Teacher');
const Franchise = require('../models/Franchise');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const ClassBooking = require('../models/ClassBooking');
const AttendanceService = require('../services/attendanceService');

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

        // Get today's classes for this teacher (Day of week normalized to SP)
        const normalizedNow = AttendanceService.getNormalizedToday();
        const today = normalizedNow.getDay();
        const classes = await Class.find({
            teacherId: teacher._id,
            dayOfWeek: today,
            active: true
        }).sort({ startTime: 1 });

        // Get total students (Students who have attended at least one class with this teacher)
        const distinctStudents = await Attendance.distinct('studentId', {
            checkedInBy: teacher._id
        });
        const studentCount = distinctStudents.length;

        // Get today's attendance count (Only for the classes in today's agenda)
        const startOfDay = AttendanceService.getNormalizedToday();
        const endOfDay = AttendanceService.getNormalizedEndOfDay();

        const classIds = classes.map(c => c._id);
        const attendanceToday = await Attendance.countDocuments({
            classId: { $in: classIds },
            date: { $gte: startOfDay, $lte: endOfDay },
            status: 'Present'
        });

        // Get recent attendance
        const recentAttendance = await Attendance.find({
            checkedInBy: teacher._id
        })
            .limit(5)
            .sort({ createdAt: -1 })
            .populate('studentId', 'name');

        // Fetch franchise details for branding
        const franchise = await Franchise.findById(teacher.franchiseId);

        // Advanced Stats: Weekly & Streak
        const weekStart = new Date(normalizedNow);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
        weekStart.setHours(0,0,0,0);
        
        const attendancesThisWeek = await Attendance.countDocuments({
            checkedInBy: teacher._id,
            date: { $gte: weekStart }
        });

        // Streak Calculation
        let streak = 0;
        let checkDate = new Date(normalizedNow);
        checkDate.setDate(checkDate.getDate() - 1); // Start from yesterday
        
        // Loop back 30 days max to find streak
        // Optimize: verify streak only for last 14 days to be fast
        for(let i=0; i<30; i++) {
            const dayStart = new Date(checkDate);
            dayStart.setHours(0,0,0,0);
            const dayEnd = new Date(checkDate);
            dayEnd.setHours(23,59,59,999);
            
            const hasClass = await Attendance.exists({
                checkedInBy: teacher._id,
                date: { $gte: dayStart, $lte: dayEnd }
            });
            
            if(hasClass) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break; 
            }
        }
        
        if(attendanceToday > 0) streak++;

        res.status(200).json({
            success: true,
            data: {
                teacher,
                franchise,
                agenda: classes,
                stats: {
                    totalStudents: studentCount,
                    attendanceToday: attendanceToday,
                    weekTotal: attendancesThisWeek,
                    streak: streak
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

        const { scope } = req.query;
        let query = { franchiseId: teacher.franchiseId };

        if (scope === 'my') {
            // 1. Get all classes taught by this teacher
            const teacherClasses = await Class.find({ teacherId: teacher._id });
            const teacherClassIds = teacherClasses.map(c => c._id);

            // 2. Find unique student IDs from active bookings in these classes
            const studentIdsWithBookings = await ClassBooking.distinct('studentId', {
                classId: { $in: teacherClassIds },
                status: { $in: ['reserved', 'confirmed'] }
            });

            // 3. Find unique student IDs from attendance records for this teacher
            const studentIdsWithAttendance = await Attendance.distinct('studentId', {
                checkedInBy: teacher._id
            });

            // Merge unique IDs
            const allMyStudentIds = [...new Set([...studentIdsWithBookings, ...studentIdsWithAttendance])];
            
            query._id = { $in: allMyStudentIds };
        }

        const students = await Student.find(query).select('name belt degree paymentStatus phone gender birthDate');

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

        const attendance = await AttendanceService.registerAttendance({
            studentId,
            classId,
            teacherId,
            tenantId: franchiseId,
            checkInMethod: 'Professor'
        });

        // Update booking status if exists
        // We look for a booking for today/this class
        // Use normalized date from Service if possible, or just Today range
        const startOfDay = new Date();
        startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date();
        endOfDay.setHours(23,59,59,999);

        await ClassBooking.findOneAndUpdate(
            {
                studentId,
                classId,
                date: { $gte: startOfDay, $lte: endOfDay },
                status: 'reserved'
            },
            { status: 'confirmed' }
        );

        res.status(201).json({
            success: true,
            data: attendance
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Erro ao registrar presença'
        });
    }
};

/**
 * @desc    Remove/Revoke Attendance
 * @route   DELETE /api/v1/teachers/attendance
 * @access  Public
 */
exports.removeAttendance = async (req, res, next) => {
    try {
        const { studentId, classId } = req.body;

        await AttendanceService.revokeAttendance({
            studentId,
            classId
        });

        // Revert booking status to 'reserved' if exists
        const startOfDay = new Date();
        startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date();
        endOfDay.setHours(23,59,59,999);

        await ClassBooking.findOneAndUpdate(
            {
                studentId,
                classId,
                date: { $gte: startOfDay, $lte: endOfDay },
                status: 'confirmed'
            },
            { status: 'reserved' }
        );

        res.status(200).json({
            success: true,
            message: 'Presença removida com sucesso'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Erro ao remover presença'
        });
    }
};

/**
 * @desc    Get Class Attendance
 * @route   GET /api/v1/teachers/classes/:classId/attendance
 * @access  Public
 */
exports.getClassAttendance = async (req, res, next) => {
    try {
        const { classId } = req.params;

        // Define today's range (Normalized)
        const startOfDay = AttendanceService.getNormalizedToday();
        const endOfDay = AttendanceService.getNormalizedEndOfDay();

        const attendance = await Attendance.find({
            classId: classId,
            date: { $gte: startOfDay, $lte: endOfDay }
        }).populate('studentId', 'name belt degree paymentStatus');

        // Fetch active reservations for today
        const bookings = await ClassBooking.find({
            classId: classId,
            date: { $gte: startOfDay, $lte: endOfDay },
            status: 'reserved'
        }).populate('studentId', 'name belt degree paymentStatus');

        // Merge lists
        const mixedList = [
            ...attendance.map(a => {
                const obj = a.toObject();
                return {
                    ...obj,
                    checkInTime: obj.date, // Frontend expects checkInTime
                    status: 'confirmed' // Normalize status for frontend
                };
            }), 
            ...bookings.map(b => ({
                ...b.toObject(),
                isReservation: true,
                checkInTime: null // Explicit null to indicate pending
            }))
        ];

        res.status(200).json({
            success: true,
            count: mixedList.length,
            data: mixedList
        });
    } catch (error) {
        next(error);
    }
};
