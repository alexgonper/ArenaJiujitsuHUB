const express = require('express');
const router = express.Router();
const {
    getAllFranchises,
    getFranchise,
    createFranchise,
    updateFranchise,
    deleteFranchise,
    getNearbyFranchises,
    getNetworkStats,
    getTopFranchises
} = require('../controllers/franchiseController');

// Stats routes (must be before :id routes)
router.get('/stats/network', getNetworkStats);
router.get('/stats/top', getTopFranchises);

// Geospatial routes
router.get('/nearby/:lng/:lat', getNearbyFranchises);

// CRUD routes
router.route('/')
    .get(getAllFranchises)
    .post(createFranchise);

router.route('/:id')
    .get(getFranchise)
    .put(updateFranchise)
    .delete(deleteFranchise);

module.exports = router;
