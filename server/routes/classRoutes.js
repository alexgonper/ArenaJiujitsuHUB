const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');

router.get('/franchise/:franchiseId', classController.getSchedule);
router.post('/', classController.createClass);
router.post('/seed/:franchiseId', classController.seedClasses);

module.exports = router;
