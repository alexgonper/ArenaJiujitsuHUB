const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const Student = require('../models/Student');
const mongoose = require('mongoose');

/**
 * Attendance Service
 * Handles business logic for student and teacher attendance.
 */
class AttendanceService {

    /**
     * Get start of the day in Brazil/Sao Paulo timezone
     */
    static getNormalizedToday() {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
        const parts = formatter.formatToParts(now);
        const day = parseInt(parts.find(p => p.type === 'day').value);
        const month = parseInt(parts.find(p => p.type === 'month').value);
        const year = parseInt(parts.find(p => p.type === 'year').value);
        
        return new Date(year, month - 1, day, 0, 0, 0, 0);
    }

    /**
     * Get end of the day in Brazil/Sao Paulo timezone
     */
    static getNormalizedEndOfDay() {
        const today = this.getNormalizedToday();
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        return endOfDay;
    }

    /**
     * Validate student financial status
     * Blocks attendance if student has overdue payments.
     */
    static validateFinancialStatus(student) {
        const blockedStatuses = ['Atrasado', 'Inadimplente', 'Vencido', 'Overdue'];
        if (blockedStatuses.includes(student.paymentStatus)) {
            throw new Error('Acesso negado: Regularize sua situação financeira na secretaria.');
        }
    }

    /**
     * Register attendance (Universal)
     * Handles Point 1 (Capacity), Point 2 (Duplicity), Point 4 (Financial)
     */
    static async registerAttendance({ studentId, classId, teacherId, tenantId, checkInMethod, metadata = {} }) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const student = await Student.findById(studentId).session(session);
            if (!student) throw new Error('Aluno não encontrado');

            // 1. Point 4: Financial Validation
            this.validateFinancialStatus(student);

            const targetClass = await Class.findById(classId).session(session);
            if (!targetClass) throw new Error('Aula não encontrada');

            // 2. Point 3: Timezone Normalized Dates
            const startOfDay = this.getNormalizedToday();
            const endOfDay = this.getNormalizedEndOfDay();

            // 3. Point 2: Duplicity Check (Atomic within transaction)
            const existing = await Attendance.findOne({
                studentId,
                classId,
                date: { $gte: startOfDay, $lte: endOfDay }
            }).session(session);

            if (existing) {
                throw new Error('Presença já registrada para esta aula hoje.');
            }

            // 4. Point 1: Atomic Capacity Check
            // We count within the transaction to avoid race conditions
            const currentCount = await Attendance.countDocuments({
                classId,
                date: { $gte: startOfDay, $lte: endOfDay }
            }).session(session);

            if (currentCount >= targetClass.capacity) {
                throw new Error(`Aula lotada (${currentCount}/${targetClass.capacity}).`);
            }

            // 5. Register Attendance
            const attendance = await Attendance.create([{
                tenantId: tenantId || student.franchiseId,
                studentId: student._id,
                classId: targetClass._id,
                checkedInBy: teacherId || null,
                date: new Date(), // Actual wall clock time
                status: 'Present',
                checkInMethod: checkInMethod || 'App',
                metadata: {
                    ...metadata,
                    timezone: 'America/Sao_Paulo',
                    normalizedDate: startOfDay
                }
            }], { session });

            await session.commitTransaction();
            return attendance[0];

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}

module.exports = AttendanceService;
