const express = require('express');
const router = express.Router();
const { getItrackerStats } = require('../controllers/itrackerStatsController');

router.get('/', getItrackerStats);

module.exports = router;
