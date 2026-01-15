const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Create a booking
router.post('/', bookingController.createBooking);

// Cancel a booking
router.delete('/:id', bookingController.cancelBooking);

// List bookings (for teacher view of a specific class)
router.get('/list', bookingController.listBookings);

// Get student's active bookings
router.get('/student/:studentId', bookingController.getStudentBookings);

module.exports = router;
