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
     * Validate Check-in Window (15 minutes before start)
     */
    static validateTimeWindow(classDoc) {
        // Parse Class Time (Format "HH:MM")
        const [hours, minutes] = classDoc.startTime.split(':').map(Number);
        
        // Get "Now" in Sao Paulo
        // We use string manipulation to guarantee we are parsing the Brazil time correctly independent of server locale
        const now = new Date();
        const spNowStr = now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"});
        const spNow = new Date(spNowStr);
        
        // Construct Class Start Date for Today (using SP components)
        // Note: spNow is a Date object representing the moment in time. 
        // We need to set its HH:MM to the class start HH:MM.
        const classStart = new Date(spNow);
        classStart.setHours(hours, minutes, 0, 0);
        
        // Check-in Start Time (15 min before)
        const checkInStart = new Date(classStart);
        checkInStart.setMinutes(checkInStart.getMinutes() - 15);
        
        // Parse End Time
        const [endHours, endMinutes] = classDoc.endTime.split(':').map(Number);
        const classEnd = new Date(spNow);
        classEnd.setHours(endHours, endMinutes, 0, 0);
        
        // Tolerance after class ends (e.g. 20 mins to wrap up)
        const checkInEnd = new Date(classEnd);
        checkInEnd.setMinutes(checkInEnd.getMinutes() + 20);

        // Validation 1: Too Early
        if (spNow < checkInStart) {
            const timeStr = checkInStart.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit', hour12: false});
            const diffMins = Math.ceil((checkInStart - spNow) / 60000);
            throw new Error(`Check-in antecipado não permitido. Liberado às ${timeStr} (em ${diffMins} min).`);
        }
        
        // Validation 2: Too Late (Class + tolerance ended)
        if (spNow > checkInEnd) {
             const timeStr = checkInEnd.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit', hour12: false});
             throw new Error(`Período de check-in encerrado às ${timeStr}.`);
        }
    }

    /**
     * Revoke Attendance (Teacher Uncheck)
     */
    static async revokeAttendance({ studentId, classId, date }) {
        // Use normalized range to find the record for "today"
        const startOfDay = this.getNormalizedToday();
        const endOfDay = this.getNormalizedEndOfDay();

        const result = await Attendance.findOneAndDelete({
            studentId,
            classId,
            date: { $gte: startOfDay, $lte: endOfDay }
        });
        
        if(!result) {
           throw new Error('Presença não encontrada para remover.');
        }
        
        return result;
    }

    /**
     * Register attendance (Universal)
     * Handles Point 1 (Capacity), Point 2 (Duplicity), Point 4 (Financial)
     */
    static async registerAttendance({ studentId, classId, teacherId, tenantId, checkInMethod, metadata = {} }) {
        try {
            const student = await Student.findById(studentId);
            if (!student) throw new Error('Aluno não encontrado');

            // 1. Point 4: Financial Validation
            this.validateFinancialStatus(student);

            const targetClass = await Class.findById(classId);
            if (!targetClass) throw new Error('Aula não encontrada');

            // 1.1 Time Window Validation
            // Bypass for Manual (Teacher) check-in? 
            // The prompt says: "o aluno e o professor só pode conseguem fazer o checkin a partir de 15 minutos".
            // So we enforce it for everyone.
            this.validateTimeWindow(targetClass);

            // 2. Point 3: Timezone Normalized Dates
            const startOfDay = this.getNormalizedToday();
            const endOfDay = this.getNormalizedEndOfDay();

            // 3. Point 2: Duplicity Check
            const existing = await Attendance.findOne({
                studentId,
                classId,
                date: { $gte: startOfDay, $lte: endOfDay }
            });

            if (existing) {
                // If already present, just return it (Idempotency) or throw?
                // Throwing allows UI to know, but for "Confirm", maybe we just return existing?
                // The UI expects an error for duplicate to show feedback, or we can just swallow it.
                // Let's stick to throwing as per original logic.
                throw new Error('Presença já registrada para esta aula hoje.');
            }

            // 4. Point 1: Capacity Check
            const currentCount = await Attendance.countDocuments({
                classId,
                date: { $gte: startOfDay, $lte: endOfDay }
            });

            if (currentCount >= targetClass.capacity) {
                throw new Error(`Aula lotada (${currentCount}/${targetClass.capacity}).`);
            }

            // 5. Register Attendance
            const attendance = await Attendance.create({
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
            });

            return attendance;

        } catch (error) {
            throw error;
        }
    }
}

module.exports = AttendanceService;
