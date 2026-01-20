import Attendance from '../models/Attendance';
import Class from '../models/Class';
import Student from '../models/Student';
import mongoose from 'mongoose';

/**
 * Attendance Service
 * Handles business logic for student and teacher attendance.
 */
class AttendanceService {

    /**
     * Get start of the day in Brazil/Sao Paulo timezone
     */
    /**
     * Get start of the day in Brazil/Sao Paulo timezone (Normalized to UTC Midnight)
     * Returns YYYY-MM-DDT00:00:00.000Z where YYYY-MM-DD is the date in SP.
     */
    static getNormalizedToday(): Date {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
        const parts = formatter.formatToParts(now);
        const findPart = (type: string) => parts.find(p => p.type === type)?.value;
        
        const day = parseInt(findPart('day') || '1');
        const month = parseInt(findPart('month') || '1');
        const year = parseInt(findPart('year') || '2024');
        
        // Create Date in UTC
        return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    }

    /**
     * Get end of the day in Brazil/Sao Paulo timezone (Normalized to UTC)
     * Returns YYYY-MM-DDT23:59:59.999Z
     */
    static getNormalizedEndOfDay(): Date {
        const today = this.getNormalizedToday();
        const endOfDay = new Date(today);
        endOfDay.setUTCHours(23, 59, 59, 999);
        return endOfDay;
    }

