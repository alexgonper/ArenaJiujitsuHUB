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
            
            // IBJJF Age: Current Year - Birth Year
            const currentYear = new Date().getFullYear();
            const birthYear = new Date(student.birthDate).getFullYear();
            const studentAge = currentYear - birthYear;
            const minAgeRequired = rule.minAge || 0;

            // Strict IBJJF Time Reinforcement:
            // If we are changing BELTS (e.g. Blue -> Purple), we must check TOTAL time in belt, 
            // not just since last stripe.
            let daysPassed = 0;
            let totalDaysRequired = rule.minDaysRequired;

            if (rule.toBelt !== student.belt) {
                // Belt Jump! Find the date student first got the current belt.
                const firstBeltGraduation = student.graduationHistory
                    .filter(g => g.belt === student.belt)
                    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
                
                const initialBeltDate = firstBeltGraduation ? firstBeltGraduation.date : student.registrationDate;
                daysPassed = Math.floor((new Date().getTime() - initialBeltDate.getTime()) / (1000 * 60 * 60 * 24));
                
                // For belt jumps, the rule's minDaysRequired should be the cumulative minimum if it's the 4->Next step.
                // In our seeded rules, we set the jump step to also have the step time.
                // Since IBJJF provides TOTAL time (e.g. 2 years for blue), 
                // and we split it into 5 steps, the check above (initialBeltDate) gives the total time.
                // We need to compare it against the TOTAL required for that belt level.
                
                const IBJJF_TOTAL_MIN_DAYS: Record<string, number> = {
                    'Azul': 730,    // 2 Years
                    'Roxa': 547,    // 1.5 Years
                    'Marrom': 365,  // 1 Year
                    'Preta': 1095,  // 3 Years for 1st degree
                    'Coral': 2555,  // 7 Years for 8th
                    'Vermelha': 3650 // 10 Years for 9th
                };

                const totalMinNeeded = IBJJF_TOTAL_MIN_DAYS[student.belt] || rule.minDaysRequired;
                totalDaysRequired = totalMinNeeded;
            } else {
                // Stripe promotion (Degree only)
                daysPassed = Math.floor((new Date().getTime() - lastGradDate.getTime()) / (1000 * 60 * 60 * 24));
            }

            const isEligible = attendanceCount >= rule.classesRequired && 
                               daysPassed >= totalDaysRequired &&
                               studentAge >= minAgeRequired;

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
                        daysRequired: totalDaysRequired,
                        daysPassed: daysPassed,
                        minAge: rule.minAge || 0,
                        currentAge: studentAge
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

            // --- STRICT IBJJF VALIDATION BEFORE PROMOTION ---
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
                { $count: 'totalClasses' }
            ]);
            const attendanceCount = attendanceStats.length > 0 ? attendanceStats[0].totalClasses : 0;

            const currentYear = new Date().getFullYear();
            const birthYear = new Date(student.birthDate).getFullYear();
            const studentAge = currentYear - birthYear;

            let daysPassed = 0;
            let totalDaysRequired = rule.minDaysRequired;

            if (rule.toBelt !== student.belt) {
                const firstBeltGraduation = student.graduationHistory
                    .filter(g => g.belt === student.belt)
                    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
                const initialBeltDate = firstBeltGraduation ? firstBeltGraduation.date : student.registrationDate;
                daysPassed = Math.floor((new Date().getTime() - initialBeltDate.getTime()) / (1000 * 60 * 60 * 24));
                
                const IBJJF_TOTAL_MIN_DAYS: Record<string, number> = {
                    'Azul': 730, 'Roxa': 547, 'Marrom': 365, 'Preta': 1095, 'Coral': 2555, 'Vermelha': 3650
                };
                totalDaysRequired = IBJJF_TOTAL_MIN_DAYS[student.belt] || rule.minDaysRequired;
            } else {
                daysPassed = Math.floor((new Date().getTime() - lastGradDate.getTime()) / (1000 * 60 * 60 * 24));
            }

            if (attendanceCount < rule.classesRequired || daysPassed < totalDaysRequired || studentAge < rule.minAge) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Aluno não cumpre os requisitos mínimos da IBJJF para esta graduação',
                    details: {
                        classes: `${attendanceCount}/${rule.classesRequired}`,
                        days: `${daysPassed}/${totalDaysRequired}`,
                        age: `${studentAge}/${rule.minAge}`
                    }
                });
            }
            // --- END VALIDATION ---
            
            console.log(`[PROMOTION] Promoting student ${studentId} (${student.name})`);
            console.log(`[PROMOTION] Current state: ${student.belt} ${student.degree}`);
            console.log(`[PROMOTION] Target state: ${rule.toBelt} ${rule.toDegree}`);

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

            console.log(`[PROMOTION] Saving student...`);
            const savedStudent = await student.save();
            console.log(`[PROMOTION] Student saved. New state: ${savedStudent.belt} ${savedStudent.degree}`);

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
                        { $count: 'totalClasses' }
                    ]);

                    const attendanceCount = attendanceStats.length > 0 ? attendanceStats[0].totalClasses : 0;
                    
                    const currentYear = new Date().getFullYear();
                    const birthYear = new Date(student.birthDate).getFullYear();
                    const studentAge = currentYear - birthYear;

                    let daysPassed = 0;
                    let totalDaysRequired = rule.minDaysRequired;

                    if (rule.toBelt !== student.belt) {
                        const firstBeltGraduation = student.graduationHistory
                            .filter(g => g.belt === student.belt)
                            .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
                        const initialBeltDate = firstBeltGraduation ? firstBeltGraduation.date : student.registrationDate;
                        daysPassed = Math.floor((new Date().getTime() - initialBeltDate.getTime()) / (1000 * 60 * 60 * 24));
                        
                        const IBJJF_TOTAL_MIN_DAYS: Record<string, number> = {
                            'Azul': 730, 'Roxa': 547, 'Marrom': 365, 'Preta': 1095, 'Coral': 2555, 'Vermelha': 3650
                        };
                        totalDaysRequired = IBJJF_TOTAL_MIN_DAYS[student.belt] || rule.minDaysRequired;
                    } else {
                        daysPassed = Math.floor((new Date().getTime() - lastGradDate.getTime()) / (1000 * 60 * 60 * 24));
                    }

                    if (attendanceCount >= rule.classesRequired && 
                        daysPassed >= totalDaysRequired &&
                        studentAge >= rule.minAge) {
                        
                        // Debug log for Rafael or specific student if needed, or just all eligible
                        console.log(`[ELIGIBILITY] Student ${student.name} is eligible:`);
                        console.log(`  Current: ${student.belt} ${student.degree}`);
                        console.log(`  Target: ${rule.toBelt} ${rule.toDegree}`);
                        console.log(`  Attended: ${attendanceCount} (Req: ${rule.classesRequired})`);
                        console.log(`  Days: ${daysPassed} (Req: ${totalDaysRequired})`);

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
