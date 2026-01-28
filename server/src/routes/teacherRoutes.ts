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
    removeAttendance,
    getTeacherSchedule,
    getTeacherGraduations
} from '../controllers/teacherController';

const router = express.Router();

router.post('/login', login);
router.post('/attendance', markAttendance);
router.delete('/attendance', removeAttendance);
router.get('/classes/:classId/attendance', getClassAttendance);

router
    .route('/')
    .get(getTeachers)
    .post(createTeacher);

router.get('/:id/dashboard', getDashboard);
router.get('/:id/students', getStudentsForAttendance);
router.get('/:id/schedule', getTeacherSchedule);
router.get('/:id/graduations', getTeacherGraduations);

router
    .route('/:id')
    .get(getTeacher)
    .put(updateTeacher)
    .delete(deleteTeacher);

export default router;
