const ClassBooking = require('../models/ClassBooking');
const Class = require('../models/Class');

const bookingController = {
    /**
     * Create a new reservation
     * POST /api/bookings
     * Body: { classId, date, studentId, franchiseId }
     */
    createBooking: async (req, res) => {
        try {
            const { classId, date, studentId, franchiseId } = req.body;

            // 1. Verify Class and Capacity
            const classDoc = await Class.findById(classId);
            if (!classDoc) {
                return res.status(404).json({ success: false, message: 'Aula não encontrada' });
            }

            // Normalize date to start of day (UTC) to avoid timezone/time mismatch issues
            const encodingDate = new Date(date);
            encodingDate.setUTCHours(0, 0, 0, 0);

            // Calculate end of day (UTC) for range query
            const endOfDay = new Date(encodingDate);
            endOfDay.setUTCHours(23, 59, 59, 999);

            // 2. Count current bookings (Active only)
            // Use range for safety, though countDocuments is less critical if findOne works
            const activeBookingsCount = await ClassBooking.countDocuments({
                classId,
                date: { $gte: encodingDate, $lte: endOfDay },
                status: { $in: ['reserved', 'confirmed'] }
            });

            if (activeBookingsCount >= classDoc.capacity) {
                return res.status(400).json({ success: false, message: 'Vagas esgotadas para esta aula.' });
            }

            // 3. Check if booking already exists (including cancelled)
            // Using Range Query to be absolutely sure we find it regardless of ms/timezone drift
            console.log(`[CreateBooking] Checking existing in range: ${encodingDate.toISOString()} - ${endOfDay.toISOString()}`);
            
            const existingBooking = await ClassBooking.findOne({
                classId,
                studentId,
                date: { $gte: encodingDate, $lte: endOfDay }
            });

            if (existingBooking) {
                console.log(`[CreateBooking] Found existing booking: ${existingBooking._id} | Status: ${existingBooking.status}`);
                if (existingBooking.status === 'cancelled') {
                    // Reactivate cancelled booking
                    existingBooking.status = 'reserved';
                    await existingBooking.save();
                    console.log(`[CreateBooking] Reactivated booking ${existingBooking._id}`);
                    return res.status(200).json({ success: true, data: existingBooking, message: 'Reserva reativada com sucesso.' });
                } else {
                    // Already reserved/confirmed
                    console.log(`[CreateBooking] Status is not cancelled. Blocked.`);
                    return res.status(400).json({ 
                        success: false, 
                        message: `Você já reservou esta aula. (Status atual: ${existingBooking.status})` 
                    });
                }
            } else {
                console.log(`[CreateBooking] No existing booking found. Proceeding to create.`);
            }

            // 4. Create New Booking
            const newBooking = await ClassBooking.create({
                franchiseId,
                classId,
                studentId,
                date: encodingDate,
                status: 'reserved'
            });

            res.status(201).json({ success: true, data: newBooking });

        } catch (error) {
            // Check for unique index violation (already reserved)
            if (error.code === 11000) {
                console.warn(`[CreateBooking] Duplicate Key Error (11000). Data:`, error.keyValue);
                return res.status(400).json({ 
                    success: false, 
                    message: 'Erro: O sistema detectou uma duplicidade no banco de dados. (Erro 11000)' 
                });
            }
            console.error('Create booking error:', error);
            res.status(500).json({ success: false, message: 'Erro ao realizar reserva.' });
        }
    },

    /**
     * Cancel a reservation
     * DELETE /api/bookings/:id
     */
    cancelBooking: async (req, res) => {
        try {
            const { id } = req.params;
            
            // We can hard delete or soft delete. 
            // The plan suggests changing status to 'cancelled' to free up the slot.
            const booking = await ClassBooking.findById(id);
            if (!booking) {
                return res.status(404).json({ success: false, message: 'Reserva não encontrada.' });
            }

            booking.status = 'cancelled';
            await booking.save();

            res.status(200).json({ success: true, message: 'Reserva cancelada com sucesso.' });
        } catch (error) {
            console.error('Cancel booking error:', error);
            res.status(500).json({ success: false, message: 'Erro ao cancelar reserva.' });
        }
    },

    /**
     * List bookings for a specific class instance
     * GET /api/bookings/list?classId=...&date=...
     */
    listBookings: async (req, res) => {
        try {
            const { classId, date } = req.query;
            if (!classId || !date) {
                return res.status(400).json({ success: false, message: 'Parâmetros classId e date obrigatórios' });
            }

            const encodingDate = new Date(date);
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
     * Get active bookings for a student (to show in "My Schedule" if needed, or to check status)
     * GET /api/bookings/student/:studentId
     */
    getStudentBookings: async (req, res) => {
         try {
            const { studentId } = req.params;
            // Normalize today to start of day to include classes earlier today
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const bookings = await ClassBooking.find({
                studentId,
                status: { $ne: 'cancelled' }, // Return all active bookings (reserved or confirmed)
                date: { $gte: todayStart } // Future + Today's past classes
            }).populate('classId');
            
            res.status(200).json({ success: true, data: bookings });
         } catch (error) {
             res.status(500).json({ success: false, message: error.message });
         }
    }
};

module.exports = bookingController;
