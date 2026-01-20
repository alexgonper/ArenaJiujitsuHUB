import express from 'express';
import { getLayout, saveLayout } from '../controllers/dashboardController';

const router = express.Router();

router.route('/layout')
    .get(getLayout)
    .post(saveLayout);

export default router;
