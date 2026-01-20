import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Teacher from '../models/Teacher';
import Franchise from '../models/Franchise';
import Class from '../models/Class';
import Student from '../models/Student';
import Attendance from '../models/Attendance';
import ClassBooking from '../models/ClassBooking';
import ClassSession from '../models/ClassSession';
import AttendanceService from '../services/attendanceService';

/**
 * @desc    Get all teachers or filter by franchise
 * @route   GET /api/v1/teachers
 * @access  Public
 */
export const getTeachers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { franchiseId, belt, search } = req.query;

        let query: any = {};

        if (franchiseId) query.franchiseId = franchiseId;
        if (belt) query.belt = belt;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } }
            ];
        }

        const teachers = await Teacher.find(query)
            .populate('franchiseId', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: teachers.length,
            data: teachers
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single teacher
 * @route   GET /api/v1/teachers/:id
 * @access  Public
 */
export const getTeacher = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const teacher = await Teacher.findById(req.params.id)
            .populate('franchiseId', 'name owner address');

        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: 'Professor não encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: teacher
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new teacher
 * @route   POST /api/v1/teachers
 * @access  Public
 */
export const createTeacher = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const franchise = await Franchise.findById(req.body.franchiseId);
        if (!franchise) {
            return res.status(404).json({
                success: false,
                error: 'Academia não encontrada'
            });
        }

        const teacher = await Teacher.create(req.body);

        await Franchise.findByIdAndUpdate(req.body.franchiseId, {
            $inc: { teachers: 1 }
        });

        res.status(201).json({
            success: true,
            data: teacher
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update teacher
 */
export const updateTeacher = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let teacher = await Teacher.findById(req.params.id);

        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: 'Professor não encontrado'
            });
        }

        teacher = await Teacher.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('franchiseId');

        res.status(200).json({
            success: true,
            data: teacher
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete teacher
 */
export const deleteTeacher = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const teacher = await Teacher.findById(req.params.id);

        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: 'Professor não encontrado'
            });
        }

        await teacher.deleteOne();

        await Franchise.findByIdAndUpdate(teacher.franchiseId, {
            $inc: { teachers: -1 }
        });

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Teacher Login
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'E-mail é obrigatório'
            });
        }

        const teacher = await Teacher.findOne({ email, active: true }).populate('franchiseId');

        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: 'Professor não encontrado ou inativo'
            });
        }

        res.status(200).json({
            success: true,
            data: teacher
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get Teacher Dashboard Stats and Agenda
 */
export const getDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const teacher = await Teacher.findById(req.params.id).populate('franchiseId');

        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: 'Professor não encontrado'
            });
        }

        const normalizedNow = AttendanceService.getNormalizedToday();
        const startOfDay = normalizedNow;
        const endOfDay = AttendanceService.getNormalizedEndOfDay();
        
        const today = normalizedNow.getDay();
        const classes = await Class.find({
            teacherId: teacher._id,
            dayOfWeek: today,
            active: true
        }).sort({ startTime: 1 });

        // Get sessions for today to sum counts
        const sessionsToday = await ClassSession.find({
            teacherId: teacher._id,
            date: { $gte: startOfDay, $lte: endOfDay }
        });
        const attendanceToday = sessionsToday.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);

        const weekStart = new Date(normalizedNow);
        weekStart.setDate(weekStart.getDate() - (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1)); // Start on Monday
        weekStart.setHours(0,0,0,0);

        // Get sessions for the week
        const sessionsThisWeek = await ClassSession.find({
            teacherId: teacher._id,
            date: { $gte: weekStart, $lte: endOfDay }
        });
        const weekTotal = sessionsThisWeek.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
        const weekBooked = sessionsThisWeek.reduce((sum, s) => sum + (s.bookedCount || 0), 0);
        const weekRate = weekBooked > 0 ? Math.round((weekTotal / weekBooked) * 100) : 0;

        // Calculate unique students this week (Using Bucket Pattern)
        // Find all class IDs for this teacher
        const teacherClasses = await Class.find({ teacherId: teacher._id });
        const teacherClassIds = teacherClasses.map(c => c._id);

        const uniqueStudentsInWeek = await Attendance.aggregate([
            { 
                $match: { 
                    tenantId: teacher.franchiseId,
                    "records.classId": { $in: teacherClassIds },
                    "records.date": { $gte: weekStart }
                } 
            },
            { $unwind: "$records" },
            { 
                $match: { 
                    "records.classId": { $in: teacherClassIds },
                    "records.date": { $gte: weekStart }
                } 
            },
            { $group: { _id: "$studentId" } },
            { $count: "total" }
        ]);

        const studentCount = uniqueStudentsInWeek.length > 0 ? uniqueStudentsInWeek[0].total : 0;

        // Recent Attendance - using aggregate for bucket pattern
        const recentAttendanceAgg = await Attendance.aggregate([
            { 
                $match: { 
                    tenantId: teacher.franchiseId,
                    "records.classId": { $in: teacherClassIds }
                } 
            },
            { $unwind: "$records" },
            { 
                $match: { 
                    "records.classId": { $in: teacherClassIds }
                } 
            },
            { $sort: { "records.date": -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "students",
                    localField: "studentId",
                    foreignField: "_id",
                    as: "studentInfo"
                }
            },
            { $unwind: "$studentInfo" },
            {
                $project: {
                    studentId: {
                        _id: "$studentInfo._id",
                        name: "$studentInfo.name"
                    },
                    date: "$records.date",
                    snapshot: "$records.snapshot",
                    status: "$records.status"
                }
            }
        ]);

        const franchise = await Franchise.findById(teacher.franchiseId);

        // Streak logic using ClassSession (more reliable)
        let streak = 0;
        let checkDate = new Date(normalizedNow);
        
        // If today has attendance, consider it the start of the streak
        if (attendanceToday > 0) {
            streak = 1;
        }
        
        checkDate.setDate(checkDate.getDate() - 1);
        
        for(let i=0; i<30; i++) {
            const dayStart = new Date(checkDate);
            dayStart.setHours(0,0,0,0);
            const dayEnd = new Date(checkDate);
            dayEnd.setHours(23,59,59,999);
            
            const hasHadClass = await ClassSession.exists({
                teacherId: teacher._id,
                date: { $gte: dayStart, $lte: dayEnd },
                checkedInCount: { $gt: 0 }
            });
            
            if(hasHadClass) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                // Check if it's a weekend or day with no classes scheduled 
                // (Advanced: streaks usually only count work days, but let's keep it simple)
                break; 
            }
        }

        res.status(200).json({
            success: true,
            data: {
                teacher,
                franchise,
                agenda: classes,
                stats: {
                    totalStudents: studentCount, // Unique students this week
                    attendanceToday: attendanceToday,
                    weekTotal: weekTotal, // Total attendances this week
                    weekRate: weekRate, // Presence rate this week
                    streak: streak
                },
                recentAttendance: recentAttendanceAgg
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get Students for Attendance check
 */
export const getStudentsForAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: 'Professor não encontrado'
            });
        }

        const { scope } = req.query;
        let query: any = { franchiseId: teacher.franchiseId };

        if (scope === 'my') {
            const teacherClasses = await Class.find({ teacherId: teacher._id });
            const teacherClassIds = teacherClasses.map(c => c._id);

            const studentIdsWithBookings = await ClassBooking.distinct('studentId', {
                classId: { $in: teacherClassIds },
                status: { $in: ['reserved', 'confirmed'] }
            });

            const studentIdsWithAttendance = await Attendance.distinct('studentId', {
                checkedInBy: teacher._id
            });

            const allMyStudentIds = [...new Set([...studentIdsWithBookings, ...studentIdsWithAttendance])];
            
            query._id = { $in: allMyStudentIds };
        }

        const students = await Student.find(query).select('name belt degree paymentStatus phone gender birthDate');

        res.status(200).json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Mark Student Attendance
 */
