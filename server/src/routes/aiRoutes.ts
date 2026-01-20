import express from 'express';
import { generateContent, generateImage } from '../controllers/aiController';

const router = express.Router();

router.post('/generate', generateContent);
router.post('/image', generateImage);

export default router;
