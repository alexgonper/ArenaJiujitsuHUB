const express = require('express');
const router = express.Router();
const {
    getFranchiseMetrics,
    getNetworkMetrics,
    createMetric
} = require('../controllers/metricController');

router.route('/')
    .post(createMetric);

router.route('/network/summary')
    .get(getNetworkMetrics);

router.route('/:franchiseId')
    .get(getFranchiseMetrics);

module.exports = router;
