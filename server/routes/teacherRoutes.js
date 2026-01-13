const express = require('express');
const router = express.Router();
const {
    getTeachers,
    getTeacher,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    login,
    getDashboard,
    getStudentsForAttendance,
    markAttendance
} = require('../controllers/teacherController');

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

module.exports = router;
