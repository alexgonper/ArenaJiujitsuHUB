const Student = require('../models/Student');
const Franchise = require('../models/Franchise');

const authController = {
    /**
     * Student Login
     * Simple authentication by email/phone + franchiseId
     * No password required for MVP (trust-based)
     */
    studentLogin: async (req, res) => {
        try {
            const { email, phone, franchiseId } = req.body;

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

            // Build query
            const query = { franchiseId };
            if (email) {
                query.email = email.toLowerCase().trim();
            } else if (phone) {
                // Normalize phone (remove spaces, dashes, parentheses)
                const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
                query.phone = { $regex: normalizedPhone, $options: 'i' };
            }

            // Find student
            const student = await Student.findOne(query).populate('franchiseId');

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: 'Aluno não encontrado. Verifique seus dados.'
                });
            }

            // Return student data (excluding sensitive fields if any)
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
                        id: student.franchiseId._id,
                        name: student.franchiseId.name,
                        address: student.franchiseId.address,
                        phone: student.franchiseId.phone
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

module.exports = authController;
