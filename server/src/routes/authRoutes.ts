import express from 'express';
import authController from '../controllers/authController';

const router = express.Router();

// POST /api/v1/auth/student/login - Student login
router.post('/student/login', authController.studentLogin);

export default router;
