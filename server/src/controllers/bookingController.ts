import { Request, Response } from 'express';
import mongoose from 'mongoose';
import ClassBooking from '../models/ClassBooking';
import Class from '../models/Class';

const bookingController = {
    /**
     * Create a new reservation
     */
    /**
     * Create a new reservation
     * Uses ClassSession for optimistic concurrency control (Pro Recommendation)
     */
    createBooking: async (req: Request, res: Response) => {
        try {
            const { classId, date, studentId, franchiseId } = req.body;

            const classDoc = await Class.findById(classId);
            if (!classDoc) {
                return res.status(404).json({ success: false, message: 'Aula não encontrada' });
            }

            const encodingDate = new Date(date);
            encodingDate.setUTCHours(0, 0, 0, 0);

            const endOfDay = new Date(encodingDate);
            endOfDay.setUTCHours(23, 59, 59, 999);

            // 0. CHECK FOR OVERLAPPING BOOKINGS
            // Get all active bookings for this student on this day
            const sameDayBookings = await ClassBooking.find({
                studentId,
                date: { $gte: encodingDate, $lte: endOfDay },
                status: { $in: ['reserved', 'confirmed'] },
                classId: { $ne: classId } // Exclude current class (handled by duplicate check later)
            }).populate('classId');

            // Parse new class times (HH:MM) to minutes
            const parseTime = (t: string) => {
                const [h, m] = t.split(':').map(Number);
                return h * 60 + m;
            };
            const newStart = parseTime(classDoc.startTime);
            const newEnd = parseTime(classDoc.endTime);

            for (const booking of sameDayBookings) {
                const existingClass = booking.classId as any; // Populated
                if (!existingClass.startTime || !existingClass.endTime) continue;

                const exStart = parseTime(existingClass.startTime);
                const exEnd = parseTime(existingClass.endTime);

                // Check overlap: (StartA < EndB) and (EndA > StartB)
                if (newStart < exEnd && newEnd > exStart) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `Choque de horário! Você já possui reserva na aula de ${existingClass.name} (${existingClass.startTime} - ${existingClass.endTime}).`
                    });
                }
            }

            // 1. Ensure ClassSession exists (Atomic Upsert)
            // Using dynamic import to avoid circular dep issues if any
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
                    // Reactivate: Try to increment capacity first
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

            // 3. Reserve Slot (Atomic Increment with Capacity Check)
            // We only increment if bookedCount < capacity
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
                // COMPENSATION: Undo the slot reservation if booking creation failed
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
            const { classId, date } = req.query;
            if (!classId || !date) {
                return res.status(400).json({ success: false, message: 'Parâmetros classId e date obrigatórios' });
            }

            const encodingDate = new Date(date as string);
            encodingDate.setUTCHours(0, 0, 0, 0);

            const endOfDay = new Date(encodingDate);
            endOfDay.setUTCHours(23, 59, 59, 999);

            const bookings = await ClassBooking.find({
                classId,
                date: { $gte: encodingDate, $lte: endOfDay },
                status: { $in: ['reserved', 'confirmed'] } 
            }).populate('studentId', 'name belt degree paymentStatus photo');

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
            
            // Use AttendanceService to get correct timezone-aware midnight (UTC)
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
