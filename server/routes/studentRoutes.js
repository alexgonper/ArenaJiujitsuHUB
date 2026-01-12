const express = require('express');
const router = express.Router();

const {
    getStudents,
    getStudent,
    createStudent,
    updateStudent,
    deleteStudent,
    getStudentStats,
    updatePaymentStatus
} = require('../controllers/studentController');

// Routes
router.route('/')
    .get(getStudents)
    .post(createStudent);

router.route('/stats/:franchiseId')
    .get(getStudentStats);

router.route('/:id')
    .get(getStudent)
    .put(updateStudent)
    .delete(deleteStudent);

router.route('/:id/payment')
    .patch(updatePaymentStatus);

module.exports = router;
