const express = require('express');
const router = express.Router();
const {
    getAllDirectives,
    getDirective,
    createDirective,
    updateDirective,
    deleteDirective,
    acknowledgeDirective,
    getRecentDirectives,
    getUrgentDirectives
} = require('../controllers/directiveController');

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

module.exports = router;
