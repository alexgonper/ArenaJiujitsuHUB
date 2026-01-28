import { Request, Response } from 'express';
import mongoose from 'mongoose';
import ClassBooking from '../models/ClassBooking';
import Class from '../models/Class';

const bookingController = {
    /**
     * Create a new reservation
     */
    createBooking: async (req: Request, res: Response) => {
        try {
            const { classId, date, studentId, franchiseId } = req.body;

            const classDoc = await Class.findById(classId);
            if (!classDoc) {
                return res.status(404).json({ success: false, message: 'Aula não encontrada' });
            }

            // DYNAMIC IMPORT SERVICE FOR TIMEZONE LOGIC
            const AttendanceService = (await import('../services/attendanceService')).default;
            
            // Normalize Date similar to AttendanceService:
            // 1. If date is provided (e.g. from frontend), ensure we interpret it in SP context
            // 2. OR fallback to "Today" normalized if date is close to now
            
            let encodingDate;
            if(date) {
                const d = new Date(date);
                // Se a data já chegar como Meia-Noite UTC (00:00:00.000Z), ela já veio normalizada do nosso sistema.
                // Não precisamos recalcular o fuso de SP, pois isso faria ela "voltar" para as 21h do dia anterior.
                if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0) {
                    encodingDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
                } else {
                    const formatter = new Intl.DateTimeFormat('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                        year: 'numeric', month: 'numeric', day: 'numeric'
                    });
                    const parts = formatter.formatToParts(d);
                    const findPart = (type: string) => parts.find(p => p.type === type)?.value;
                    const spDay = parseInt(findPart('day') || '1');
                    const spMonth = parseInt(findPart('month') || '1');
                    const spYear = parseInt(findPart('year') || '2024');
                    encodingDate = new Date(Date.UTC(spYear, spMonth - 1, spDay, 0, 0, 0, 0));
                }
            } else {
                encodingDate = AttendanceService.getNormalizedToday();
            }

            const endOfDay = new Date(encodingDate);
            endOfDay.setUTCHours(23, 59, 59, 999);

            // 0. CHECK FOR OVERLAPPING BOOKINGS
            const sameDayBookings = await ClassBooking.find({
                studentId,
                date: { $gte: encodingDate, $lte: endOfDay },
                status: { $in: ['reserved', 'confirmed'] },
                classId: { $ne: classId } 
            }).populate('classId');

            const parseTime = (t: string) => {
                const [h, m] = t.split(':').map(Number);
                return h * 60 + m;
            };
            const newStart = parseTime(classDoc.startTime);
            const newEnd = parseTime(classDoc.endTime);

            for (const booking of sameDayBookings) {
                const existingClass = booking.classId as any; 
                if (!existingClass.startTime || !existingClass.endTime) continue;

                const exStart = parseTime(existingClass.startTime);
                const exEnd = parseTime(existingClass.endTime);

                if (newStart < exEnd && newEnd > exStart) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `Choque de horário! Você já possui reserva na aula de ${existingClass.name} (${existingClass.startTime} - ${existingClass.endTime}).`
                    });
                }
            }

            // 1. Ensure ClassSession exists (Atomic Upsert)
            const ClassSessionModel = (await import('../models/ClassSession')).default;
            
            let classSession = await ClassSessionModel.findOneAndUpdate(
                { classId, date: encodingDate },
                {
                    $setOnInsert: {
                        classId,
                        franchiseId,
                        date: encodingDate,
                        startTime: classDoc.startTime,
                        endTime: classDoc.endTime,
                        capacity: classDoc.capacity,
                        bookedCount: 0,
                        status: 'scheduled'
                    }
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            // 2. Double-check for existing booking for this student
            const existingBooking = await ClassBooking.findOne({
                classId,
                studentId,
                date: { $gte: encodingDate, $lte: endOfDay }
            });

            if (existingBooking) {
                if (existingBooking.status === 'cancelled') {
                    // Reactivate
                    const updatedSession = await ClassSessionModel.findOneAndUpdate(
                        { 
                            _id: classSession._id, 
                            $expr: { $lt: ["$bookedCount", "$capacity"] } 
                        },
                        { $inc: { bookedCount: 1 } },
                        { new: true }
                    );

                    if (!updatedSession) {
                        return res.status(400).json({ success: false, message: 'Vagas esgotadas para esta aula.' });
                    }

                    existingBooking.status = 'reserved';
                    await existingBooking.save();
                    
                    return res.status(200).json({ success: true, data: existingBooking, message: 'Reserva reativada com sucesso.' });
                } else {
                    return res.status(400).json({ 
                        success: false, 
                        message: `Você já reservou esta aula.` 
                    });
                }
            }

            // 3. Reserve Slot
            const sessionWithSlot = await ClassSessionModel.findOneAndUpdate(
                { 
                    _id: classSession._id, 
                    $expr: { $lt: ["$bookedCount", "$capacity"] } 
                },
                { $inc: { bookedCount: 1 } },
                { new: true }
            );

            if (!sessionWithSlot) {
                return res.status(400).json({ success: false, message: 'Vagas esgotadas para esta aula.' });
            }

            // 4. Create Booking
            try {
                const newBooking = await ClassBooking.create({
                    franchiseId,
                    classId,
                    studentId,
                    date: encodingDate,
                    status: 'reserved'
                });

                res.status(201).json({ success: true, data: newBooking });
            } catch (createError: any) {
                await ClassSessionModel.findOneAndUpdate(
                    { _id: classSession._id },
                    { $inc: { bookedCount: -1 } }
                );

                if (createError.code === 11000) {
                     return res.status(400).json({ success: false, message: 'Você já possui uma reserva para esta aula.' });
                }
                throw createError;
            }

        } catch (error: any) {
            console.error('Create booking error:', error);
            res.status(500).json({ success: false, message: 'Erro ao realizar reserva.' });
        }
    },

    /**
     * Cancel a reservation
     */
    cancelBooking: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            
            const booking = await ClassBooking.findById(id);
            if (!booking) {
                return res.status(404).json({ success: false, message: 'Reserva não encontrada.' });
            }

            if (booking.status === 'cancelled') {
                 return res.status(400).json({ success: false, message: 'Reserva já está cancelada.' });
            }

            // 1. Mark as cancelled
            booking.status = 'cancelled';
            await booking.save();

            // 2. Return the slot (Decrement)
            // Use same normalization for safety, though booking.date should be correct now
            const encodingDate = new Date(booking.date);
            encodingDate.setUTCHours(0, 0, 0, 0);

            const ClassSessionModel = (await import('../models/ClassSession')).default;
            await ClassSessionModel.findOneAndUpdate(
                { classId: booking.classId, date: encodingDate },
                { $inc: { bookedCount: -1 } }
            );

            res.status(200).json({ success: true, message: 'Reserva cancelada com sucesso.' });
        } catch (error) {
            console.error('Cancel booking error:', error);
            res.status(500).json({ success: false, message: 'Erro ao cancelar reserva.' });
        }
    },

    /**
     * List bookings for a specific class instance
     */
    listBookings: async (req: Request, res: Response) => {
        try {
            const { classId } = req.query;
            if (!classId) {
                return res.status(400).json({ success: false, message: 'Parâmetro classId obrigatório' });
            }

            // RECURRING MODEL UPDATE:
            // DEBUG LOGS
            console.log(`[listBookings] Looking for bookings of classId: ${classId}`);
            
            const bookings = await ClassBooking.find({
                classId,
                // date: { $gte: encodingDate, $lte: endOfDay }, // Removed date filter
                status: { $in: ['reserved', 'confirmed'] } 
            }).populate('studentId', 'name belt degree paymentStatus photo');

            console.log(`[listBookings] Found ${bookings.length} bookings.`);
            if (bookings.length === 0) {
                 // FAIL-SAFE: If no bookings found by ID, maybe frontend has old ID of a duplicate?
                 // Try finding active class with same semantics (Name + Day + Time)
                 const originalClass = await Class.findById(classId);
                 if (originalClass) {
                     console.log(`[listBookings] Zero bookings. Checking for semantic duplicates of: ${originalClass.name}`);
                     const semanticMatches = await Class.find({
                         name: originalClass.name,
                         dayOfWeek: originalClass.dayOfWeek,
                         startTime: originalClass.startTime,
                         _id: { $ne: classId }
                     });
                     
                     if (semanticMatches.length > 0) {
                         const altIds = semanticMatches.map(c => c._id);
                         console.log(`[listBookings] Found alternatives: ${altIds}`);
                         const altBookings = await ClassBooking.find({
                             classId: { $in: altIds },
                             status: { $in: ['reserved', 'confirmed'] }
                         }).populate('studentId', 'name belt degree paymentStatus photo');
                         
                         if (altBookings.length > 0) {
                             console.log(`[listBookings] Returning ${altBookings.length} bookings from alternative IDs.`);
                             return res.status(200).json({ success: true, data: altBookings });
                         }
                     }
                 }
            }

            res.status(200).json({ success: true, data: bookings });
        } catch (error) {
            console.error('List bookings error:', error);
            res.status(500).json({ success: false, message: 'Erro ao listar reservas.' });
        }
    },
    
    /**
     * Get active bookings for a student
     */
    getStudentBookings: async (req: Request, res: Response) => {
         try {
            const { studentId } = req.params;
            
            const AttendanceService = (await import('../services/attendanceService')).default;
            const todayStart = AttendanceService.getNormalizedToday();

            const bookings = await ClassBooking.find({
                studentId,
                status: { $ne: 'cancelled' },
                date: { $gte: todayStart }
            }).populate('classId');
            
            res.status(200).json({ success: true, data: bookings });
         } catch (error: any) {
             res.status(500).json({ success: false, message: error.message });
         }
    }
};

export default bookingController;