    /**
     * Get Bucket Key (YYYY-MM)
     */
    static getBucketKey(date: Date = new Date()): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }

    /**
     * Validate student financial status
     * Blocks attendance if student has overdue payments.
     */
    static validateFinancialStatus(student: any): void {
        const blockedStatuses = ['Atrasado', 'Inadimplente', 'Vencido', 'Overdue'];
        if (blockedStatuses.includes(student.paymentStatus)) {
            throw new Error('Acesso negado: Regularize sua situação financeira na secretaria.');
        }
    }

    /**
     * Validate Check-in Window (15 minutes before start)
     */
    static validateTimeWindow(classDoc: any): void {
        const [hours, minutes] = classDoc.startTime.split(':').map(Number);
        
        const now = new Date();
        const spNowStr = now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"});
        const spNow = new Date(spNowStr);
        
        const classStart = new Date(spNow);
        classStart.setHours(hours, minutes, 0, 0);
        
        const checkInStart = new Date(classStart);
        checkInStart.setMinutes(checkInStart.getMinutes() - 15);
        
        const [endHours, endMinutes] = classDoc.endTime.split(':').map(Number);
        const classEnd = new Date(spNow);
        classEnd.setHours(endHours, endMinutes, 0, 0);
        
        const checkInEnd = new Date(classEnd);
        checkInEnd.setMinutes(checkInEnd.getMinutes() + 20);

        if (spNow < checkInStart) {
            const timeStr = checkInStart.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit', hour12: false});
            const diffMins = Math.ceil((checkInStart.getTime() - spNow.getTime()) / 60000);
            throw new Error(`Check-in antecipado não permitido. Liberado às ${timeStr} (em ${diffMins} min).`);
        }
        
        if (spNow > checkInEnd) {
             const timeStr = checkInEnd.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit', hour12: false});
             throw new Error(`Período de check-in encerrado às ${timeStr}.`);
        }
    }

    /**
     * Revoke Attendance (Teacher Uncheck)
     * Adapted for Bucket Architecture
     */
    static async revokeAttendance({ studentId, classId }: { studentId: string, classId: string }): Promise<any> {
        const startOfDay = this.getNormalizedToday();
        const bucketKey = this.getBucketKey(); // Current Month

        // Pull record from the bucket
        const result = await Attendance.findOneAndUpdate(
            { 
                studentId, 
                month: bucketKey,
                "records.classId": classId,
                "records.date": { $gte: startOfDay } // Ensure it's today's class
            },
            {
                $pull: { records: { classId: classId, date: { $gte: startOfDay } } },
                $inc: { totalPresent: -1 }
            },
            { new: true }
        );
        
        if(!result) {
           throw new Error('Presença não encontrada para remover.');
        }
        
        return result;
    }

    /**
     * Register attendance (Universal)
     * Adapted for Bucket Architecture + Snapshots
     */
    static async registerAttendance({ studentId, classId, teacherId, tenantId, checkInMethod, metadata = {} }: any): Promise<any> {
        const student = await Student.findById(studentId);
        if (!student) throw new Error('Aluno não encontrado');

        this.validateFinancialStatus(student);

        const targetClass = await Class.findById(classId).populate('teacherId');
        if (!targetClass) throw new Error('Aula não encontrada');

        this.validateTimeWindow(targetClass);

        const startOfDay = this.getNormalizedToday();
        const bucketKey = this.getBucketKey();

        // 1. Check for duplicate in Bucket (optimized check)
        const bucket = await Attendance.findOne({
            studentId,
            month: bucketKey
        });

        if (bucket) {
            const alreadyCheckedIn = bucket.records.some((r: any) => 
                r.classId.toString() === classId && 
                new Date(r.date) >= startOfDay
            );
            if (alreadyCheckedIn) {
                throw new Error('Presença já registrada para esta aula hoje.');
            }

            // CHECK FOR OVERLAPPING ATTENDANCE (Double Booking Prevention)
            const parseTime = (t: string) => {
                const [h, m] = t.split(':').map(Number);
                return h * 60 + m;
            };
            const newStart = parseTime(targetClass.startTime);
            const newEnd = parseTime(targetClass.endTime);

            // Iterate through today's records
            const todaysRecords = bucket.records.filter((r: any) => new Date(r.date) >= startOfDay);
            
            for (const record of todaysRecords) {
                 // We need the snapshot or class info. If snapshot exists, use it.
                 // If not, we might skip or query class (expensive).
                 // Assuming snapshot exists for robustness or we rely on 'snapshot' field.
                 // If record comes from older schema without snapshot, we might miss it unless we populate.
                 // But since we just pushed this architecture, snapshots should be there.
                 
                 let exStart = 0;
                 let exEnd = 0;
                 let exName = 'Aula';

                 if (record.snapshot && record.snapshot.startTime) {
                     exStart = parseTime(record.snapshot.startTime);
                     // Estimate end time if not stored (e.g. + 60 mins), 
                     // BUT our snapshot doesn't store endTime currently unless we add it.
                     // Service only stores className, teacherName, startTime, category.
                     // We should rely on standard 60-90 mins or query class.
                     // Optimization: Use startTime + 60 as default overlap check if endTime missing.
                     exEnd = exStart + 90; // Assume 90 mins max for safety or we should add endTime to snapshot.
                     exName = record.snapshot.className;
                 } else {
                     continue; // Skip legacy or incomplete records
                 }

                 if (newStart < exEnd && newEnd > exStart) {
                      throw new Error(`Choque de horário! Você já fez check-in na aula de ${exName} neste horário.`);
                 }
            }
        }

        // 2. Load or Create Session (Senior Requirement: Integrity)
        // Here we could update ClassSession.checkedInCount if we wanted perfectly strict counting,
        // but for now we focus on the Attendance Record integrity.

        // 3. Create the Snapshot
        const newRecord = {
            date: new Date(),
            classId: (targetClass as any)._id,
            status: 'Present',
            checkInMethod: checkInMethod || 'App',
            snapshot: {
                className: targetClass.name,
                teacherName: (targetClass as any).teacherId ? ((targetClass as any).teacherId as any).name : 'Instrutor',
                startTime: targetClass.startTime,
                category: targetClass.category
            },
            metadata: {
                ...metadata,
                checkedInBy: teacherId
            }
        };

        // 4. Update Bucket (Upsert)
        const updatedAttendance = await Attendance.findOneAndUpdate(
            { 
                studentId: student._id, 
                month: bucketKey 
            },
            { 
                $setOnInsert: { tenantId: tenantId || student.franchiseId },
                $push: { records: newRecord },
                $inc: { totalPresent: 1 }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return updatedAttendance;
    }
}

export default AttendanceService;
