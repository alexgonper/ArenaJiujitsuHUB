import { Request, Response } from 'express';
import Student from '../models/Student';

const authController = {
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
