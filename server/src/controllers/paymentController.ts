import { Request, Response } from 'express';
const MercadoPago = require('mercadopago');
import Payment from '../models/Payment';
import Student from '../models/Student';
import Franchise from '../models/Franchise';

const client = new MercadoPago.MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || 'TEST-00000000-0000-0000-0000-000000000000'
});

const paymentController = {

    /**
     * Create a Checkout Preference
     */
    createPreference: async (req: Request, res: Response) => {
        try {
            const { studentId, description, type, amount } = req.body;
            const franchiseId = req.body.franchiseId || (req as any).user?.franchiseId;

            if (!franchiseId || !studentId || !amount) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            const franchise = await Franchise.findById(franchiseId);
            const student = await Student.findById(studentId);

            if (!franchise || !student) {
                return res.status(404).json({ message: 'Franchise or Student not found' });
            }

            const royaltyPercent = franchise.royaltyPercent || 10;
            const matrixFee = (amount * royaltyPercent) / 100;
            const franchiseIncome = amount - matrixFee;

            const payment = new Payment({
                franchiseId,
                studentId,
                type: type || 'Tuition',
                description: description || `Mensalidade - ${student.name}`,
                amount,
                status: 'pending',
                split: {
                    matrixAmount: matrixFee,
                    franchiseAmount: franchiseIncome,
                    matrixRate: royaltyPercent
                }
            });

            await payment.save();

            const preference = new MercadoPago.Preference(client);

            const preferenceData = {
                body: {
                    items: [
                        {
                            id: payment._id.toString(),
                            title: description || 'Mensalidade Arena Jiu-Jitsu',
                            quantity: 1,
                            unit_price: Number(amount)
                        }
                    ],
                    payer: {
                        name: student.name,
                        email: student.email || 'email@test.com',
                        phone: {
                            area_code: '55',
                            number: student.phone ? student.phone.replace(/\D/g, '') : '999999999'
                        }
                    },
                    external_reference: payment._id.toString(),
                    back_urls: {
                        success: `${process.env.CORS_ORIGIN || 'http://localhost:8080'}/franqueado.html?status=success`,
                        failure: `${process.env.CORS_ORIGIN || 'http://localhost:8080'}/franqueado.html?status=failure`,
                        pending: `${process.env.CORS_ORIGIN || 'http://localhost:8080'}/franqueado.html?status=pending`
                    },
                    auto_return: 'approved',
                    notification_url: `${process.env.API_URL || 'https://arenahub.ngrok.io'}/api/v1/payments/webhook`
                }
            };

            const result = await preference.create(preferenceData);

            payment.externalReference = result.id;
            await payment.save();

            res.status(201).json({
                message: 'Preference created',
                preferenceId: result.id,
                initPoint: result.init_point,
                sandboxInitPoint: result.sandbox_init_point,
                paymentId: payment._id
            });

        } catch (error: any) {
            console.error('Error creating payment preference:', error);
            res.status(500).json({ message: 'Internal Server Error', error: error.message });
        }
    },

    /**
     * Webhook Handler
     */
    handleWebhook: async (req: Request, res: Response) => {
        try {
            const topic = (req.query.topic as string) || (req.query.type as string);
            const id = (req.query.id as string) || (req.query['data.id'] as string);

            if (topic === 'payment') {
                const paymentClient = new MercadoPago.Payment(client);
                const mpPayment = await paymentClient.get({ id });

                if (mpPayment) {
                    const localId = mpPayment.external_reference;
                    const status = mpPayment.status;
                    const approvedDate = mpPayment.date_approved;

                    const payment = await Payment.findById(localId);
                    if (payment) {
                        const statusMap: any = {
                            approved: 'approved',
                            pending: 'pending',
                            in_process: 'pending',
                            rejected: 'rejected',
                            refunded: 'refunded',
                            cancelled: 'cancelled'
                        };

                        payment.status = statusMap[status] || status;
                        payment.transactionId = String(id);
                        payment.paymentMethod = mpPayment.payment_method_id;
                        if (approvedDate) payment.paidAt = new Date(approvedDate);

                        await payment.save();

                        if (payment.status === 'approved') {
                            await Student.findByIdAndUpdate(payment.studentId, {
                                paymentStatus: 'Paga',
                                note: `Pagamento confirmado em ${new Date().toLocaleDateString()}`
                            });
                            console.log(`✅ Payment approved for Student ${payment.studentId}`);
                        }
                    }
                }
            }

            res.status(200).send('OK');
        } catch (error) {
            console.error('Webhook Error:', error);
            res.status(500).send('Error');
        }
    },

    /**
     * Get payment history for a student
     */
    getByStudent: async (req: Request, res: Response) => {
        try {
            const { studentId } = req.params;

            const payments = await Payment.find({ studentId })
                .sort({ createdAt: -1 })
                .populate('franchiseId', 'name');

            res.status(200).json({
                success: true,
                count: payments.length,
                data: payments
            });
        } catch (error) {
            console.error('Error fetching student payments:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching payment history'
            });
        }
    }
};

export default paymentController;
