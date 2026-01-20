import express from 'express';
import classController from '../controllers/classController';

const router = express.Router();

router.get('/franchise/:franchiseId', classController.getSchedule);
router.post('/', classController.createClass);
router.delete('/:id', classController.deleteClass);
router.put('/:id', classController.updateClass);
router.post('/seed/:franchiseId', classController.seedClasses);

export default router;
