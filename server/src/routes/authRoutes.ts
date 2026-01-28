import express from 'express';
import authController from '../controllers/authController';

const router = express.Router();

// POST /api/v1/auth/student/login - Student login
router.post('/student/login', authController.studentLogin);

// POST /api/v1/auth/teacher/login - Teacher login
router.post('/login-teacher', authController.teacherLogin); // Matching my App.js

// POST /api/v1/auth/student-login-check - Global student check
router.post('/student-login-check', authController.studentLoginCheck);

export default router;
