const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Attendance = require('../models/Attendance');

const classController = {
    /**
     * Get Schedule for a specific franchise and date
     */
    getSchedule: async (req, res) => {
        try {
            const { franchiseId } = req.params;
            const { date } = req.query; // e.g., "2026-01-13"

            const targetDate = date ? new Date(date) : new Date();
            const dayOfWeek = targetDate.getDay();

            // Find all active classes for this day
            const classes = await Class.find({
                franchiseId,
                dayOfWeek,
                active: true
            })
                .populate('teacherId', 'name')
                .sort({ startTime: 1 });

            // In a real scenario, we would also check current occupations for each class
            // For MVP, we'll just return the schedule

            res.status(200).json({
                success: true,
                data: classes
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
