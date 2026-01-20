import { Request, Response } from 'express';
import Student from '../models/Student';
import GraduationRule from '../models/GraduationRule';
import Franchise from '../models/Franchise';
import Attendance from '../models/Attendance';

const graduationController = {
    /**
     * Check student eligibility for graduation
     */
    checkEligibility: async (req: Request, res: Response) => {
        try {
            const { studentId } = req.params;
            const student = await Student.findById(studentId);

            if (!student) {
                return res.status(404).json({ success: false, message: 'Aluno não encontrado' });
            }

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

            // Use aggregation to count total classes since last graduation (matching bucketed model)
            const lastGradDate = student.lastGraduationDate || student.registrationDate || new Date(0);
            
            const attendanceStats = await Attendance.aggregate([
                {
                    $match: {
                        studentId: student._id,
                        month: { $gte: lastGradDate.toISOString().substring(0, 7) }
                    }
                },
                { $unwind: '$records' },
                {
                    $match: {
                        'records.date': { $gte: lastGradDate },
                        'records.status': 'Present'
                    }
                },
                {
                    $count: 'totalClasses'
                }
            ]);

            const attendanceCount = attendanceStats.length > 0 ? attendanceStats[0].totalClasses : 0;
            const daysSinceGraduation = Math.floor((new Date().getTime() - lastGradDate.getTime()) / (1000 * 60 * 60 * 24));

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
    promoteStudent: async (req: Request, res: Response) => {
        try {
            const { studentId, teacherId } = req.body;
            const student = await Student.findById(studentId);

            if (!student) {
                return res.status(404).json({ success: false, message: 'Aluno não encontrado' });
            }

            const rule = await GraduationRule.findOne({
                fromBelt: student.belt,
                fromDegree: student.degree
            });

            if (!rule) {
                return res.status(400).json({ success: false, message: 'Nenhuma regra de graduação encontrada' });
            }

            const oldBelt = student.belt;
            const oldDegree = student.degree;

            student.belt = rule.toBelt as any;
            student.degree = rule.toDegree as any;
            student.lastGraduationDate = new Date();

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
    getEligibleInFranchise: async (req: Request, res: Response) => {
        try {
            const { franchiseId } = req.params;

            // Check if franchise exists to prevent false empty results for stale IDs
            const franchise = await Franchise.findById(franchiseId);
            if (!franchise) {
                return res.status(404).json({
                    success: false,
                    error: 'Franchise not found. Session might be stale.'
                });
            }

            const students = await Student.find({ franchiseId });

            const results = [];

            for (const student of students) {
                const rule = await GraduationRule.findOne({
                    fromBelt: student.belt,
                    fromDegree: student.degree
                });

                if (rule) {
                    // Use aggregation to count total classes in records for this student since last graduation
                    const lastGradDate = student.lastGraduationDate || student.registrationDate || new Date(0);
                    
                    const attendanceStats = await Attendance.aggregate([
                        {
                            $match: {
                                studentId: student._id,
                                // Optimization: Only look at months that could possibly contain relevant records
                                month: { $gte: lastGradDate.toISOString().substring(0, 7) }
                            }
                        },
                        { $unwind: '$records' },
                        {
                            $match: {
                                'records.date': { $gte: lastGradDate },
                                'records.status': 'Present'
                            }
                        },
                        {
                            $count: 'totalClasses'
                        }
                    ]);

                    const attendanceCount = attendanceStats.length > 0 ? attendanceStats[0].totalClasses : 0;
                    const daysSince = Math.floor((new Date().getTime() - lastGradDate.getTime()) / (1000 * 60 * 60 * 24));

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

export default graduationController;