export const markAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { studentId, classId, teacherId, franchiseId } = req.body;

        const attendance = await AttendanceService.registerAttendance({
            studentId,
            classId,
            teacherId,
            tenantId: franchiseId,
            checkInMethod: 'Professor'
        });

        const startOfDay = new Date();
        startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date();
        endOfDay.setHours(23,59,59,999);

        await ClassBooking.findOneAndUpdate(
            {
                studentId,
                classId,
                date: { $gte: startOfDay, $lte: endOfDay },
                status: 'reserved'
            },
            { status: 'confirmed' }
        );

        // Update ClassSession for Dashboard Stats (checkedInCount)
        const sessionDate = new Date();
        sessionDate.setHours(0,0,0,0);
        
        await ClassSession.findOneAndUpdate(
            { 
                classId: classId,
                date: { $gte: startOfDay, $lte: endOfDay }
            },
            { 
                $inc: { checkedInCount: 1 },
                $setOnInsert: { 
                    teacherId,
                    franchiseId,
                    startTime: new Date().toLocaleTimeString(), // Fallback
                    date: new Date() // Fallback
                }
            },
            { upsert: true }
        );

        res.status(201).json({
            success: true,
            data: attendance
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Erro ao registrar presença'
        });
    }
};

/**
 * @desc    Remove/Revoke Attendance
 */
