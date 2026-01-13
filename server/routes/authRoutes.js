const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/v1/auth/student/login - Student login
router.post('/student/login', authController.studentLogin);

module.exports = router;
