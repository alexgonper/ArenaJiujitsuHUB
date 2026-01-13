const express = require('express');
const router = express.Router();
const graduationController = require('../controllers/graduationController');

// GET /api/v1/graduation/eligibility/:studentId - Check if a student is eligible
router.get('/eligibility/:studentId', graduationController.checkEligibility);

// POST /api/v1/graduation/promote - Process student promotion
router.post('/promote', graduationController.promoteStudent);

// GET /api/v1/graduation/eligible/:franchiseId - Get all eligible students in a franchise
router.get('/eligible/:franchiseId', graduationController.getEligibleInFranchise);

module.exports = router;