export const removeAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { studentId, classId } = req.body;

        await AttendanceService.revokeAttendance({
            studentId,
            classId
        });

        const startOfDay = new Date();
        startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date();
        endOfDay.setHours(23,59,59,999);

        await ClassBooking.findOneAndUpdate(
            {
                studentId,
                classId,
                date: { $gte: startOfDay, $lte: endOfDay },
                status: 'confirmed'
            },
            { status: 'reserved' }
        );

        // Update ClassSession (Decrement)
        await ClassSession.findOneAndUpdate(
            { 
                classId: classId,
                date: { $gte: AttendanceService.getNormalizedToday(), $lte: AttendanceService.getNormalizedEndOfDay() }
            },
            { $inc: { checkedInCount: -1 } }
        );

        res.status(200).json({
            success: true,
            message: 'Presença removida com sucesso'
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Erro ao remover presença'
        });
    }
};

/**
 * @desc    Get Class Attendance
 */
export const getClassAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { classId } = req.params;

        const startOfDay = AttendanceService.getNormalizedToday();
        const endOfDay = AttendanceService.getNormalizedEndOfDay();

        const attendanceAgg = await Attendance.aggregate([
            { 
                $match: { 
                    "records.classId": new mongoose.Types.ObjectId(classId),
                    "records.date": { $gte: startOfDay, $lte: endOfDay }
                } 
            },
            { $unwind: "$records" },
            { 
                $match: { 
                    "records.classId": new mongoose.Types.ObjectId(classId),
                    "records.date": { $gte: startOfDay, $lte: endOfDay }
                } 
            },
            {
                $lookup: {
                    from: "students",
                    localField: "studentId",
                    foreignField: "_id",
                    as: "studentInfo"
                }
            },
            { $unwind: "$studentInfo" },
            {
                $project: {
                    _id: "$records._id",
                    studentId: {
                        _id: "$studentInfo._id",
                        name: "$studentInfo.name",
                        belt: "$studentInfo.belt",
                        degree: "$studentInfo.degree",
                        paymentStatus: "$studentInfo.paymentStatus",
                        photo: "$studentInfo.photo"
                    },
                    checkInTime: "$records.date",
                    status: { $literal: "confirmed" }
                }
            }
        ]);

        // Debug Log
        console.log(`[getClassAttendance] ClassId: ${classId}`);
        console.log(`[getClassAttendance] Window: ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`);
        console.log(`[getClassAttendance] Confirmed: ${attendanceAgg.length}`);

        const bookings = await ClassBooking.find({
            classId: classId,
            date: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['reserved', 'confirmed'] } // Get ALL bookings to be safe
        }).populate('studentId', 'name belt degree paymentStatus photo');

        console.log(`[getClassAttendance] Bookings Found: ${bookings.length}`);

        // Filter out bookings that are already in attendanceAgg (confirmed) to avoid duplicates
        // We use string comparison of IDs
        const confirmedStudentIds = new Set(attendanceAgg.map(a => a.studentId._id.toString()));

        const validBookings = bookings.filter(b => {
             // 1. Must have a valid student populated
             if(!b.studentId) return false;
             // 2. Must NOT be in the confirmed list already
             // (If a student is in Attendance bucket, we show that record, not the booking record)
             return !confirmedStudentIds.has((b.studentId as any)._id.toString());
        });

        const mixedList = [
            ...attendanceAgg, 
            ...validBookings.map(b => ({
                ...(b as any).toObject(),
                studentId: b.studentId, 
                isReservation: true,
                checkInTime: null,
                status: 'reserved' 
            }))
        ];

        console.log(`[getClassAttendance] Final Mixed List: ${mixedList.length}`);

        res.status(200).json({
            success: true,
            count: mixedList.length,
            data: mixedList
        });
    } catch (error: any) {
        console.error('[getClassAttendance] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar lista de presença'
        });
    }
};
