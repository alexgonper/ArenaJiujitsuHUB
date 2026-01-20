import express from 'express';
import bookingController from '../controllers/bookingController';

const router = express.Router();

router.post('/', bookingController.createBooking);
router.delete('/:id', bookingController.cancelBooking);
router.get('/list', bookingController.listBookings);
router.get('/student/:studentId', bookingController.getStudentBookings);

export default router;
