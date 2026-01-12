const express = require('express');
const router = express.Router();
const { getLayout, saveLayout } = require('../controllers/dashboardController');

router.route('/layout')
    .get(getLayout)
    .post(saveLayout);

module.exports = router;
