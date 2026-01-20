import express from 'express';
import {
    getAllDirectives,
    getDirective,
    createDirective,
    updateDirective,
    deleteDirective,
    acknowledgeDirective,
    getRecentDirectives,
    getUrgentDirectives
} from '../controllers/directiveController';

const router = express.Router();

// Special routes (must be before :id routes)
router.get('/recent/:limit?', getRecentDirectives);
router.get('/urgent', getUrgentDirectives);

// Acknowledge route
router.post('/:id/acknowledge', acknowledgeDirective);

// CRUD routes
router.route('/')
    .get(getAllDirectives)
    .post(createDirective);

router.route('/:id')
    .get(getDirective)
    .put(updateDirective)
    .delete(deleteDirective);

export default router;
