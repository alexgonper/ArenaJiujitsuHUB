import Student from '../models/Student';
import GraduationRule from '../models/GraduationRule';
import Attendance from '../models/Attendance';
import NotificationService from './notificationService';

class GraduationService {
    /**
     * Check if a student is eligible for their next graduation
     */
    static async checkStudentEligibility(studentId: string) {
        const student = await Student.findById(studentId);
        if (!student) return null;

        const rule = await GraduationRule.findOne({
            fromBelt: student.belt,
            fromDegree: student.degree
        });

        if (!rule) return null;

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
        const minAgeRequired = rule.minAge || 0;

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

        const isEligible = attendanceCount >= rule.classesRequired && 
                           daysPassed >= totalDaysRequired &&
                           studentAge >= minAgeRequired;

        return {
            isEligible,
            attendanceCount,
            classesRequired: rule.classesRequired,
            daysPassed,
            totalDaysRequired,
            nextBelt: rule.toBelt,
            nextDegree: rule.toDegree
        };
    }

    /**
     * Check eligibility and send notification if recently eligible
     */
    static async checkAndNotifyEligibility(studentId: string) {
        const eligibility = await this.checkStudentEligibility(studentId);
        if (eligibility && eligibility.isEligible) {
            // Check if already notified recently to avoid duplicates
            // For now, we just notify. notificationService can be smarter later.
            await NotificationService.notifyEligibility(studentId, eligibility.nextBelt, eligibility.nextDegree);
        }
    }
}

export default GraduationService;
