const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Attendance = require('../models/Attendance');
const ClassBooking = require('../models/ClassBooking');

const classController = {
    /**
     * Get Schedule for a specific franchise and date
     */
    getSchedule: async (req, res) => {
        try {
            const { franchiseId } = req.params;
            // If view=week, we return ALL active classes for this franchise
            const { view, date } = req.query;
            let query = { franchiseId, active: true };

            if (view !== 'week') {
                // Default behavior: filter by specific day
                const targetDate = date ? new Date(date) : new Date();
                const dayOfWeek = targetDate.getDay();
                query.dayOfWeek = dayOfWeek;
            }

            // Find classes
            const classes = await Class.find(query)
                .populate('teacherId', 'name')
                .sort({ dayOfWeek: 1, startTime: 1 });

            // In a real scenario, we would also check current occupations for each class
            // For MVP, we'll just return the schedule

            // Process classes to add booking info
            const processedClasses = await Promise.all(classes.map(async (cls) => {
                const clsObj = cls.toObject();

                // Calculate next occurrence date
                // Simplest approach: "Upcoming Occurrence" logic
                // If today is same day and time passed, maybe next week?
                // For MVP, assuming "this week" view or "next upcoming".
                
                const now = new Date();
                const todayDay = now.getDay();
                let dayDiff = cls.dayOfWeek - todayDay;
                if (dayDiff < 0) dayDiff += 7; // next week
                // BUT if dayDiff is 0 and time passed?
                // ignoring time specific complexity for now, assuming date provided in query or just nearest day.
                
                // Use provided date from query if specific view, else calc next occurrence
                let targetDate = new Date();
                if (date) {
                    targetDate = new Date(date);
                } else {
                    targetDate.setDate(now.getDate() + dayDiff);
                }
                targetDate.setUTCHours(0,0,0,0); // Normalize to start of day (UTC) for accurate matching

                // Count active bookings (reserved + confirmed)
                const bookedCount = await ClassBooking.countDocuments({
                    classId: cls._id,
                    date: { 
                        $gte: targetDate, 
                        $lt: new Date(targetDate.getTime() + 24*60*60*1000) 
                    },
                    status: { $in: ['reserved', 'confirmed'] }
                });

                // Check if requested student booked
                let isBookedByMe = false;
                let myBooking = null;
                if (req.query.studentId) {
                    myBooking = await ClassBooking.findOne({
                        classId: cls._id, 
                        studentId: req.query.studentId,
                        date: { 
                            $gte: targetDate, 
                            $lt: new Date(targetDate.getTime() + 24*60*60*1000) 
                        },
                        status: { $in: ['reserved', 'confirmed'] }
                    });
                    if (myBooking) {
                        isBookedByMe = true;
                    }
                }
                
                clsObj.bookingInfo = {};
                if (isBookedByMe && myBooking) {
                     clsObj.bookingInfo.myBookingId = myBooking._id;
                }

                clsObj.bookingInfo.isBookedByMe = isBookedByMe;
                clsObj.bookingInfo.availableSlots = Math.max(0, cls.capacity - bookedCount);
                clsObj.bookingInfo.totalBooked = bookedCount;
                clsObj.bookingInfo.capacity = cls.capacity;
                clsObj.bookingInfo.nextDate = targetDate;

                return clsObj;
            }));

            res.status(200).json({
                success: true,
                data: processedClasses
            });
        } catch (error) {
            console.error('Error fetching schedule:', error);
            res.status(500).json({ success: false, message: 'Erro ao carregar agenda' });
        }
    },

    /**
     * Create a class (Admin)
     */
    createClass: async (req, res) => {
        try {
            const newClass = await Class.create(req.body);
            res.status(201).json({ success: true, data: newClass });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    },

    /**
     * Delete a class
     */
    deleteClass: async (req, res) => {
        try {
            const { id } = req.params;
            await Class.findByIdAndDelete(id);
            res.status(200).json({ success: true, message: 'Aula removida com sucesso' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao remover aula' });
        }
    },

    /**
     * Seed initial classes for testing (Development)
     */
    seedClasses: async (req, res) => {
        try {
            const { franchiseId } = req.params;
            console.log('Seeding classes for franchise:', franchiseId);

            const teachers = await Teacher.find({ franchiseId });
            console.log('Teachers found:', teachers.length);

            if (teachers.length === 0) {
                return res.status(400).json({ message: 'Necessário ter professores cadastrados primeiro.' });
            }

            const teacherId = teachers[0]._id;

            // Simple seed
            const demoClasses = [
                { franchiseId, teacherId, name: 'Fundamentos', dayOfWeek: 1, startTime: '07:00', endTime: '08:00', category: 'Fundamentals' },
                { franchiseId, teacherId, name: 'Técnica & Sparring', dayOfWeek: 1, startTime: '19:00', endTime: '20:30', category: 'BJJ' },
                { franchiseId, teacherId, name: 'No-Gi Submission', dayOfWeek: 2, startTime: '19:30', endTime: '20:30', category: 'No-Gi' },
                { franchiseId, teacherId, name: 'Kids - Arena Team', dayOfWeek: 1, startTime: '18:00', endTime: '19:00', category: 'Kids' }
            ];

            // Add for all days for testing
            const fullWeekStyles = ['BJJ', 'No-Gi', 'Wrestling'];
            const allDaysNodes = [];
            for (let i = 0; i < 7; i++) {
                allDaysNodes.push({
                    franchiseId,
                    teacherId,
                    name: `Treino Arena - ${fullWeekStyles[i % 3]}`,
                    dayOfWeek: i,
                    startTime: '19:30',
                    endTime: '21:00',
                    category: fullWeekStyles[i % 3]
                });
            }

            await Class.insertMany(allDaysNodes);
            res.status(201).json({ success: true, message: 'Classes de teste criadas!' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = classController;
