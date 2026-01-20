import express from 'express';
import {
    getTeachers,
    getTeacher,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    login,
    getDashboard,
    getStudentsForAttendance,
    markAttendance,
    getClassAttendance,
    removeAttendance
} from '../controllers/teacherController';

const router = express.Router();

router
    .route('/')
    .get(getTeachers)
    .post(createTeacher);

router
    .route('/:id')
    .get(getTeacher)
    .put(updateTeacher)
    .delete(deleteTeacher);

router.post('/login', login);
router.get('/:id/dashboard', getDashboard);
router.get('/:id/students', getStudentsForAttendance);
router.post('/attendance', markAttendance);
router.delete('/attendance', removeAttendance);
router.get('/classes/:classId/attendance', getClassAttendance);

export default router;
