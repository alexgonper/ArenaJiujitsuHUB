import Attendance from '../models/Attendance';
import Class from '../models/Class';
import Student from '../models/Student';
import mongoose from 'mongoose';
import GraduationService from './graduationService';
import ClassBooking from '../models/ClassBooking';

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
     * Get Query Window (Start of Day UTC to End of SP Day in UTC + Buffer)
     * Effectively 00:00 UTC to 04:00 UTC next day to cover late night classes.
     */
    static getDailyQueryWindow(): { start: Date, end: Date } {
        const start = this.getNormalizedToday();
        const end = new Date(start);
        end.setUTCHours(27, 59, 59, 999); // 03:59 AM next day
        return { start, end };
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
        
        // AGGREGATION LOOKUP STRATEGY
        // Since `find` (Schema-based) is failing to locate the record that `aggregate` (Raw) sees,
        // we use aggregation to pinpoint the Document ID and the Record itself.
        const pipeline = [
            { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
            { $unwind: "$records" },
            { $match: { 
                "records.classId": new mongoose.Types.ObjectId(classId),
                "records.date": { $gte: startOfDay }
            }},
            { $limit: 1 } // We only need one match to identify the bucket
        ];

        const matches = await Attendance.aggregate(pipeline);

        if (!matches || matches.length === 0) {
             console.warn(`Revoke failed: Aggregation could not find record. Student: ${studentId}, Class: ${classId}, Date >= ${startOfDay.toISOString()}`);
             // Dump all records for this class from aggregation to see what IS there
             const debug = await Attendance.aggregate([
                { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
                { $unwind: "$records" },
                { $match: { "records.classId": new mongoose.Types.ObjectId(classId) } }
             ]);
             console.log('DEBUG: History for this class:', debug.map(d => d.records.date));
             throw new Error('Presença não encontrada para remover.');
        }

        const match = matches[0];
        const bucketId = match._id;
        const recordDate = match.records.date;
        // Use Record ID if available, otherwise strict match
        const removalQuery = match.records._id 
            ? { _id: match.records._id } 
            : { classId: new mongoose.Types.ObjectId(classId), date: recordDate };

        console.log(`Revoke: Found record in bucket ${bucketId}. Removing record via Pull.`);

        // Pull the specific record from the specific bucket
        const result = await Attendance.updateOne(
            { _id: bucketId },
            { 
                $pull: { records: removalQuery },
                $inc: { totalPresent: -1 }
            }
        );

        // SYNC: Remove Booking if exists to free up the spot
        try {
            const queryWindow = this.getDailyQueryWindow();
            await ClassBooking.findOneAndUpdate({
                studentId,
                classId,
                date: { $gte: queryWindow.start, $lte: queryWindow.end }
            }, { 
                status: 'reserved',
                checkInTime: null
            });
        } catch (err) {
            console.error('Error syncing revoke to booking:', err);
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
                 let exStart = 0;
                 let exEnd = 0;
                 let exName = 'Aula';

                 if (record.snapshot && record.snapshot.startTime) {
                     exStart = parseTime(record.snapshot.startTime);
                     exName = record.snapshot.className;
                     
                     if (record.snapshot.endTime) {
                         exEnd = parseTime(record.snapshot.endTime);
                     } else {
                         // Fallback: Fetch Class to get real duration (avoid guessing 90min)
                         try {
                             const oldClass = await Class.findById(record.classId);
                             if (oldClass && oldClass.endTime) {
                                 exEnd = parseTime(oldClass.endTime);
                             } else {
                                 exEnd = exStart + 60; // Conservative fallback (60 vs 90) to reduce false positives
                             }
                         } catch (err) {
                             exEnd = exStart + 60;
                         }
                     }
                 } else {
                     continue; 
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
                endTime: targetClass.endTime,
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

        // 5. SYNC: Ensure ClassBooking reflects this presence (Consumes a spot)
        try {
            // Use Normalized Date for the booking to ensure consistency if possible, 
            // but range query covers timestamps. Let's use the Class Date logic if we can,
            // otherwise use current date.
            const bookingDate = new Date();
            
            await ClassBooking.findOneAndUpdate(
                { 
                    classId: classId,
                    studentId: studentId,
                    date: { 
                        $gte: new Date(new Date().setHours(0,0,0,0)), 
                        $lte: new Date(new Date().setHours(23,59,59,999)) 
                    }
                },
                {
                    franchiseId: tenantId || student.franchiseId,
                    classId: classId,
                    studentId: studentId,
                    date: bookingDate,
                    status: 'confirmed'
                },
                { upsert: true, new: true }
            );
        } catch (err) {
            console.error('Error syncing attendance to booking:', err);
            // Don't fail the request, just log
        }

        // 6. Trigger Graduation Check (Post-attendance event)
        // Fire and forget to not block the response
        GraduationService.checkAndNotifyEligibility(studentId).catch(err => console.error('Eligibility check error:', err));

        return updatedAttendance;
    }
}

export default AttendanceService;
