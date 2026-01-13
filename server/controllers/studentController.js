const Student = require('../models/Student');
const Franchise = require('../models/Franchise');
const Attendance = require('../models/Attendance');
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
            const student = await Student.findById(req.params.id);
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
            const student = await Student.findById(studentId);

            if (!student) return res.status(404).json({ message: 'Aluno não encontrado' });

            // Calculate attendance stats
            // For MVP, we count ALL attendance since last graduation
            const attendanceCount = await Attendance.countDocuments({
                studentId: student._id,
                date: { $gte: student.lastGraduationDate || student.createdAt }
            });

            // Mocking next belt requirements (simpler than the admin logic for now)
            const classesRequired = 30; // Default placeholder
            const progress = Math.min(100, Math.floor((attendanceCount / classesRequired) * 100));

            // Fetch recent history
            const history = await Attendance.find({ studentId: student._id })
                .sort({ date: -1 })
                .limit(5)
                .populate('classId', 'name');

            res.status(200).json({
                success: true,
                data: {
                    name: student.name,
                    belt: student.belt,
                    degree: student.degree,
                    photo: student.photoUrl || null,
                    stats: {
                        classesAttended: attendanceCount,
                        classesRequired: classesRequired,
                        progressPercent: progress,
                        streak: 3 // Mock streak for now
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
            const { studentId, location, classId } = req.body; // { lat, lng }

            const student = await Student.findById(studentId);
            if (!student) return res.status(404).json({ message: 'Aluno não encontrado' });

            // 1. GEOFENCING VALIDATION
            const franchise = await Franchise.findById(student.franchiseId);
            if (!franchise) return res.status(404).json({ message: 'Unidade não encontrada' });

            if (location && location.lat && location.lng) {
                // GeoJSON coordinates are [lng, lat]
                const unitLng = franchise.location.coordinates[0];
                const unitLat = franchise.location.coordinates[1];

                const distance = calculateDistance(location.lat, location.lng, unitLat, unitLng);
                const MAX_DISTANCE_KM = 0.2; // 200 meters

                if (distance > MAX_DISTANCE_KM) {
                    return res.status(403).json({
                        success: false,
                        message: `Você está muito longe da academia (${(distance * 1000).toFixed(0)}m). Vá para o tatame!`
                    });
                }
            } else {
                return res.status(400).json({ success: false, message: 'Localização necessária para o check-in.' });
            }

            // 2. DUPLICATE CHECK
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            // If a classId is provided, we check if they already checked into THAT class today
            const duplicateFilter = {
                studentId: studentId,
                date: { $gte: startOfDay }
            };
            if (classId) {
                duplicateFilter.classId = classId;
            }

            const existing = await Attendance.findOne(duplicateFilter);

            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: classId ? 'Você já bateu o ponto nesta aula!' : 'Você já fez check-in hoje! Bom treino. oss'
                });
            }

            // 3. REGISTER ATTENDANCE
            const finalClassId = classId || new mongoose.Types.ObjectId();

            const newAttendance = await Attendance.create({
                tenantId: student.franchiseId,
                studentId: student._id,
                classId: finalClassId,
                date: new Date(),
                status: 'Present',
                checkInMethod: 'App',
                metadata: {
                    distance: calculateDistance(location.lat, location.lng, franchise.location.coordinates[1], franchise.location.coordinates[0]),
                    isClassSpecific: !!classId
                }
            });

            res.status(200).json({
                success: true,
                message: 'Check-in realizado com sucesso! Bom treino.',
                data: newAttendance
            });

        } catch (error) {
            console.error('Check-in error:', error);
            res.status(500).json({ success: false, message: 'Erro ao fazer check-in' });
        }
    },

    /**
     * Get Franchise Leaderboard (Monthly)
     */
    getLeaderboard: async (req, res) => {
        try {
            const { franchiseId } = req.params;

            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const ranking = await Attendance.aggregate([
                {
                    $match: {
                        tenantId: new mongoose.Types.ObjectId(franchiseId),
                        date: { $gte: startOfMonth }
                    }
                },
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
                        photo: "$studentInfo.photoUrl"
                    }
                }
            ]);

            res.status(200).json({ success: true, data: ranking });
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
