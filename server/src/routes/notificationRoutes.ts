import express from 'express';
import * as notificationController from '../controllers/notificationController';

const router = express.Router();

router.get('/:recipientId', notificationController.getNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/:recipientId/read-all', notificationController.markAllAsRead);

export default router;
