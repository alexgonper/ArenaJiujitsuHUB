import express from 'express';
import {
    getFranchiseMetrics,
    getNetworkMetrics,
    createMetric
} from '../controllers/metricController';

const router = express.Router();

router.route('/')
    .post(createMetric);

router.route('/network/summary')
    .get(getNetworkMetrics);

router.route('/:franchiseId')
    .get(getFranchiseMetrics);

export default router;
