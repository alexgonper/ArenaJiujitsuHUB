const express = require('express');
const router = express.Router();
const { generateContent, generateImage } = require('../controllers/aiController');

router.post('/generate', generateContent);
router.post('/image', generateImage);

module.exports = router;
