import express from 'express';
import studentController from '../controllers/studentController';

const router = express.Router();

// ==========================
// PORTAL ROUTES (PHASE 2)
// ==========================
router.post('/login', studentController.login);
router.post('/checkin', studentController.checkIn);
router.get('/dashboard/:studentId', studentController.getDashboard);
router.get('/:studentId/dashboard', studentController.getDashboard);
router.get('/ranking/:franchiseId', studentController.getLeaderboard);
router.get('/badges/:studentId', studentController.getBadges);

// ==========================
// ADMIN / CRUD ROUTES
// ==========================
router.get('/', studentController.getAllStudents);
router.post('/', studentController.createStudent);
router.get('/:id', studentController.getStudentById);
router.put('/:id', studentController.updateStudent);
router.delete('/:id', studentController.deleteStudent);

export default router;
