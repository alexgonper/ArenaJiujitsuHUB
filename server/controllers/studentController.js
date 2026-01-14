const Student = require('../models/Student');
const Franchise = require('../models/Franchise');
const Attendance = require('../models/Attendance');
const AttendanceService = require('../services/attendanceService');
const mongoose = require('mongoose');

const studentController = {

    // ==========================================
    // ADMIN / CRUD START
    // ==========================================

    /**
     * Get all students (Admin)
     */
    getAllStudents: async (req, res) => {
        try {
            const { franchiseId } = req.query;
            let query = {};

            if (franchiseId) {
                query.franchiseId = franchiseId;
            }

            const students = await Student.find(query).sort({ name: 1 });

            res.status(200).json({
                success: true,
                count: students.length,
                data: students
            });
        } catch (error) {
            console.error('Error fetching students:', error);
            res.status(500).json({ success: false, message: 'Erro ao buscar alunos' });
        }
    },

    /**
     * Get single student
     */
    getStudentById: async (req, res) => {
        try {
            const student = await Student.findById(req.params.id).populate('graduationHistory.promotedBy', 'name');
            if (!student) {
                return res.status(404).json({ success: false, message: 'Aluno não encontrado' });
            }
            res.status(200).json({ success: true, data: student });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao buscar aluno' });
        }
    },

    /**
     * Create new student
     */
    createStudent: async (req, res) => {
        try {
            const student = await Student.create(req.body);
            res.status(201).json({
                success: true,
                data: student
            });
        } catch (error) {
            console.error('Error creating student:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    },

    /**
     * Update student
     */
    updateStudent: async (req, res) => {
        try {
            const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
                runValidators: true
            });

            if (!student) {
                return res.status(404).json({ success: false, message: 'Aluno não encontrado' });
            }

            res.status(200).json({
                success: true,
                data: student
            });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    },

    /**
     * Delete student
     */
    deleteStudent: async (req, res) => {
        try {
            const student = await Student.findByIdAndDelete(req.params.id);
            if (!student) {
                return res.status(404).json({ success: false, message: 'Aluno não encontrado' });
            }
            res.status(200).json({ success: true, data: {} });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao remover aluno' });
        }
    },

    // ==========================================
    // PORTAL / APP START (PHASE 2)
    // ==========================================

    /**
     * Student Login (Simple Email lookup for MVP)
     */
    login: async (req, res) => {
        try {
            const { email } = req.body;

            // Case insensitive search
            const student = await Student.findOne({
                email: { $regex: new RegExp(`^${email}$`, 'i') }
            });

            if (!student) {
                return res.status(401).json({ success: false, message: 'Aluno não encontrado.' });
            }

            res.status(200).json({
                success: true,
                token: 'mock-jwt-token-' + student._id, // In prod, use real JWT
                student: {
                    id: student._id,
                    name: student.name,
                    franchiseId: student.franchiseId,
                    belt: student.belt,
                    degree: student.degree
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ success: false, message: 'Erro no servidor' });
        }
    },

    /**
     * Get Student Dashboard Profile (Stats + Next Level)
     */
    getDashboard: async (req, res) => {
        try {
            const { studentId } = req.params;
            const student = await Student.findById(studentId).populate('graduationHistory.promotedBy', 'name');

            if (!student) return res.status(404).json({ message: 'Aluno não encontrado' });

            // Normalize today for consistent counting
            const startOfDay = AttendanceService.getNormalizedToday();

            // Calculate attendance stats
            // For MVP, we count ALL attendance since last graduation
            const attendanceCount = await Attendance.countDocuments({
                studentId: student._id,
                date: { $gte: student.lastGraduationDate || student.createdAt }
            });

            // Fetch next belt requirements
            const GraduationRule = require('../models/GraduationRule');
            const rule = await GraduationRule.findOne({
                fromBelt: student.belt,
                fromDegree: student.degree
            });

            const classesRequired = rule ? rule.classesRequired : 30; // Default fallback only if no rule exists
            const progress = Math.min(100, Math.floor((attendanceCount / classesRequired) * 100));

            // Fetch recent history
            const history = await Attendance.find({ studentId: student._id })
                .sort({ date: -1 })
                .limit(5)
                .populate('classId', 'name');

            // Fetch franchise details
            const franchise = await Franchise.findById(student.franchiseId);

            // Calculate streak
            const allAttendance = await Attendance.find({ studentId: student._id })
                .sort({ date: -1 })
                .select('date');

            let streak = 0;
            if (allAttendance.length > 0) {
                const dates = allAttendance.map(a => {
                    const d = new Date(a.date);
                    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
                });
                const uniqueDates = [...new Set(dates)].sort((a, b) => b - a);

                const today = AttendanceService.getNormalizedToday();
                const todayTime = today.getTime();
                const yesterdayTime = todayTime - (24 * 60 * 60 * 1000);

                // Start streak calculation if the last training was today or yesterday
                if (uniqueDates[0] === todayTime || uniqueDates[0] === yesterdayTime) {
                    streak = 1;
                    for (let i = 0; i < uniqueDates.length - 1; i++) {
                        if (uniqueDates[i] - uniqueDates[i + 1] === 24 * 60 * 60 * 1000) {
                            streak++;
                        } else {
                            break;
                        }
                    }
                }
            }

            res.status(200).json({
                success: true,
                data: {
                    profile: {
                        id: student._id,
                        name: student.name,
                        belt: student.belt,
                        degree: student.degree,
                        photo: student.photoUrl || null,
                        graduationHistory: student.graduationHistory // Include history here
                    },
                    franchise: {
                        id: franchise?._id,
                        name: franchise?.name || 'Academia',
                        address: franchise?.address || '',
                        phone: franchise?.phone || '',
                        branding: franchise?.branding || {}
                    },
                    stats: {
                        classesAttended: attendanceCount,
                        classesRequired: classesRequired,
                        progressPercent: progress,
                        streak: streak
                    },
                    payment: {
                        status: student.paymentStatus || 'Paga',
                        amount: student.amount || 0,
                        history: [] // Add real history if needed
                    },
                    history: history,
                    lastCheckIn: history[0] ? history[0].date : null
                }
            });

        } catch (error) {
            console.error('Dashboard error:', error);
            res.status(500).json({ success: false, message: 'Erro ao carregar dados' });
        }
    },

    /**
     * Perform Check-in with Geofencing
     */
    checkIn: async (req, res) => {
        try {
            const { studentId, location, classId } = req.body;

            const student = await Student.findById(studentId);
            if (!student) return res.status(404).json({ success: false, message: 'Aluno não encontrado' });

            // 1. GEOFENCING VALIDATION (Frontend + Backend safety)
            // If classId is NOT present, it's a general check-in (requires proximity)
            if (!classId) {
                const franchise = await Franchise.findById(student.franchiseId);
                if (!franchise) return res.status(404).json({ success: false, message: 'Unidade não encontrada' });

                if (location && location.lat && location.lng) {
                    const unitLng = franchise.location.coordinates[0];
                    const unitLat = franchise.location.coordinates[1];
                    const distance = calculateDistance(location.lat, location.lng, unitLat, unitLng);
                    const MAX_DISTANCE_KM = 0.2; // 200 meters

                    if (distance > MAX_DISTANCE_KM) {
                        return res.status(403).json({
                            success: false,
                            message: `Você está muito longe da academia (${(distance * 1000).toFixed(0)}m).`
                        });
                    }
                } else {
                    return res.status(400).json({ success: false, message: 'Localização necessária para o check-in.' });
                }
            }

            // 2. DELEGATE TO SERVICE (Handles Capacity, Duplicity, Financials and Atomic Transaction)
            const attendance = await AttendanceService.registerAttendance({
                studentId,
                classId: classId || new mongoose.Types.ObjectId(), // If general check-in, create a phantom ID or handle it
                tenantId: student.franchiseId,
                checkInMethod: classId ? 'Booking' : 'App',
                metadata: {
                    location: location
                }
            });

            res.status(200).json({
                success: true,
                message: 'Presença confirmada! Bom treino. oss',
                data: attendance
            });

        } catch (error) {
            console.error('Check-in error:', error);
            res.status(400).json({ 
                success: false, 
                message: error.message || 'Erro ao processar check-in' 
            });
        }
    },

    /**
     * Get Franchise Leaderboard with Period Filter
     * Query params: period = current_month | last_30_days | last_90_days | all_time
     */
    getLeaderboard: async (req, res) => {
        try {
            const { franchiseId } = req.params;
            const { period = 'current_month' } = req.query;

            // Calculate date filter based on period (normalized to SP Timezone)
            let dateFilter = {};
            const now = AttendanceService.getNormalizedToday();

            switch (period) {
                case 'current_month':
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    startOfMonth.setHours(0, 0, 0, 0);
                    dateFilter = { date: { $gte: startOfMonth } };
                    break;

                case 'last_30_days':
                    const last30 = new Date(now);
                    last30.setDate(now.getDate() - 30);
                    last30.setHours(0, 0, 0, 0);
                    dateFilter = { date: { $gte: last30 } };
                    break;

                case 'last_90_days':
                    const last90 = new Date(now);
                    last90.setDate(now.getDate() - 90);
                    last90.setHours(0, 0, 0, 0);
                    dateFilter = { date: { $gte: last90 } };
                    break;

                case 'all_time':
                    // No date filter - all time
                    dateFilter = {};
                    break;

                default:
                    // Default to current month
                    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    defaultStart.setHours(0, 0, 0, 0);
                    dateFilter = { date: { $gte: defaultStart } };
            }

            const matchStage = {
                tenantId: new mongoose.Types.ObjectId(franchiseId),
                ...dateFilter
            };

            const ranking = await Attendance.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: "$studentId",
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: "students",
                        localField: "_id",
                        foreignField: "_id",
                        as: "studentInfo"
                    }
                },
                { $unwind: "$studentInfo" },
                {
                    $project: {
                        count: 1,
                        name: "$studentInfo.name",
                        belt: "$studentInfo.belt",
                        degree: "$studentInfo.degree",
                        photo: "$studentInfo.photoUrl"
                    }
                }
            ]);

            res.status(200).json({ success: true, data: ranking, period });
        } catch (error) {
            console.error('Leaderboard error:', error);
            res.status(500).json({ success: false, message: 'Erro ao carregar ranking' });
        }
    },

    /**
     * Get Student conquista/badges
     */
    getBadges: async (req, res) => {
        try {
            const { studentId } = req.params;
            const totalAttendance = await Attendance.countDocuments({ studentId });

            const badgeDef = [
                { id: 'newbie', name: 'Iniciante', icon: 'fa-seedling', req: 1, desc: 'Primeiro treino batido!' },
                { id: 'regular', name: 'Fiel ao Tatame', icon: 'fa-calendar-check', req: 10, desc: '10 treinos completados.' },
                { id: 'warrior', name: 'Guerreiro Arena', icon: 'fa-fire', req: 50, desc: '50 treinos de suor e raça.' },
                { id: 'samurai', name: 'Samurai', icon: 'fa-khanda', req: 100, desc: '100 treinos: Disciplina de aço.' },
                { id: 'legend', name: 'Lenda do Tatame', icon: 'fa-crown', req: 300, desc: '300 treinos: Referência na academia.' }
            ];

            const badges = badgeDef.map(b => ({
                ...b,
                unlocked: totalAttendance >= b.req,
                progress: Math.min(100, Math.floor((totalAttendance / b.req) * 100))
            }));

            res.status(200).json({ success: true, data: { totalAttendance, badges } });
        } catch (error) {
            res.status(500).json({ success: false });
        }
    }
};

/**
 * Helper: Haversine distance formula (returns KM)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

module.exports = studentController;
