import { Request, Response } from 'express';
import Student from '../models/Student';
import Teacher from '../models/Teacher';

const authController = {
    /**
     * Teacher Login
     * Simple authentication by email
     */
    teacherLogin: async (req: Request, res: Response) => {
        try {
            const { email } = req.body;
            console.log(`🔑 Teacher Login Attempt: Email=${email}`);

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Informe seu email'
                });
            }

            const teacher = await Teacher.findOne({ email: email.toLowerCase().trim(), active: true })
                                       .populate('franchiseId');

            if (!teacher) {
                return res.status(404).json({
                    success: false,
                    message: 'Professor não encontrado. Verifique seu email.'
                });
            }

            // Since we don't have passwords in this MVP seed, we trust the email.
            // In production, we would verify password here.

            res.status(200).json({
                success: true,
                message: 'Login realizado com sucesso',
                data: teacher,
                token: 'mock-jwt-token-teacher' 
            });

        } catch (error) {
            console.error('Teacher login error:', error);
            res.status(500).json({ success: false, message: 'Erro ao fazer login.' });
        }
    },

    /**
     * Global Student Login Check (for Mobile App entry)
     * Finds student by email without needing franchiseId first
     */
    studentLoginCheck: async (req: Request, res: Response) => {
        try {
            const { email } = req.body;
            
            if (!email) {
                return res.status(400).json({ success: false, message: 'Email obrigatório' });
            }

            // Find first student with this email (assuming unique or picking first active)
            const student = await Student.findOne({ email: email.toLowerCase().trim() })
                                       .populate('franchiseId');

            if (!student) {
                return res.status(404).json({ success: false, message: 'Email não encontrado no sistema.' });
            }

            res.status(200).json({
                success: true,
                student: {
                    _id: student._id,
                    name: student.name,
                    belt: student.belt,
                    degree: student.degree,
                    franchiseId: student.franchiseId
                }
            });

        } catch (error) {
            console.error('Student check error:', error);
            res.status(500).json({ success: false, message: 'Erro ao verificar email.' });
        }
    },

    /**
     * Student Login
     * Simple authentication by email/phone + franchiseId
     */
    studentLogin: async (req: Request, res: Response) => {
        try {
            const { email, phone, franchiseId } = req.body;
            console.log(`🔑 Login Attempt: Email=${email}, Franchise=${franchiseId}`);

            if (!franchiseId) {
                return res.status(400).json({
                    success: false,
                    message: 'Selecione sua academia'
                });
            }

            if (!email && !phone) {
                return res.status(400).json({
                    success: false,
                    message: 'Informe seu email ou telefone'
                });
            }

            const query: any = { franchiseId };
            if (email) {
                query.email = email.toLowerCase().trim();
            } else if (phone) {
                const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
                query.phone = { $regex: normalizedPhone, $options: 'i' };
            }

            const student = await Student.findOne(query).populate('franchiseId');

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: 'Aluno não encontrado. Verifique seus dados.'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Login realizado com sucesso',
                data: {
                    id: student._id,
                    name: student.name,
                    email: student.email,
                    phone: student.phone,
                    belt: student.belt,
                    degree: student.degree,
                    paymentStatus: student.paymentStatus,
                    franchise: {
                        id: (student.franchiseId as any)._id,
                        name: (student.franchiseId as any).name,
                        address: (student.franchiseId as any).address,
                        phone: (student.franchiseId as any).phone
                    }
                }
            });

        } catch (error) {
            console.error('Student login error:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao fazer login. Tente novamente.'
            });
        }
    }
};

export default authController;
