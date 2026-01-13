const Student = require('../models/Student');
const GraduationRule = require('../models/GraduationRule');
const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');

const graduationController = {
    /**
     * Check student eligibility for graduation
     */
    checkEligibility: async (req, res) => {
        try {
            const { studentId } = req.params;
            const student = await Student.findById(studentId);

            if (!student) {
                return res.status(404).json({ success: false, message: 'Aluno não encontrado' });
            }

            // Find current rule
            const rule = await GraduationRule.findOne({
                fromBelt: student.belt,
                fromDegree: student.degree
            });

            if (!rule) {
                return res.status(404).json({
                    success: false,
                    message: 'Regra de graduação não encontrada para este nível',
                    current: { belt: student.belt, degree: student.degree }
                });
            }

            // Get attendance since last graduation
            const attendanceCount = await Attendance.countDocuments({
                studentId: student._id,
                date: { $gte: student.lastGraduationDate }
            });

            // Calculate time since last graduation
            const daysSinceGraduation = Math.floor((new Date() - student.lastGraduationDate) / (1000 * 60 * 60 * 24));

            const isEligible = attendanceCount >= rule.classesRequired && daysSinceGraduation >= rule.minDaysRequired;

            res.status(200).json({
                success: true,
                data: {
                    student: {
                        name: student.name,
                        belt: student.belt,
                        degree: student.degree
                    },
                    requirements: {
                        classesRequired: rule.classesRequired,
                        classesAttended: attendanceCount,
                        daysRequired: rule.minDaysRequired,
                        daysPassed: daysSinceGraduation
                    },
                    nextLevel: {
                        belt: rule.toBelt,
                        degree: rule.toDegree,
                        examFee: rule.examFee
                    },
                    isEligible
                }
            });

        } catch (error) {
            console.error('Error checking eligibility:', error);
            res.status(500).json({ success: false, message: 'Erro ao verificar elegibilidade' });
        }
    },

    /**
     * Process promotion
     */
    promoteStudent: async (req, res) => {
        try {
            const { studentId, teacherId } = req.body;
            const student = await Student.findById(studentId);

            if (!student) {
                return res.status(404).json({ success: false, message: 'Aluno não encontrado' });
            }

            // Find matching rule
            const rule = await GraduationRule.findOne({
                fromBelt: student.belt,
                fromDegree: student.degree
            });

            if (!rule) {
                return res.status(400).json({ success: false, message: 'Nenhuma regra de graduação encontrada' });
            }

            // Update student
            const oldBelt = student.belt;
            const oldDegree = student.degree;

            student.belt = rule.toBelt;
            student.degree = rule.toDegree;
            student.lastGraduationDate = new Date();

            // Add to history
            student.graduationHistory.push({
                belt: rule.toBelt,
                degree: rule.toDegree,
                date: new Date(),
                promotedBy: teacherId
            });

            await student.save();

            res.status(200).json({
                success: true,
                message: `Aluno graduado para ${student.belt} - ${student.degree}`,
                data: {
                    old: { belt: oldBelt, degree: oldDegree },
                    new: { belt: student.belt, degree: student.degree }
                }
            });

        } catch (error) {
            console.error('Promotion error:', error);
            res.status(500).json({ success: false, message: 'Erro ao processar graduação' });
        }
    },

    /**
     * Get all eligible students for a franchise
     */
    getEligibleInFranchise: async (req, res) => {
        try {
            const { franchiseId } = req.params;
            const students = await Student.find({ franchiseId });

            const results = [];

            for (const student of students) {
                const rule = await GraduationRule.findOne({
                    fromBelt: student.belt,
                    fromDegree: student.degree
                });

                if (rule) {
                    const attendanceCount = await Attendance.countDocuments({
                        studentId: student._id,
                        date: { $gte: student.lastGraduationDate }
                    });

                    const daysSince = Math.floor((new Date() - student.lastGraduationDate) / (1000 * 60 * 60 * 24));

                    if (attendanceCount >= rule.classesRequired && daysSince >= rule.minDaysRequired) {
                        results.push({
                            id: student._id,
                            name: student.name,
                            belt: student.belt,
                            degree: student.degree,
                            attended: attendanceCount,
                            required: rule.classesRequired,
                            current: `${student.belt}${student.degree && student.degree !== 'Nenhum' ? ' - ' + student.degree : ''}`,
                            next: `${rule.toBelt}${rule.toDegree && rule.toDegree !== 'Nenhum' ? ' - ' + rule.toDegree : ''}`
                        });
                    }
                }
            }

            res.status(200).json({
                success: true,
                count: results.length,
                data: results
            });

        } catch (error) {
            console.error('Error fetching eligible students:', error);
            res.status(500).json({ success: false, message: 'Erro ao buscar alunos elegíveis' });
        }
    }
};

module.exports = graduationController;
