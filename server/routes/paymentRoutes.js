const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// POST /api/v1/payments/checkout - Create a new payment link
router.post('/checkout', paymentController.createPreference);

// POST /api/v1/payments/webhook - Receive updates from Mercado Pago
router.post('/webhook', paymentController.handleWebhook);

// GET /api/v1/payments/student/:studentId - Get payment history for a student
router.get('/student/:studentId', paymentController.getByStudent);

module.exports = router;
