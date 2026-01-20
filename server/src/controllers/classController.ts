import { Request, Response } from 'express';
import Class from '../models/Class';
import Teacher from '../models/Teacher';
import ClassBooking from '../models/ClassBooking';

const classController = {
    /**
     * Get Schedule for a specific franchise and date
     */
    getSchedule: async (req: Request, res: Response) => {
        try {
            const { franchiseId } = req.params;
            const { view, date, studentId } = req.query;
            let query: any = { franchiseId, active: true };

            if (view !== 'week') {
                const targetDate = date ? new Date(date as string) : new Date();
                const dayOfWeek = targetDate.getDay();
                query.dayOfWeek = dayOfWeek;
            }

            const classes = await Class.find(query)
                .populate('teacherId', 'name')
                .sort({ dayOfWeek: 1, startTime: 1 });

            const processedClasses = await Promise.all(classes.map(async (cls) => {
                const clsObj = (cls as any).toObject();

                const now = new Date();
                const todayDay = now.getDay();
                let dayDiff = cls.dayOfWeek - todayDay;
                if (dayDiff < 0) dayDiff += 7;
                
                let targetDate = new Date();
                if (date) {
                    targetDate = new Date(date as string);
                } else if (view === 'week' && req.query.startDate) {
                     // Respect the requested week's start date
                     targetDate = new Date(req.query.startDate as string);
                     // Fix: Use UTC Date methods to avoid local timezone shift
                     targetDate.setUTCDate(targetDate.getUTCDate() + cls.dayOfWeek);
                } else {
                    targetDate.setDate(now.getDate() + dayDiff);
                }
                targetDate.setUTCHours(0,0,0,0);

                const bookedCount = await ClassBooking.countDocuments({
                    classId: cls._id,
                    date: { 
                        $gte: targetDate, 
                        $lt: new Date(targetDate.getTime() + 24*60*60*1000) 
                    },
                    status: { $in: ['reserved', 'confirmed'] }
                });

                let isBookedByMe = false;
                let myBooking = null;
                if (studentId) {
                    myBooking = await ClassBooking.findOne({
                        classId: cls._id, 
                        studentId: studentId as string,
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
                     clsObj.bookingInfo.myBookingId = (myBooking as any)._id;
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
    createClass: async (req: Request, res: Response) => {
        try {
            const newClass = await Class.create(req.body);
            res.status(201).json({ success: true, data: newClass });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    },

    /**
     * Delete a class
     */
    deleteClass: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await Class.findByIdAndDelete(id);
            res.status(200).json({ success: true, message: 'Aula removida com sucesso' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao remover aula' });
        }
    },

    /**
     * Update a class
     */
    updateClass: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const updatedClass = await Class.findByIdAndUpdate(id, req.body, { new: true });
            if (!updatedClass) {
                return res.status(404).json({ success: false, message: 'Aula não encontrada' });
            }
            res.status(200).json({ success: true, data: updatedClass });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    },

    /**
     * Seed initial classes for testing (Development)
     */
    seedClasses: async (req: Request, res: Response) => {
        try {
            const { franchiseId } = req.params;
            console.log('Seeding classes for franchise:', franchiseId);

            const teachers = await Teacher.find({ franchiseId });
            console.log('Teachers found:', teachers.length);

            if (teachers.length === 0) {
                return res.status(400).json({ message: 'Necessário ter professores cadastrados primeiro.' });
            }

            const teacherId = (teachers[0] as any)._id;

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
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

export default classController;
