const MercadoPago = require('mercadopago');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const Franchise = require('../models/Franchise');

// Initialize Mercado Pago
// Note: In production, use process.env.MERCADO_PAGO_ACCESS_TOKEN
const client = new MercadoPago.MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || 'TEST-00000000-0000-0000-0000-000000000000'
});

const paymentController = {

    /**
     * Create a Checkout Preference
     * Generates a link for the user to pay
     */
    createPreference: async (req, res) => {
        try {
            const { studentId, description, type, amount } = req.body;
            // Franchise is inferred from the logged-in user or passed explicitly
            const franchiseId = req.body.franchiseId || req.user?.franchiseId;

            if (!franchiseId || !studentId || !amount) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            const franchise = await Franchise.findById(franchiseId);
            const student = await Student.findById(studentId);

            if (!franchise || !student) {
                return res.status(404).json({ message: 'Franchise or Student not found' });
            }

            // Calculate Split / Application Fee
            // Allows Matrix to take a cut (e.g., 10%)
            const royaltyPercent = franchise.royaltyPercent || 10;
            const matrixFee = (amount * royaltyPercent) / 100;
            const franchiseIncome = amount - matrixFee;

            // Create local Payment record first (Pending)
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

            // Prepare Mercado Pago Preference
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
                        email: student.email || 'email@test.com', // MP Requires email
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
                    // Application Fee for Marketplace Split (Requires OAuth setup)
                    // marketplace_fee: matrixFee, 
                    notification_url: `${process.env.API_URL || 'https://arenahub.ngrok.io'}/api/v1/payments/webhook`
                }
            };

            const result = await preference.create(preferenceData);

            // Update payment with preference ID
            payment.externalReference = result.id;
            await payment.save();

            res.status(201).json({
                message: 'Preference created',
                preferenceId: result.id,
                initPoint: result.init_point, // URL to redirect user
                sandboxInitPoint: result.sandbox_init_point,
                paymentId: payment._id
            });

        } catch (error) {
            console.error('Error creating payment preference:', error);
            res.status(500).json({ message: 'Internal Server Error', error: error.message });
        }
    },

    /**
     * Webhook Handler
     * Receives updates from Mercado Pago
     */
    handleWebhook: async (req, res) => {
        try {
            const topic = req.query.topic || req.query.type;
            const id = req.query.id || req.query['data.id'];

            if (topic === 'payment') {
                const paymentClient = new MercadoPago.Payment(client);
                const mpPayment = await paymentClient.get({ id });

                if (mpPayment) {
                    const localId = mpPayment.external_reference;
                    const status = mpPayment.status;
                    const approvedDate = mpPayment.date_approved;

                    // Update Local Payment
                    const payment = await Payment.findById(localId);
                    if (payment) {
                        // Map MP status to our status
                        const statusMap = {
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

                        // Business Logic: If Approved, update Student status
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
            res.status(500).send('Error'); // MP retries if we fail
        }
    },

    /**
     * Get payment history for a student
     */
    getByStudent: async (req, res) => {
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

module.exports = paymentController;
